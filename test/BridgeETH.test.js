const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent")
const ZeroChainToken = artifacts.require("ZeroChainToken");
const BridgeETH = artifacts.require("BridgeETH")

contract("BridgeETH", (accounts) => {
  let ZeroChainTokenInstance
  let BridgeETHInstance

  const [admin, BSCTokenUser, ETHTokenUser, dev, bridge ] = accounts;

  const amount = new BN('1000');
  const mintamount = new BN('20000');

  describe("When deploying contract", () => {
    beforeEach(async () => {
      ZeroChainTokenInstance = await ZeroChainToken.new( "0x0000000000000000000000000000000000000000", admin, { from: dev });
      BridgeETHInstance = await BridgeETH.new( ZeroChainTokenInstance.address, admin, { from: dev });
    })

    it("should set the correct token interface", async () => {
    expect(await BridgeETHInstance.token()).to.equal(ZeroChainTokenInstance.address);
    })
    
    it("nonce should be 0", async () => {
      expect(await BridgeETHInstance.nonce()).to.be.bignumber.that.equals("0");
    })

    it("nonce processed mapping should be false", async () => {
      expect(await BridgeETHInstance.processedNonces(0)).to.be.false;
      expect(await BridgeETHInstance.processedNonces(1)).to.be.false;
      expect(await BridgeETHInstance.processedNonces(2)).to.be.false;
    })
  })

  describe("When transfering tokens from ETH to BSC", () => {
    beforeEach(async () => {
      ZeroChainTokenInstance = await ZeroChainToken.new( "0x0000000000000000000000000000000000000000", admin, { from: dev });
      BridgeETHInstance = await BridgeETH.new( ZeroChainTokenInstance.address, admin, { from: dev });
      //only used to mint initial tokens
      await ZeroChainTokenInstance.grantBridgeRole(bridge, { from: admin });
      await ZeroChainTokenInstance.grantBridgeRole(BridgeETHInstance.address, { from: admin });
      await ZeroChainTokenInstance.mint(ETHTokenUser, mintamount, { from: bridge });
      
      await ZeroChainTokenInstance.approve(BridgeETHInstance.address, amount, { from: ETHTokenUser });
    })

    it("transfering to BSC should increase Bridge Balalnce", async () => {
      expect(await ZeroChainTokenInstance.balanceOf(BridgeETHInstance.address)).to.be.bignumber.that.equals("0");
      await BridgeETHInstance.transferToBSC(BSCTokenUser, amount, { from: ETHTokenUser });
      expect(await ZeroChainTokenInstance.balanceOf(BridgeETHInstance.address)).to.be.bignumber.that.equals("1000");
    })

    it("locking up funds should NOT decrease total supply", async () => {
      expect(await ZeroChainTokenInstance.totalSupply()).to.be.bignumber.that.equals("20000");
      await BridgeETHInstance.transferToBSC(BSCTokenUser, amount, { from: ETHTokenUser });
      expect(await ZeroChainTokenInstance.totalSupply()).to.be.bignumber.that.equals("20000");
    })

    it("Should increase nonce", async () => {
      expect(await BridgeETHInstance.nonce()).to.be.bignumber.that.equals("0");
      await BridgeETHInstance.transferToBSC(BSCTokenUser, amount, { from: ETHTokenUser });
      expect(await BridgeETHInstance.nonce()).to.be.bignumber.that.equals("1");
    })

    it("insufficient balance reverts transferToBSC", async () => {
      await expectRevert(
        BridgeETHInstance.transferToBSC(BSCTokenUser, amount, { from: BSCTokenUser }),
        "ERC20: transfer amount exceeds balance."
      )
    })

    it("Should emit Transfer Event", async () => {
      currentNonce = await BridgeETHInstance.nonce();
      const { logs } = await BridgeETHInstance.transferToBSC(BSCTokenUser, amount, { from: ETHTokenUser });
      currentTime = await time.latest();
      expectEvent.inLogs(logs, 'TransferingToBSC', {
        to: BSCTokenUser,
        amount: amount,
        date: currentTime,
        nonce: currentNonce,
      });    
    })
  })

  describe("When transfering tokens from BSC to ETH", () => {
    beforeEach(async () => {
      ZeroChainTokenInstance = await ZeroChainToken.new( "0x0000000000000000000000000000000000000000", admin, { from: dev });
      BridgeETHInstance = await BridgeETH.new( ZeroChainTokenInstance.address, admin, { from: dev });
      //only used to mint initial tokens
      await ZeroChainTokenInstance.grantBridgeRole(bridge, { from: admin });
      await ZeroChainTokenInstance.grantBridgeRole(BridgeETHInstance.address, { from: admin });
      await ZeroChainTokenInstance.mint(BSCTokenUser, mintamount, { from: bridge });
      
      await ZeroChainTokenInstance.approve(BridgeETHInstance.address, amount, { from: BSCTokenUser });
      await BridgeETHInstance.transferToBSC(dev, amount, { from: BSCTokenUser });
    })

    it("transfering to ETH should increase balance", async () => {
      expect(await ZeroChainTokenInstance.balanceOf(ETHTokenUser)).to.be.bignumber.that.equals("0");
      await BridgeETHInstance.returnToETH( ETHTokenUser, amount, 0, { from: admin });
      expect(await ZeroChainTokenInstance.balanceOf(ETHTokenUser)).to.be.bignumber.that.equals("1000");
    })

    it("Processed Nonce should update to true", async () => {
      expect(await BridgeETHInstance.processedNonces(0)).to.be.false;
      await BridgeETHInstance.returnToETH( ETHTokenUser, amount, 0, { from: admin });
      expect(await BridgeETHInstance.processedNonces(0)).to.be.true;
    })

    it("non-ETH releaser should revert", async () => {
      await expectRevert(
        BridgeETHInstance.returnToETH( ETHTokenUser, amount, 0, { from: ETHTokenUser }),
        "Caller is not an admin"
      )
    })
    
    it("revert already processed nonce", async () => {
      await BridgeETHInstance.returnToETH( ETHTokenUser, amount, 0, { from: admin });
      await expectRevert(
        BridgeETHInstance.returnToETH( ETHTokenUser, amount, 0, { from: admin }),
        "transfer already processed"
      )
    })

    it("Should emit Transfer Event", async () => {
      currentNonce = await BridgeETHInstance.nonce();
      const { logs } = await BridgeETHInstance.returnToETH( ETHTokenUser, amount, currentNonce, { from: admin });
      currentTime = await time.latest();
      expectEvent.inLogs(logs, 'ReturningToEth', {
        to: ETHTokenUser,
        amount: amount,
        date: currentTime,
        nonce: currentNonce,
      });    
    })
  })
})
