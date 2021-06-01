require('dotenv').config()
const Web3 = require('web3');
const ZeroChainToken = require('../build/contracts/ZeroChainToken.json');

const init = async () => {
  const web3Eth = new Web3(process.env.RINKEBY_PROVIDER);
  const adminPrivKey = process.env.RINKEBY_PK;
  const { address: admin } = web3Bsc.eth.accounts.wallet.add(adminPrivKey);

  const zeroChainEth = new web3Eth.eth.Contract(
    ZeroChainToken.abi,
    "0x0"
  );

  const balance = await zeroChainEth.methods.balanceOf("0x0").call({from: admin});
  console.log(balance);

}
init();