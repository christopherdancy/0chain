const MintBurn = artifacts.require("MintBurn")

module.exports = function (deployer) {
  deployer.deploy(MintBurn,
    "0x288c57908cb8a7b03fa9873993dc57389b5ff8af",
    "0xe1afa20e465e98c2069fb38604ef433c0b92855c",
    "0xB7332A228329896a3B286b8670880A3cA313094d")
};
