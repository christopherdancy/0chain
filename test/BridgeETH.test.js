const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent")
const MintBurn = artifacts.require("MintBurn")
const BridgeETH = artifacts.require("BridgeETH")
const toBN = web3.utils.toBN

contract("BridgeETH", (accounts) => {
  let MintBurnInstance
  let BridgeETHInstance

  const [owner, minter, burner, admin, user1BSC, user1ETH, releaserBridge, adminBridge, newReleaser ] = accounts;

  const amount = new BN('1000');
  const mintamount = new BN('20000');
  const RELEASER_ROLE = Buffer.from(web3.utils.keccak256("RELEASER_ROLE").substring(2), "hex");
  const ADMIN_ROLE = Buffer.from(web3.utils.keccak256("ADMIN_ROLE").substring(2), "hex");

  describe("When deploying contract", () => {
    beforeEach(async () => {
      MintBurnInstance = await MintBurn.new( minter, burner, admin, { from: owner });
      BridgeETHInstance = await BridgeETH.new( MintBurnInstance.address, releaserBridge, adminBridge, { from: owner });
    })

    it("should set the correct token interface", async () => {
    expect(await BridgeETHInstance.token()).to.equal(MintBurnInstance.address);
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

  describe("When granting and revoking roles", () => {
    beforeEach(async () => {
      MintBurnInstance = await MintBurn.new( minter, burner, admin, { from: owner });
      BridgeETHInstance = await BridgeETH.new( MintBurnInstance.address, releaserBridge, adminBridge, { from: owner });    
    })

    it("should be able to add a new releaser", async () => {
      await BridgeETHInstance.grantReleaserRole(newReleaser, { from: adminBridge });
      expect(await BridgeETHInstance.hasRole(RELEASER_ROLE, newReleaser)).to.be.true;
    })

    it("non- admin revert granting releasing role", async () => {
      await expectRevert(
        BridgeETHInstance.grantReleaserRole(newReleaser, { from: user1BSC }),
        "AccessControl: account 0x0d1d4e623d10f9fba5db95830f7d3839406c6af2 is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
      )
    })

    it("should be able to remove the new releaser", async () => {
      await BridgeETHInstance.grantReleaserRole(newReleaser, { from: adminBridge });
      await BridgeETHInstance.revokeReleaserRole(newReleaser, { from: adminBridge });
      expect(await BridgeETHInstance.hasRole(RELEASER_ROLE, newReleaser)).to.be.false;
    })

    it("non-admin revert revoking releaser role", async () => {
      await BridgeETHInstance.grantReleaserRole(newReleaser, { from: adminBridge });
      await expectRevert(
        BridgeETHInstance.revokeReleaserRole(newReleaser, { from: user1BSC }),
        "AccessControl: account 0x0d1d4e623d10f9fba5db95830f7d3839406c6af2 is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
      )
    })
  })

  describe("When transfering tokens to BSC", () => {
    beforeEach(async () => {
      MintBurnInstance = await MintBurn.new( minter, burner, admin, { from: owner });
      BridgeETHInstance = await BridgeETH.new( MintBurnInstance.address, releaserBridge, adminBridge, { from: owner });
      await MintBurnInstance.mint(user1ETH, mintamount, { from: minter });
      await MintBurnInstance.approve(BridgeETHInstance.address, amount, { from: user1ETH });
    })

    it("transfering to BSC should increase Bridge Balalnce", async () => {
      expect(await MintBurnInstance.balanceOf(BridgeETHInstance.address)).to.be.bignumber.that.equals("0");
      await BridgeETHInstance.transferFromETHToBSC(user1BSC, amount, { from: user1ETH });
      expect(await MintBurnInstance.balanceOf(BridgeETHInstance.address)).to.be.bignumber.that.equals("1000");
    })

    it("locking up funds should NOT decrease total supply", async () => {
      expect(await MintBurnInstance.totalSupply()).to.be.bignumber.that.equals("20000");
      await BridgeETHInstance.transferFromETHToBSC(user1BSC, amount, { from: user1ETH });
      expect(await MintBurnInstance.totalSupply()).to.be.bignumber.that.equals("20000");
    })

    it("Should increase nonce", async () => {
      expect(await BridgeETHInstance.nonce()).to.be.bignumber.that.equals("0");
      await BridgeETHInstance.transferFromETHToBSC(user1BSC, amount, { from: user1ETH });
      expect(await BridgeETHInstance.nonce()).to.be.bignumber.that.equals("1");
    })

    it("insufficient balance reverts transferToBSC", async () => {
      await expectRevert(
        BridgeETHInstance.transferFromETHToBSC(user1ETH, amount, { from: user1BSC }),
        "ERC20: transfer amount exceeds balance."
      )
    })

    it("insufficient balance of contract reverts transferToBSC", async () => {
      await expectRevert(
        BridgeETHInstance.transferFromETHToBSC(user1BSC, mintamount, { from: BridgeETHInstance.address }),
        "ERC20: transfer amount exceeds balance."
      )
    })

    it("Should emit Transfer Event", async () => {
      currentNonce = await BridgeETHInstance.nonce();
      const { logs } = await BridgeETHInstance.transferFromETHToBSC(user1BSC, amount, { from: user1ETH });
      currentTime = await time.latest();
      expectEvent.inLogs(logs, 'Transfer', {
        from: user1ETH,
        to: user1BSC,
        amount: amount,
        date: currentTime,
        nonce: currentNonce,
        step: "0",
      });    
    })
  })

  describe("When transfering tokens to ETH", () => {
    beforeEach(async () => {
      MintBurnInstance = await MintBurn.new( minter, burner, admin, { from: owner });
      BridgeETHInstance = await BridgeETH.new( MintBurnInstance.address, releaserBridge, adminBridge, { from: owner });
      await MintBurnInstance.mint(user1BSC, mintamount, { from: minter });
      await MintBurnInstance.approve(BridgeETHInstance.address, amount, { from: user1BSC });
      await BridgeETHInstance.transferFromETHToBSC(user1ETH, amount, { from: user1BSC });
    })

    it("transfering to ETH should increase balance", async () => {
      expect(await MintBurnInstance.balanceOf(user1ETH)).to.be.bignumber.that.equals("0");
      await BridgeETHInstance.transferFromBSCToETH(user1BSC, user1ETH, amount, 0, { from: releaserBridge });
      expect(await MintBurnInstance.balanceOf(user1ETH)).to.be.bignumber.that.equals("1000");
    })

    it("Processed Nonce should update to true", async () => {
      expect(await BridgeETHInstance.processedNonces(0)).to.be.false;
      await BridgeETHInstance.transferFromBSCToETH(user1BSC, user1ETH, amount, 0, { from: releaserBridge });
      expect(await BridgeETHInstance.processedNonces(0)).to.be.true;
    })

    it ("non-ETH releaser should revert", async () => {
      await expectRevert(
        BridgeETHInstance.transferFromBSCToETH(user1BSC, user1ETH, amount, 0, { from: user1ETH }),
        "Caller is not a releaser"
      )
    })
    
    it("revert already processed nonce", async () => {
      await BridgeETHInstance.transferFromBSCToETH(user1BSC, user1ETH, amount, 0, { from: releaserBridge });
      await expectRevert(
        BridgeETHInstance.transferFromBSCToETH(user1BSC, user1ETH, amount, 0, { from: releaserBridge }),
        "transfer already processed"
      )
    })

    it("Should emit Transfer Event", async () => {
      currentNonce = await BridgeETHInstance.nonce();
      const { logs } = await await BridgeETHInstance.transferFromBSCToETH(user1BSC, user1ETH, amount, currentNonce, { from: releaserBridge });
      currentTime = await time.latest();
      expectEvent.inLogs(logs, 'Transfer', {
        from: user1BSC,
        to: user1ETH,
        amount: amount,
        date: currentTime,
        nonce: currentNonce,
        step: "1",
      });    
    })
  })
})
