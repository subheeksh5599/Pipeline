// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PipelinePolicy {
    struct Budget {
        uint256 allocated;
        uint256 spent;
        uint256 rateLimitPerHour;
        uint256 lastResetAt;
        address guardian;
        bool active;
    }

    struct EndpointRule {
        bool allowed;
        uint256 maxPerRequest;
        uint256 maxPerHour;
        bytes4 category;
    }

    struct OutcomeBond {
        uint256 amount;
        uint256 released;
        address provider;
        bytes32 taskHash;
        bool resolved;
        bool delivered;
    }

    address public owner;
    uint256 public nextBudgetId;
    uint256 public nextBondId;

    mapping(uint256 => Budget) public budgets;
    mapping(address => mapping(bytes4 => EndpointRule)) public endpointRules;
    mapping(uint256 => OutcomeBond) public outcomeBonds;
    mapping(address => uint256) public agentBudgetId;

    event BudgetCreated(uint256 indexed budgetId, address indexed agent, uint256 allocated);
    event BudgetToppedUp(uint256 indexed budgetId, uint256 amount);
    event EndpointRuleSet(address indexed endpoint, bytes4 indexed method, bool allowed);
    event SpendApproved(uint256 indexed budgetId, address indexed endpoint, uint256 amount);
    event SpendDenied(uint256 indexed budgetId, address indexed endpoint, uint256 amount, bytes reason);
    event OutcomeBondCreated(uint256 indexed bondId, uint256 amount, address indexed provider);
    event OutcomeBondResolved(uint256 indexed bondId, bool delivered);
    event BudgetTrancheReleased(uint256 indexed budgetId, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyGuardian(uint256 _budgetId) {
        require(msg.sender == budgets[_budgetId].guardian, "not guardian");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createBudget(address _agent, uint256 _allocated, uint256 _rateLimitPerHour) external onlyOwner returns (uint256) {
        uint256 id = nextBudgetId++;
        budgets[id] = Budget({
            allocated: _allocated,
            spent: 0,
            rateLimitPerHour: _rateLimitPerHour,
            lastResetAt: block.timestamp,
            guardian: msg.sender,
            active: true
        });
        agentBudgetId[_agent] = id;
        emit BudgetCreated(id, _agent, _allocated);
        return id;
    }

    function topUpBudget(uint256 _budgetId, uint256 _amount) external onlyGuardian(_budgetId) {
        budgets[_budgetId].allocated += _amount;
        emit BudgetToppedUp(_budgetId, _amount);
    }

    function releaseTranche(uint256 _budgetId, uint256 _amount) external onlyGuardian(_budgetId) {
        Budget storage b = budgets[_budgetId];
        require(b.active, "budget inactive");
        b.allocated += _amount;
        emit BudgetTrancheReleased(_budgetId, _amount);
    }

    function setEndpointRule(address _endpoint, bytes4 _method, bool _allowed, uint256 _maxPerRequest, uint256 _maxPerHour, bytes4 _category) external onlyOwner {
        endpointRules[_endpoint][_method] = EndpointRule({
            allowed: _allowed,
            maxPerRequest: _maxPerRequest,
            maxPerHour: _maxPerHour,
            category: _category
        });
        emit EndpointRuleSet(_endpoint, _method, _allowed);
    }

    function checkAndApprove(address _agent, address _endpoint, bytes4 _method, uint256 _amount) external returns (bool, bytes memory) {
        uint256 budgetId = agentBudgetId[_agent];
        Budget storage b = budgets[budgetId];
        if (!b.active) {
            emit SpendDenied(budgetId, _endpoint, _amount, bytes("no active budget"));
            return (false, bytes("no active budget"));
        }
        if (b.allocated - b.spent < _amount) {
            emit SpendDenied(budgetId, _endpoint, _amount, bytes("budget exceeded"));
            return (false, bytes("budget exceeded"));
        }

        if (block.timestamp - b.lastResetAt >= 1 hours) {
            b.lastResetAt = block.timestamp;
        }

        EndpointRule memory rule = endpointRules[_endpoint][_method];
        if (!rule.allowed) {
            emit SpendDenied(budgetId, _endpoint, _amount, bytes("endpoint blocked"));
            return (false, bytes("endpoint blocked"));
        }
        if (_amount > rule.maxPerRequest && rule.maxPerRequest > 0) {
            emit SpendDenied(budgetId, _endpoint, _amount, bytes("per-request cap exceeded"));
            return (false, bytes("per-request cap exceeded"));
        }

        b.spent += _amount;
        emit SpendApproved(budgetId, _endpoint, _amount);
        return (true, bytes("approved"));
    }

    function createOutcomeBond(address _provider, uint256 _amount, bytes32 _taskHash) external onlyOwner returns (uint256) {
        uint256 id = nextBondId++;
        outcomeBonds[id] = OutcomeBond({
            amount: _amount,
            released: 0,
            provider: _provider,
            taskHash: _taskHash,
            resolved: false,
            delivered: false
        });
        emit OutcomeBondCreated(id, _amount, _provider);
        return id;
    }

    function resolveOutcomeBond(uint256 _bondId, bool _delivered) external onlyOwner {
        OutcomeBond storage bond = outcomeBonds[_bondId];
        require(!bond.resolved, "already resolved");
        bond.resolved = true;
        bond.delivered = _delivered;
        emit OutcomeBondResolved(_bondId, _delivered);
    }

    function getBudgetStatus(uint256 _budgetId) external view returns (uint256 allocated, uint256 spent, uint256 remaining, bool active) {
        Budget storage b = budgets[_budgetId];
        return (b.allocated, b.spent, b.allocated - b.spent, b.active);
    }

    function isEndpointAllowed(address _endpoint, bytes4 _method) external view returns (bool) {
        return endpointRules[_endpoint][_method].allowed;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "zero address");
        owner = _newOwner;
    }
}
