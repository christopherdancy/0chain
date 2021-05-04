
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IMintBurn {
  function mint(address to_, uint256 amount_) external;
  function burn(address from_, uint256 amount_) external;
}