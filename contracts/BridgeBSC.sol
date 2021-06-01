// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/IZeroChainToken.sol';

contract BridgeBSC is AccessControl{
  bytes32 public ADMIN_ROLE = keccak256("ADMIN_ROLE");

  IZeroChainToken public token;
  uint public nonce;
  mapping(uint => bool) public processedNonces;

  event TransferingToEth(
    address to,
    uint amount,
    uint date,
    uint nonce
  );

  event ReturningToBSC(
    address to,
    uint amount,
    uint date,
    uint nonce
  );

  constructor(address _token, address admin) {
    token = IZeroChainToken(_token);

    _setupRole(ADMIN_ROLE, admin);
  }

  function hasAdminRole (address admin) public view returns(bool) {
      return hasRole(ADMIN_ROLE, admin);
  }

  function transferToEth(address to, uint amount) external {
    token.burn(msg.sender, amount);
    emit TransferingToEth(
      to,
      amount,
      block.timestamp,
      nonce
    );
    nonce++;
  }

  function returnToBSC(address to, uint amount, uint otherChainNonce) external {
    require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
    require(processedNonces[otherChainNonce] == false, 'transfer already processed');
    processedNonces[otherChainNonce] = true;
    token.mint(to, amount);
    emit ReturningToBSC(
      to,
      amount,
      block.timestamp,
      otherChainNonce
    );
  }
}