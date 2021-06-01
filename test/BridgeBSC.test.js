const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent")
const ZeroChainToken = artifacts.require("ZeroChainToken");
const BridgeBSC = artifacts.require("BridgeBSC")

contract("BridgeBSC", (accounts) => {
  let ZeroChainTokenInstance
  let BridgeBSCInstance

  const [admin, BSCTokenUser, ETHTokenUser, dev, bridge ] = accounts;

  const amount = new BN('1000');
  const mintamount = new BN('20000');

  describe("When deploying contract", () => {
    beforeEach(async () => {
      ZeroChainTokenInstance = await ZeroChainToken.new( "0x0000000000000000000000000000000000000000", admin, { from: dev });
      BridgeBSCInstance = await BridgeBSC.new( ZeroChainTokenInstance.address, admin, { from: dev });
    })

    it("should set the correct token interface", async () => {
    expect(await BridgeBSCInstance.token()).to.equal(ZeroChainTokenInstance.address);
    })
    
    it("nonce should be 0", async () => {
      expect(await BridgeBSCInstance.nonce()).to.be.bignumber.that.equals("0");
    })

    it("nonce processed mapping should be false", async () => {
      expect(await BridgeBSCInstance.processedNonces(0)).to.be.false;
      expect(await BridgeBSCInstance.processedNonces(1)).to.be.false;
      expect(await BridgeBSCInstance.processedNonces(2)).to.be.false;
    })
  })

  describe("When transfering tokens from BSC to ETH", () => {
    beforeEach(async () => {
      ZeroChainTokenInstance = await ZeroChainToken.new( "0x0000000000000000000000000000000000000000", admin, { from: dev });
      BridgeBSCInstance = await BridgeBSC.new( ZeroChainTokenInstance.address, admin, { from: dev });
      //only used to mint initial tokens
      await ZeroChainTokenInstance.grantBridgeRole(bridge, { from: admin });
      await ZeroChainTokenInstance.grantBridgeRole(BridgeBSCInstance.address, { from: admin });
      await ZeroChainTokenInstance.mint(BSCTokenUser, mintamount, { from: bridge });
    })

    it("Burning BSC tokens should decrease user's account", async () => {
      expect(await ZeroChainTokenInstance.balanceOf(BSCTokenUser)).to.be.bignumber.that.equals("20000");
      await BridgeBSCInstance.transferToEth(ETHTokenUser, amount, { from: BSCTokenUser });
      expect(await ZeroChainTokenInstance.balanceOf(BSCTokenUser)).to.be.bignumber.that.equals("19000");
    })

    it("Burning BSC tokens should decrease total supply", async () => {
      expect(await ZeroChainTokenInstance.totalSupply()).to.be.bignumber.that.equals("20000");
      await BridgeBSCInstance.transferToEth(ETHTokenUser, amount, { from: BSCTokenUser });
      expect(await ZeroChainTokenInstance.totalSupply()).to.be.bignumber.that.equals("19000");
    })

    it("Should increase nonce", async () => {
      expect(await BridgeBSCInstance.nonce()).to.be.bignumber.that.equals("0");
      await BridgeBSCInstance.transferToEth(ETHTokenUser, amount, { from: BSCTokenUser });
      expect(await BridgeBSCInstance.nonce()).to.be.bignumber.that.equals("1");
    })

    it("insufficient balance reverts transferToBSC", async () => {
      await expectRevert(
        BridgeBSCInstance.transferToEth(ETHTokenUser, amount, { from: ETHTokenUser }),
        "ERC20: burn amount exceeds balance."
      )
    })

    it("insufficient balance of contract reverts transferToBSC", async () => {
      await expectRevert(
        BridgeBSCInstance.transferToEth(ETHTokenUser, amount, { from: bridge }),
        "ERC20: burn amount exceeds balance."
      )
    })

    it("Should emit Transfer Event", async () => {
      currentNonce = await BridgeBSCInstance.nonce();
      const { logs } = await BridgeBSCInstance.transferToEth(ETHTokenUser, amount, { from: BSCTokenUser });
      currentTime = await time.latest();
      expectEvent.inLogs(logs, 'TransferingToEth', {
        to: ETHTokenUser,
        amount: amount,
        date: currentTime,
        nonce: currentNonce,
      });    
    })
  })

  describe("When transfering tokens from ETH to BSC", () => {
    beforeEach(async () => {
      ZeroChainTokenInstance = await ZeroChainToken.new( "0x0000000000000000000000000000000000000000", admin, { from: dev });
      BridgeBSCInstance = await BridgeBSC.new( ZeroChainTokenInstance.address, admin, { from: dev });
      //only used to mint initial tokens
      await ZeroChainTokenInstance.grantBridgeRole(bridge, { from: admin });
      await ZeroChainTokenInstance.grantBridgeRole(BridgeBSCInstance.address, { from: admin });
    })

    it("Minting BSC tokens should increase user's account", async () => {
      expect(await ZeroChainTokenInstance.balanceOf(BSCTokenUser)).to.be.bignumber.that.equals("0");
      await BridgeBSCInstance.returnToBSC( BSCTokenUser, mintamount, 0, { from: admin });
      expect(await ZeroChainTokenInstance.balanceOf(BSCTokenUser)).to.be.bignumber.that.equals("20000");
    })

    it("Processed Nonce should update to true", async () => {
      expect(await BridgeBSCInstance.processedNonces(0)).to.be.false;
      await BridgeBSCInstance.returnToBSC( BSCTokenUser, amount, 0, { from: admin });
      expect(await BridgeBSCInstance.processedNonces(0)).to.be.true;
    })

    it("non-BSC minter should revert", async () => {
      await expectRevert(
        BridgeBSCInstance.returnToBSC( BSCTokenUser, amount, 0, { from: BSCTokenUser }),
        "Caller is not an admin"
      )
    })
    
    it("revert already processed nonce", async () => {
      await BridgeBSCInstance.returnToBSC( BSCTokenUser, amount, 0, { from: admin });
      await expectRevert(
        BridgeBSCInstance.returnToBSC( BSCTokenUser, amount, 0, { from: admin }),
        "transfer already processed"
      )
    })

    it("Should emit Transfer Event", async () => {
      currentNonce = await BridgeBSCInstance.nonce();
      const { logs } = await BridgeBSCInstance.returnToBSC( BSCTokenUser, amount, 0, { from: admin });
      currentTime = await time.latest();
      expectEvent.inLogs(logs, 'ReturningToBSC', {
        to: BSCTokenUser,
        amount: amount,
        date: currentTime,
        nonce: currentNonce,
      });    
    })
  })
})
