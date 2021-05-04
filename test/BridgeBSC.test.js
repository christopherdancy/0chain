const { BN, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const MintBurn = artifacts.require("MintBurn")
const BridgeBSC = artifacts.require("BridgeBSC")
const toBN = web3.utils.toBN

contract("BridgeBSC", (accounts) => {
  let MintBurnInstance
  let BridgeBSCInstance

  const [owner, minter, burner, user1, admin, newMinter, newBurner] = accounts;

  const amount = new BN('1000');
  const mintamount = new BN('20000');
  const MINTER_ROLE = Buffer.from(web3.utils.keccak256("MINTER_ROLE").substring(2), "hex");
  const BURNER_ROLE = Buffer.from(web3.utils.keccak256("BURNER_ROLE").substring(2), "hex");
  const ADMIN_ROLE = Buffer.from(web3.utils.keccak256("ADMIN_ROLE").substring(2), "hex");

  describe("When setting up access control", () => {
    beforeEach(async () => {
      MintBurnInstance = await MintBurn.new( minter, burner, owner, { from: owner });
      BridgeBSCInstance = await BridgeBSC.new( MintBurnInstance.address, { from: owner });
    })

    it.only("should set the correct token interface", async () => {
    expect(await BridgeBSCInstance.token()).to.equal(MintBurnInstance.address);
    })
    
    it("should update the burner's address on deployment", async () => {
      expect(await MintBurnInstance.hasRole(BURNER_ROLE, burner)).to.be.true;
    })

    it("should update the admins's address on deployment", async () => {
      expect(await MintBurnInstance.hasRole(ADMIN_ROLE, owner)).to.be.true;
    })
  })
})
