const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const MintBurn = artifacts.require("MintBurn")
const toBN = web3.utils.toBN

contract("MintBurn", (accounts) => {
  let MintBurnInstance

  const [owner] = accounts;

  const amount = new BN('1000');
  const mintamount = new BN('20000');

  beforeEach(async () => {
    MintBurnInstance = await MintBurn.new({ from: owner });
    await MintBurnInstance.mint(owner, mintamount, { from: owner });
  })

  describe("When deploying an erc20", () => {
    it("should update the minter's balance", async () => {
    expect(await MintBurnInstance.balanceOf(owner)).to.be.bignumber.that.equals("20000");
    })
    it("should override decimals to 8", async () => {
      expect(await MintBurnInstance.decimals()).to.be.bignumber.that.equals("8");
      })
  })
})
