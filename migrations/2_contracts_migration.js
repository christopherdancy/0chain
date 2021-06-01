const Token = artifacts.require("ZeroChainToken");
const BridgeETH = artifacts.require('BridgeETH.sol');
const BridgeBSC = artifacts.require('BridgeBSC.sol');

module.exports = async function (deployer, network) {
  if(network === 'ethTestnet') {

    //Deploy Zero Chain Token w admin(to easily mint) + admin
    await deployer.deploy(Token, "0xadmin", "0xadmin");
    const TokenDeployed = await Token.deployed();

    //Deploy BridgeETH w token.address + admin
    await deployer.deploy(BridgeETH, TokenDeployed.address, "0xadmin");
    const ethBridgeDeployed = await BridgeETH.deployed();

    //grant Bridge Role to deployed Bridge ETH
    await TokenDeployed.grantBridgeRole(ethBridgeDeployed.address);

    //Ease of testing 
    await TokenDeployed.mint("0xadmin", 1000);
    await TokenDeployed.approve(ethBridgeDeployed.address, 200); 
  }
  if(network === 'bscTestnet') {
    // Deploy ZeroChainToken w Zero.address + admin
    await deployer.deploy(Token, "0x0", "0xadmin");
    const TokenDeployed = await Token.deployed();

    await deployer.deploy(BridgeBSC, TokenDeployed.address,"0xadmin");
    const BridgeBSCDeployed = await BridgeBSC.deployed();

    //grant bridge role
    await TokenDeployed.grantBridgeRole(BridgeBSCDeployed.address);
  }
}