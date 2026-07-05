// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/PipelinePolicy.sol";

contract PipelinePolicyTest is Test {
    PipelinePolicy policy;
    address agent = address(0x1);
    address endpoint = address(0x2);
    address guardian = address(this);

    function setUp() public {
        policy = new PipelinePolicy();
    }

    function testCreateBudget() public {
        uint256 id = policy.createBudget(agent, 1000 ether, 100 ether);
        (uint256 alloc, uint256 spent, uint256 rem, bool active) = policy.getBudgetStatus(id);
        assertEq(alloc, 1000 ether);
        assertEq(spent, 0);
        assertEq(rem, 1000 ether);
        assertTrue(active);
    }

    function testTopUpBudget() public {
        uint256 id = policy.createBudget(agent, 100 ether, 50 ether);
        policy.topUpBudget(id, 100 ether);
        (, , uint256 rem, ) = policy.getBudgetStatus(id);
        assertEq(rem, 200 ether);
    }

    function testApproveWithinBudget() public {
        uint256 id = policy.createBudget(agent, 500 ether, 200 ether);
        policy.setEndpointRule(endpoint, bytes4(0), true, 50 ether, 200 ether, bytes4("GEN"));
        (bool ok, bytes memory reason) = policy.checkAndApprove(agent, endpoint, bytes4(0), 10 ether);
        assertTrue(ok);
        (, uint256 spent, , ) = policy.getBudgetStatus(id);
        assertEq(spent, 10 ether);
    }

    function testDenyOverBudget() public {
        policy.createBudget(agent, 100 ether, 200 ether);
        policy.setEndpointRule(endpoint, bytes4(0), true, 100 ether, 200 ether, bytes4("GEN"));
        (bool ok, ) = policy.checkAndApprove(agent, endpoint, bytes4(0), 150 ether);
        assertFalse(ok);
    }

    function testDenyBlockedEndpoint() public {
        policy.createBudget(agent, 500 ether, 200 ether);
        policy.setEndpointRule(endpoint, bytes4(0), false, 0, 0, bytes4("GEN"));
        (bool ok, ) = policy.checkAndApprove(agent, endpoint, bytes4(0), 10 ether);
        assertFalse(ok);
    }

    function testDenyPerRequestCap() public {
        policy.createBudget(agent, 500 ether, 200 ether);
        policy.setEndpointRule(endpoint, bytes4(0), true, 5 ether, 200 ether, bytes4("GEN"));
        (bool ok, ) = policy.checkAndApprove(agent, endpoint, bytes4(0), 10 ether);
        assertFalse(ok);
    }

    function testOutcomeBondLifecycle() public {
        uint256 id = policy.createOutcomeBond(endpoint, 100 ether, bytes32("task_1"));
        policy.resolveOutcomeBond(id, true);
        (, , , , , bool delivered) = policy.outcomeBonds(id);
        assertTrue(delivered);
    }
}
