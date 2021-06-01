require('dotenv').config()
const Web3 = require('web3');
const BridgeEth = require('../build/contracts/BridgeETH.json');
const BridgeBsc = require('../build/contracts/BridgeBSC.json');

const init = async () => {
  const web3Eth = new Web3(process.env.RINKEBY_PROVIDER);
  const web3Bsc = new Web3(process.env.BSCTest_PROVIDER);
  const adminPrivKey = process.env.RINKEBY_PK;
  const { address: admin } = web3Eth.eth.accounts.wallet.add(adminPrivKey);

  const bridgeEth = new web3Eth.eth.Contract(
    BridgeEth.abi,
    "0x0"
  );

  const bridgeBsc = new web3Bsc.eth.Contract(
    BridgeBsc.abi,
    "0x0"
  );

  //use this to wait for mined transaction
  const slowAPICall = 500;
  const expectedBlockTime = 20000; 
  const sleep = (milliseconds) => {
      return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  var intervalID = 0;
  function intervalManager(flag) {
    if(flag)
      intervalID =  setInterval(function(){ sendNewTransaction(intervalID); }, 60000);
    else
      clearInterval(intervalID);
  }

  async function sendNewTransaction () {
    if (intervalID != 0) {
      intervalManager(false);
    }
      console.log("Searching for new transaction...");
      const events = await bridgeBsc.getPastEvents(
        'TransferingToBSC',
        {fromBlock:0}
      );

      for (i = 0; i < events.length; i++) {
        const { to, amount, date, nonce } = events[i].returnValues;
        let isNonceProcessed = await bridgeEth.methods.processedNonces(nonce).call({from: admin});
        await sleep(slowAPICall);

        if (isNonceProcessed == false) {
          console.log("Transaction found - building transaction...");
          const tx = await bridgeEth.methods.returnToETH(to, amount, nonce);
          const gasPrice = await web3Eth.eth.getGasPrice();
          const gasCost = await tx.estimateGas({from: admin});

          console.log("Sending transaction...");
          await sleep(slowAPICall);
          const transaction = await bridgeEth.methods.returnToETH(to, amount, nonce).send({
            from: admin,
            gas: gasCost,
            gasPrice: gasPrice
          });

          console.log("Transaction sent - mining transaction...");
          let transactionReceipt = await web3Eth.eth.getTransactionReceipt(transaction.transactionHash);

          while (transactionReceipt == null) { // Waiting expectedBlockTime until the transaction is mined
            transactionReceipt = await web3BEth.eth.getTransactionReceipt(transaction.transactionHash);
            await sleep(expectedBlockTime);
          }

          console.log(`Transaction hash: ${transaction.transactionHash}`);
          console.log(`
            Processed transfer:
            - to ${to} 
            - amount ${amount} tokens
            - date ${date}
            - ETH Transaction Mined: ${transactionReceipt.status}
        `);

        }

      }
      intervalManager(true);

  }
  sendNewTransaction();

}
init();