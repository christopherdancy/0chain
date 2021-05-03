// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MintBurn is ERC20 {
    constructor() ERC20("Zxn coin", "Zxn") {}

    function decimals () public override pure returns(uint8) {
        return 8;
    }

    function mint (address to_, uint256 amount_) public {
        _mint(to_, amount_);
    }
    function burn (uint256 amount) public virtual {
        _burn(_msgSender(), amount);
    }
}