// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract BridgeETH is AccessControl{
  using SafeERC20 for IERC20;
  bytes32 public ADMIN_ROLE = keccak256("ADMIN_ROLE");

  IERC20 public token;
  uint public nonce;
  mapping(uint => bool) public processedNonces;

  event TransferingToBSC(
    address to,
    uint amount,
    uint date,
    uint nonce
  );

  event ReturningToEth(
    address to,
    uint amount,
    uint date,
    uint nonce
  );

  constructor(IERC20 _token, address admin) {
    token = IERC20(_token);

    _setupRole(ADMIN_ROLE, admin);
  }

  function hasAdminRole (address admin) public view returns(bool) {
      return hasRole(ADMIN_ROLE, admin);
  }

  function transferToBSC(address to, uint amount) external {
    token.safeTransferFrom(msg.sender, address(this), amount);
    emit TransferingToBSC(
      to,
      amount,
      block.timestamp,
      nonce
    );
    nonce++;
  }

  function returnToETH( address to, uint amount, uint otherChainNonce) external {
    require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
    require(processedNonces[otherChainNonce] == false, 'transfer already processed');
    processedNonces[otherChainNonce] = true;
    token.safeTransfer(to, amount);
    emit ReturningToEth(
      to,
      amount,
      block.timestamp,
      otherChainNonce
    );
  }
}