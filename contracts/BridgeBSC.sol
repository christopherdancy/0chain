// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './IMintBurn.sol';


contract BridgeBSC {
  IMintBurn public token;
  uint public nonce;
  mapping(uint => bool) public processedNonces;

  enum Step { Burn, Mint }
  event Transfer(
    address from,
    address to,
    uint amount,
    uint date,
    uint nonce,
    Step indexed step
  );

  constructor(address _token) {
    token = IMintBurn(_token);
  }

  function transferToETH(address to_, uint amount_) external {
    token.burn(msg.sender, amount_);
    emit Transfer(
      msg.sender,
      to_,
      amount_,
      block.timestamp,
      nonce,
      Step.Burn
    );
    nonce++;
  }

  function transferToBSC(address to, uint amount, uint otherChainNonce) external {
    require(processedNonces[otherChainNonce] == false, 'transfer already processed');
    processedNonces[otherChainNonce] = true;
    token.mint(to, amount);
    emit Transfer(
      msg.sender,
      to,
      amount,
      block.timestamp,
      otherChainNonce,
      Step.Mint
    );
  }
}