const BridgeBSC = artifacts.require("BridgeBSC")

module.exports = function (deployer) {
  deployer.deploy(BridgeBSC,
    "0x288c57908cb8a7b03fa9873993dc57389b5ff8af")
};
