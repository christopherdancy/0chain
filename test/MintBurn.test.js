const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const MintBurn = artifacts.require("MintBurn")
const toBN = web3.utils.toBN

contract("MintBurn", (accounts) => {
  let MintBurnInstance

  const [owner, minter, burner] = accounts;

  const amount = new BN('1000');
  const mintamount = new BN('20000');
  const MINTER_ROLE = Buffer.from(web3.utils.keccak256("MINTER_ROLE").substring(2), "hex");
  const BURNER_ROLE = Buffer.from(web3.utils.keccak256("BURNER_ROLE").substring(2), "hex");
  const ADMIN_ROLE = Buffer.from(web3.utils.keccak256("ADMIN_ROLE").substring(2), "hex");

  beforeEach(async () => {
    MintBurnInstance = await MintBurn.new( minter, burner, owner, { from: owner });
    await MintBurnInstance.mint(burner, mintamount, { from: minter });
  })

  describe("When deploying an erc20 with mintable + burnable funciton", () => {
    it("should update the minter's balance", async () => {
    expect(await MintBurnInstance.balanceOf(owner)).to.be.bignumber.that.equals("20000");
    })
    it("the balanceOf the user should be less than before balance", async () => {
      expect(await MintBurnInstance.totalSupply()).to.be.bignumber.that.equals("20000");
    })
    it("should override decimals to 8", async () => {
      expect(await MintBurnInstance.decimals()).to.be.bignumber.that.equals("8");
    })
    it("the balanceOf the user should be less than before balance", async () => {
      await MintBurnInstance.burn(amount, { from: owner });
      expect(await MintBurnInstance.balanceOf(owner)).to.be.bignumber.that.equals("19000");
    })
    it("the balanceOf the user should be less than before balance", async () => {
      await MintBurnInstance.burn(amount, { from: owner });
      expect(await MintBurnInstance.totalSupply()).to.be.bignumber.that.equals("19000");
    })
  })

  describe.only("When setting up access control", () => {
    it("should update the minter's address on deployment", async () => {
    expect(await MintBurnInstance.hasRole(MINTER_ROLE, minter)).to.be.true;
    })
    
    it("should update the burner's address on deployment", async () => {
      expect(await MintBurnInstance.hasRole(BURNER_ROLE, burner)).to.be.true;
    })
    it.only("should update the admins's address on deployment", async () => {
      expect(await MintBurnInstance.hasRole(ADMIN_ROLE, owner)).to.be.true;
    })
    // it("the balanceOf the user should be less than before balance", async () => {
    //   expect(await MintBurnInstance.totalSupply()).to.be.bignumber.that.equals("20000");
    // })
    // it("should override decimals to 8", async () => {
    //   expect(await MintBurnInstance.decimals()).to.be.bignumber.that.equals("8");
    // })
    // it("the balanceOf the user should be less than before balance", async () => {
    //   await MintBurnInstance.burn(amount, { from: owner });
    //   expect(await MintBurnInstance.balanceOf(owner)).to.be.bignumber.that.equals("19000");
    // })
    // it("the balanceOf the user should be less than before balance", async () => {
    //   await MintBurnInstance.burn(amount, { from: owner });
    //   expect(await MintBurnInstance.totalSupply()).to.be.bignumber.that.equals("19000");
    // })
  })
})
