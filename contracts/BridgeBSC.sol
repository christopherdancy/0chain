// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './IMintBurn.sol';


contract BridgeBSC is AccessControl{
  bytes32 public MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public ADMIN_ROLE = keccak256("ADMIN_ROLE");

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

  constructor(address _token, address minter, address admin) {
    token = IMintBurn(_token);

    _setupRole(ADMIN_ROLE, admin);
    _setupRole(MINTER_ROLE, minter);
    _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
  }

  function grantMinterRole (address newMinter) public {
      grantRole(MINTER_ROLE, newMinter);
  }

  function revokeMinterRole (address previousMinter) public {
      revokeRole(MINTER_ROLE, previousMinter);
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

  function transferToBSC(address from, address to, uint amount, uint otherChainNonce) external {
    require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
    require(processedNonces[otherChainNonce] == false, 'transfer already processed');
    processedNonces[otherChainNonce] = true;
    token.mint(to, amount);
    emit Transfer(
      from,
      to,
      amount,
      block.timestamp,
      otherChainNonce,
      Step.Mint
    );
  }
}