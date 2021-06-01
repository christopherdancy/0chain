const { BN, expectRevert, time, constants} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const ZeroChainToken = artifacts.require("ZeroChainToken");

contract("ZeroChainToken", (accounts) => {
  let ZeroChainTokenInstance

  const [admin, bridge, updatedBridge, tokenUser1, dev] = accounts;

  const amount = new BN('1000');
  const mintamount = new BN('20000');
  const BRIDGE_ROLE = Buffer.from(web3.utils.keccak256("BRIDGE_ROLE").substring(2), "hex");
  const ADMIN_ROLE = Buffer.from(web3.utils.keccak256("ADMIN_ROLE").substring(2), "hex");

  describe("When setting up access control", () => {
    beforeEach(async () => {
      ZeroChainTokenInstance = await ZeroChainToken.new( "0x0000000000000000000000000000000000000000", admin, { from: dev });
      await ZeroChainTokenInstance.grantBridgeRole(bridge, { from: admin });
    })

    it("should update the bridge's address on deployment", async () => {
    expect(await ZeroChainTokenInstance.hasRole(BRIDGE_ROLE, bridge)).to.be.true;
    })

    it("should update the admins's address on deployment", async () => {
      expect(await ZeroChainTokenInstance.hasRole(ADMIN_ROLE, admin)).to.be.true;
    })
  })

  describe("When deploying an erc20 with mintable + burnable funciton", () => {
    beforeEach(async () => {
      ZeroChainTokenInstance = await ZeroChainToken.new( "0x0000000000000000000000000000000000000000", admin, { from: dev });
      await ZeroChainTokenInstance.grantBridgeRole(bridge, { from: admin });
      await ZeroChainTokenInstance.mint(tokenUser1, mintamount, { from: bridge });
    })

    it("should update the users balance", async () => {
      expect(await ZeroChainTokenInstance.balanceOf(tokenUser1)).to.be.bignumber.that.equals("20000");
    })

    it("the total supply should be equal to the total minted", async () => {
      expect(await ZeroChainTokenInstance.totalSupply()).to.be.bignumber.that.equals("20000");
    })

    it("should override decimals to 8", async () => {
      expect(await ZeroChainTokenInstance.decimals()).to.be.bignumber.that.equals("10");
    })

    it("the balanceOf the user decreases with burning", async () => {
      await ZeroChainTokenInstance.burn(tokenUser1, amount, { from: bridge });
      expect(await ZeroChainTokenInstance.balanceOf(tokenUser1)).to.be.bignumber.that.equals("19000");
    })

    it("minting from non-minter role should revert", async () => {
      await expectRevert(
        ZeroChainTokenInstance.mint(tokenUser1, mintamount, { from: tokenUser1 }),
        "Caller is not an approved bridge to mint"
      )
    })

    it("burning from non-burner role should revert", async () => {
      await expectRevert(
        ZeroChainTokenInstance.burn(tokenUser1, mintamount, { from: tokenUser1 }),
        "Caller is not an approved bridge to burn"
      )
    })
  })
  
  describe("When granting and revoking roles", () => {
    beforeEach(async () => {
      ZeroChainTokenInstance = await ZeroChainToken.new( "0x0000000000000000000000000000000000000000", admin, { from: dev });
      await ZeroChainTokenInstance.grantBridgeRole(bridge, { from: admin });
    })

    it("should be able to add a new bridge contract", async () => {
      await ZeroChainTokenInstance.grantBridgeRole(updatedBridge, { from: admin });
      expect(await ZeroChainTokenInstance.hasRole(BRIDGE_ROLE, updatedBridge)).to.be.true;
    })

    it("non- admin revert granting bridge role", async () => {
      await expectRevert(
        ZeroChainTokenInstance.grantBridgeRole(updatedBridge, { from: tokenUser1 }),
        "AccessControl: account 0x821aea9a577a9b44299b9c15c88cf3087f3b5544 is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
      )
    })

    it("should be able to remove the new bridge", async () => {
      await ZeroChainTokenInstance.grantBridgeRole(updatedBridge, { from: admin });
      await ZeroChainTokenInstance.revokeBridgeRole(bridge, { from: admin });
      expect(await ZeroChainTokenInstance.hasRole(BRIDGE_ROLE, bridge)).to.be.false;
      expect(await ZeroChainTokenInstance.hasRole(BRIDGE_ROLE, updatedBridge)).to.be.true;
    })

    it("non-admin revert revoking minter role", async () => {
      await expectRevert(
        ZeroChainTokenInstance.revokeBridgeRole(bridge, { from: tokenUser1 }),
        "AccessControl: account 0x821aea9a577a9b44299b9c15c88cf3087f3b5544 is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
      )
    })
  })
})
