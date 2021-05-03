const MintBurn = artifacts.require("MintBurn");

module.exports = function (deployer) {
  deployer.deploy(MintBurn);
};
