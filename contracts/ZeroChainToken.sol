// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ZeroChainToken is ERC20, AccessControl {
    bytes32 public BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    bytes32 public ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor(address bridgeContract, address admin) ERC20("Zxn coin", "Zxn") {
        // Grant the contract deployer the default admin role: it will be able
        // to grant and revoke any roles
        _setupRole(ADMIN_ROLE, admin);
        _setupRole(BRIDGE_ROLE, bridgeContract);
        _setRoleAdmin(BRIDGE_ROLE, ADMIN_ROLE);
    }

    function decimals () public override pure returns(uint8) {
        return 10;
    }

    function hasBridgeRole (address bridge) public view returns(bool) {
      return hasRole(BRIDGE_ROLE, bridge);
    }

    function mint (address to_, uint256 amount_) public {
        require(hasRole(BRIDGE_ROLE, msg.sender), "Caller is not an approved bridge to mint");
        _mint(to_, amount_);
    }

    function burn (address from_, uint256 amount_) public virtual {
        require(hasRole(BRIDGE_ROLE, msg.sender), "Caller is not an approved bridge to burn");
        _burn(from_, amount_);
    }

    function grantBridgeRole (address updatedBridge) public {
        grantRole(BRIDGE_ROLE, updatedBridge);
    }

    function revokeBridgeRole (address previousMinter) public {
        revokeRole(BRIDGE_ROLE, previousMinter);
    }

}