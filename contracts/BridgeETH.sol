// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract BridgeETH is AccessControl{
  using SafeERC20 for IERC20;
  bytes32 public RELEASER_ROLE = keccak256("RELEASER_ROLE");
  bytes32 public ADMIN_ROLE = keccak256("ADMIN_ROLE");

  IERC20 public token;
  uint public nonce;
  mapping(uint => bool) public processedNonces;

  enum Step { Lock, Release }
  event Transfer(
    address from,
    address to,
    uint amount,
    uint date,
    uint nonce,
    Step indexed step
  );

  constructor(IERC20 _token, address releaser, address admin) {
    token = IERC20(_token);

    _setupRole(ADMIN_ROLE, admin);
    _setupRole(RELEASER_ROLE, releaser);
    _setRoleAdmin(RELEASER_ROLE, ADMIN_ROLE);
  }

  function grantReleaserRole (address newMinter) public {
      grantRole(RELEASER_ROLE, newMinter);
  }

  function revokeReleaserRole (address previousMinter) public {
      revokeRole(RELEASER_ROLE, previousMinter);
  }

  function transferFromETHToBSC(address to, uint amount) external {
    token.safeTransferFrom(msg.sender, address(this), amount);
    emit Transfer(
      msg.sender,
      to,
      amount,
      block.timestamp,
      nonce,
      Step.Lock
    );
    nonce++;
  }

  function transferFromBSCToETH(address from, address to, uint amount, uint otherChainNonce) external {
    require(hasRole(RELEASER_ROLE, msg.sender), "Caller is not a releaser");
    require(processedNonces[otherChainNonce] == false, 'transfer already processed');
    processedNonces[otherChainNonce] = true;
    token.safeTransfer(to, amount);
    emit Transfer(
      from,
      to,
      amount,
      block.timestamp,
      otherChainNonce,
      Step.Release
    );
  }
}