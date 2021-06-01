require('dotenv').config()
const Web3 = require('web3');
const ZeroChainToken = require('../build/contracts/ZeroChainToken.json');

const init = async () => {
  const web3Bsc = new Web3(process.env.BSCTest_PROVIDER);
  const adminPrivKey = process.env.BSCTest_PK;
  const { address: admin } = web3Bsc.eth.accounts.wallet.add(adminPrivKey);

  const zeroChainBsc = new web3Bsc.eth.Contract(
    ZeroChainToken.abi,
    "0x0"
  );

  const balance = await zeroChainBsc.methods.balanceOf("0x0").call({from: admin});
  console.log(balance);

}
init();