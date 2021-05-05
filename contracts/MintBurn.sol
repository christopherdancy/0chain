// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MintBurn is ERC20, AccessControl {
    bytes32 public MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor(address minter, address burner, address admin) ERC20("Zxn coin", "Zxn") {
        // Grant the contract deployer the default admin role: it will be able
        // to grant and revoke any roles
        _setupRole(ADMIN_ROLE, admin);
        _setupRole(MINTER_ROLE, minter);
        _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
        _setupRole(BURNER_ROLE, burner);
        _setRoleAdmin(BURNER_ROLE, ADMIN_ROLE);
    }

    function decimals () public override pure returns(uint8) {
        return 8;
    }

    function mint (address to_, uint256 amount_) public {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _mint(to_, amount_);
    }

    function burn (address from_, uint256 amount_) public virtual {
        require(hasRole(BURNER_ROLE, msg.sender), "Caller is not a burner");
        _burn(from_, amount_);
    }

    function grantMinterRole (address newMinter) public {
        grantRole(MINTER_ROLE, newMinter);
    }

    function grantBurnerRole (address newBurner) public {
        grantRole(BURNER_ROLE, newBurner);
    }

    function revokeMinterRole (address previousMinter) public {
        revokeRole(MINTER_ROLE, previousMinter);
    }

    function revokeBurnerRole (address previousBurner) public {
        revokeRole(BURNER_ROLE, previousBurner);
    }
}