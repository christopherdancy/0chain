const { BN, expectRevert} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const MintBurn = artifacts.require("MintBurn")
const toBN = web3.utils.toBN

contract("MintBurn", (accounts) => {
  let MintBurnInstance

  const [owner, minter, burner, user1, admin, newMinter, newBurner] = accounts;

  const amount = new BN('1000');
  const mintamount = new BN('20000');
  const MINTER_ROLE = Buffer.from(web3.utils.keccak256("MINTER_ROLE").substring(2), "hex");
  const BURNER_ROLE = Buffer.from(web3.utils.keccak256("BURNER_ROLE").substring(2), "hex");
  const ADMIN_ROLE = Buffer.from(web3.utils.keccak256("ADMIN_ROLE").substring(2), "hex");

  describe("When setting up access control", () => {
    beforeEach(async () => {
      MintBurnInstance = await MintBurn.new( minter, burner, owner, { from: owner });
      await MintBurnInstance.mint(burner, mintamount, { from: minter });
    })

    it("should update the minter's address on deployment", async () => {
    expect(await MintBurnInstance.hasRole(MINTER_ROLE, minter)).to.be.true;
    })
    
    it("should update the burner's address on deployment", async () => {
      expect(await MintBurnInstance.hasRole(BURNER_ROLE, burner)).to.be.true;
    })

    it("should update the admins's address on deployment", async () => {
      expect(await MintBurnInstance.hasRole(ADMIN_ROLE, owner)).to.be.true;
    })
  })

  describe("When deploying an erc20 with mintable + burnable funciton", () => {
    beforeEach(async () => {
      MintBurnInstance = await MintBurn.new( minter, burner, owner, { from: owner });
      await MintBurnInstance.mint(user1, mintamount, { from: minter });
    })

    it("should update the users balance", async () => {
      expect(await MintBurnInstance.balanceOf(user1)).to.be.bignumber.that.equals("20000");
    })

    it("the total supply should be equal to the total minted", async () => {
      expect(await MintBurnInstance.totalSupply()).to.be.bignumber.that.equals("20000");
    })

    it("should override decimals to 8", async () => {
      expect(await MintBurnInstance.decimals()).to.be.bignumber.that.equals("8");
    })

    it("the balanceOf the user decreases with burning", async () => {
      await MintBurnInstance.burn(user1, amount, { from: burner });
      expect(await MintBurnInstance.balanceOf(user1)).to.be.bignumber.that.equals("19000");
    })

    it("minting from non-minter role should revert", async () => {
      await expectRevert(
        MintBurnInstance.mint(user1, mintamount, { from: user1 }),
        "Caller is not a minter"
      )
    })

    it("burning from non-burner role should revert", async () => {
      await expectRevert(
        MintBurnInstance.burn(user1, mintamount, { from: user1 }),
        "Caller is not a burner"
      )
    })
  })
  describe("When granting and revoking roles", () => {
    beforeEach(async () => {
      MintBurnInstance = await MintBurn.new( minter, burner, admin, { from: owner });
    })

    it("should be able to add a new minter", async () => {
      await MintBurnInstance.grantMinterRole(newMinter, { from: admin });
      expect(await MintBurnInstance.hasRole(MINTER_ROLE, newMinter)).to.be.true;
    })

    it("non- admin rever granting minting role", async () => {
      await expectRevert(
        MintBurnInstance.grantMinterRole(newMinter, { from: user1 }),
        "AccessControl: account 0x821aea9a577a9b44299b9c15c88cf3087f3b5544 is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
      )
    })

    it("should be able to add a new burner", async () => {
      await MintBurnInstance.grantBurnerRole(newBurner, { from: admin });
      expect(await MintBurnInstance.hasRole(BURNER_ROLE, newBurner)).to.be.true;
    })

    it("non-admin revert granting burner role", async () => {
      await expectRevert(
        MintBurnInstance.grantBurnerRole(newBurner, { from: user1 }),
        "AccessControl: account 0x821aea9a577a9b44299b9c15c88cf3087f3b5544 is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
      )
    })

    it("should be able to remove the new minter", async () => {
      await MintBurnInstance.grantMinterRole(newMinter, { from: admin });
      await MintBurnInstance.revokeMinterRole(newMinter, { from: admin });
      expect(await MintBurnInstance.hasRole(MINTER_ROLE, newMinter)).to.be.false;
    })

    it("non-admin revert revoking minter role", async () => {
      await expectRevert(
        MintBurnInstance.revokeMinterRole(newMinter, { from: user1 }),
        "AccessControl: account 0x821aea9a577a9b44299b9c15c88cf3087f3b5544 is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
      )
    })

    it("should be able to remove the new burner", async () => {
      await MintBurnInstance.grantBurnerRole(newBurner, { from: admin });
      await MintBurnInstance.revokeBurnerRole(newBurner, { from: admin });
      expect(await MintBurnInstance.hasRole(BURNER_ROLE, newBurner)).to.be.false;
    })

    it("non-admin revert revoking burner role", async () => {
      await expectRevert(
        MintBurnInstance.revokeBurnerRole(newBurner, { from: user1 }),
        "AccessControl: account 0x821aea9a577a9b44299b9c15c88cf3087f3b5544 is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
      )
    })
    
  })
})
