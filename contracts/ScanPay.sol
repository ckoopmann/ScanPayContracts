// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {
    GelatoRelayContext
} from "@gelatonetwork/relay-context/contracts/GelatoRelayContext.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Inheriting GelatoRelayContext gives access to:
// 1. onlyGelatoRelay modifier
// 2. payment methods, i.e. _transferRelayFee
// 3. _getFeeCollector(), _getFeeToken(), _getFee()
contract ScanPay is GelatoRelayContext {

    // `sendToFriend` is the target function to call
    // this function uses this contract's mock ERC-20 balance to send
    // an _amount of tokens to the _to address.
    function settlePayment(
        address _token,
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata _permitCallData
    ) external onlyGelatoRelay {
        (bool success,) = _token.call(_permitCallData);
        require(success, "ScanPay: permit failed");

        SafeERC20.safeTransferFrom(IERC20(_token), _from, address(this), _amount);

        _transferRelayFee();

        // transfer of ERC-20 tokens
        SafeERC20.safeTransfer(IERC20(_token), _to, IERC20(_token).balanceOf(address(this)));
    }
}
