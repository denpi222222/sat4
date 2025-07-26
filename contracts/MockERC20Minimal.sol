// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20Minimal is ERC20 {
    constructor() ERC20("MockCRA", "MCRA") {
        _mint(msg.sender, 100_000_000 ether);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
} 