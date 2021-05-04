const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent")
const MintBurn = artifacts.require("MintBurn")
const BridgeBSC = artifacts.require("BridgeBSC")
const toBN = web3.utils.toBN

contract("BridgeBSC", (accounts) => {
  let MintBurnInstance
  let BridgeBSCInstance

  const [owner, minter, burner, admin, user1BSC, user1ETH, minterBridge, adminBridge ] = accounts;

  const amount = new BN('1000');
  const mintamount = new BN('20000');
  const MINTER_ROLE = Buffer.from(web3.utils.keccak256("MINTER_ROLE").substring(2), "hex");
  const BURNER_ROLE = Buffer.from(web3.utils.keccak256("BURNER_ROLE").substring(2), "hex");
  const ADMIN_ROLE = Buffer.from(web3.utils.keccak256("ADMIN_ROLE").substring(2), "hex");

  describe("When deploying contract", () => {
    beforeEach(async () => {
      MintBurnInstance = await MintBurn.new( minter, burner, admin, { from: owner });
      BridgeBSCInstance = await BridgeBSC.new( MintBurnInstance.address, minterBridge, adminBridge, { from: owner });
    })

    it("should set the correct token interface", async () => {
    expect(await BridgeBSCInstance.token()).to.equal(MintBurnInstance.address);
    })
    
    it("nonce should be 0", async () => {
      expect(await BridgeBSCInstance.nonce()).to.be.bignumber.that.equals("0");
    })

    it("nonce processed mapping should be false", async () => {
      expect(await BridgeBSCInstance.processedNonces(0)).to.be.false;
      expect(await BridgeBSCInstance.processedNonces(0)).to.be.false;
      expect(await BridgeBSCInstance.processedNonces(0)).to.be.false;
    })
  })

  describe("When transfering tokens to ETH", () => {
    beforeEach(async () => {
      MintBurnInstance = await MintBurn.new( minter, burner, admin, { from: owner });
      BridgeBSCInstance = await BridgeBSC.new( MintBurnInstance.address, minterBridge, adminBridge, { from: owner });
      await MintBurnInstance.grantBurnerRole(BridgeBSCInstance.address, { from: admin });
      await MintBurnInstance.mint(user1BSC, mintamount, { from: minter });
    })

    it("Burning BSC tokens should decrease user's account", async () => {
      expect(await MintBurnInstance.balanceOf(user1BSC)).to.be.bignumber.that.equals("20000");
      await BridgeBSCInstance.transferToETH(user1ETH, amount, { from: user1BSC });
      expect(await MintBurnInstance.balanceOf(user1BSC)).to.be.bignumber.that.equals("19000");
    })

    it("Burning BSC tokens should decrease total supply", async () => {
      expect(await MintBurnInstance.totalSupply()).to.be.bignumber.that.equals("20000");
      await BridgeBSCInstance.transferToETH(user1ETH, amount, { from: user1BSC });
      expect(await MintBurnInstance.totalSupply()).to.be.bignumber.that.equals("19000");
    })

    it("Should increase nonce", async () => {
      expect(await BridgeBSCInstance.nonce()).to.be.bignumber.that.equals("0");
      await BridgeBSCInstance.transferToETH(user1ETH, amount, { from: user1BSC });
      expect(await BridgeBSCInstance.nonce()).to.be.bignumber.that.equals("1");
    })

    it("insufficient balance reverts transferToBSC", async () => {
      await expectRevert(
        BridgeBSCInstance.transferToETH(user1BSC, amount, { from: user1ETH }),
        "ERC20: burn amount exceeds balance."
      )
    })

    it("insufficient balance of burner reverts transferToBSC", async () => {
      await expectRevert(
        BridgeBSCInstance.transferToETH(user1BSC, amount, { from: burner }),
        "ERC20: burn amount exceeds balance."
      )
    })

    it("Should emit Transfer Event", async () => {
      currentNonce = await BridgeBSCInstance.nonce();
      const { logs } = await BridgeBSCInstance.transferToETH(user1ETH, amount, { from: user1BSC });
      currentTime = await time.latest();
      expectEvent.inLogs(logs, 'Transfer', {
        from: user1BSC,
        to: user1ETH,
        amount: amount,
        date: currentTime,
        nonce: currentNonce,
        step: "0",
      });    
    })
  })

  describe("When transfering tokens to BSC", () => {
    beforeEach(async () => {
      MintBurnInstance = await MintBurn.new( minter, burner, admin, { from: owner });
      BridgeBSCInstance = await BridgeBSC.new( MintBurnInstance.address, minterBridge, adminBridge, { from: owner });
      await MintBurnInstance.grantBurnerRole(BridgeBSCInstance.address, { from: admin });
      await MintBurnInstance.grantMinterRole(BridgeBSCInstance.address, { from: admin });
    })

    it("Minting BSC tokens should increase user's account", async () => {
      expect(await MintBurnInstance.balanceOf(user1BSC)).to.be.bignumber.that.equals("0");
      await BridgeBSCInstance.transferToBSC(user1BSC, mintamount, 0, { from: minterBridge });
      expect(await MintBurnInstance.balanceOf(user1BSC)).to.be.bignumber.that.equals("20000");
    })

    it("Processed Nonce should update to true", async () => {
      expect(await BridgeBSCInstance.processedNonces(0)).to.be.false;
      await BridgeBSCInstance.transferToBSC(user1BSC, mintamount, 0, { from: minterBridge });
      expect(await BridgeBSCInstance.processedNonces(0)).to.be.true;
    })

    it("non-BSC minter should revert", async () => {
      await expectRevert(
        BridgeBSCInstance.transferToBSC(user1BSC, mintamount, 0, { from: minter }),
        "Caller is not a minter"
      )
    })
    
    it("revert already processed nonce", async () => {
      await MintBurnInstance.mint(user1BSC, mintamount, { from: minter });
      BridgeBSCInstance.transferToBSC(user1BSC, mintamount, 0, { from: minterBridge });
      await expectRevert(
        BridgeBSCInstance.transferToBSC(user1BSC, mintamount, 0, { from: minterBridge }),
        "transfer already processed"
      )
    })

    it("Should emit Transfer Event", async () => {
      currentNonce = await BridgeBSCInstance.nonce();
      const { logs } = await BridgeBSCInstance.transferToBSC(user1BSC, mintamount, 0, { from: minterBridge });
      currentTime = await time.latest();
      expectEvent.inLogs(logs, 'Transfer', {
        from: minterBridge,
        to: user1BSC,
        amount: mintamount,
        date: currentTime,
        nonce: currentNonce,
        step: "1",
      });    
    })
  })
})
