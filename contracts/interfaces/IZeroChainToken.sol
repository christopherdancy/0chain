
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IZeroChainToken {
  function mint(address to_, uint256 amount_) external;
  function burn(address from_, uint256 amount_) external;
}