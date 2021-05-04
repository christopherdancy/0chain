const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const MintBurn = artifacts.require("MintBurn")
const toBN = web3.utils.toBN

contract("MintBurn", (accounts) => {
  let MintBurnInstance

  const [owner, minter, burner, user1] = accounts;

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
})
