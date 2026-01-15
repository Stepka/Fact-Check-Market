// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FactMarket {

    address public resolver;
    uint256 public claimCount;

    constructor(address _resolver) {
        resolver = _resolver;
    }

    struct Claim {
        string description;
        uint256 deadline;
        bool resolved;
        bool outcome;

        uint256 trueShares;
        uint256 falseShares;

        mapping(address => uint256) trueBalance;
        mapping(address => uint256) falseBalance;
    }

    mapping(uint256 => Claim) public claims;

    modifier onlyResolver() {
        require(msg.sender == resolver, "Not resolver");
        _;
    }

    // ---------- CREATE ----------

    function createClaim(
        string calldata description,
        uint256 deadline
    ) external returns (uint256) {
        require(deadline > block.timestamp, "Bad deadline");

        Claim storage c = claims[claimCount];
        c.description = description;
        c.deadline = deadline;

        claimCount++;
        return claimCount - 1;
    }

    // ---------- BUY ----------

    function buyTrue(uint256 claimId) external payable {
        Claim storage c = claims[claimId];
        require(block.timestamp < c.deadline, "Closed");

        c.trueShares += msg.value;
        c.trueBalance[msg.sender] += msg.value;
    }

    function buyFalse(uint256 claimId) external payable {
        Claim storage c = claims[claimId];
        require(block.timestamp < c.deadline, "Closed");

        c.falseShares += msg.value;
        c.falseBalance[msg.sender] += msg.value;
    }

    // ---------- RESOLVE ----------

    function resolve(uint256 claimId, bool outcome) external onlyResolver {
        Claim storage c = claims[claimId];
        require(!c.resolved, "Already resolved");
        require(block.timestamp >= c.deadline, "Too early");

        c.resolved = true;
        c.outcome = outcome;
    }

    // ---------- PAYOUT (PULL) ----------

    function claimPayout(uint256 claimId) external {
        Claim storage c = claims[claimId];
        require(c.resolved, "Not resolved");

        uint256 payout;
        uint256 pool = c.trueShares + c.falseShares;

        if (c.outcome) {
            uint256 userShare = c.trueBalance[msg.sender];
            require(userShare > 0, "No TRUE shares");

            payout = (userShare * pool) / c.trueShares;
            c.trueBalance[msg.sender] = 0;
        } else {
            uint256 userShare = c.falseBalance[msg.sender];
            require(userShare > 0, "No FALSE shares");

            payout = (userShare * pool) / c.falseShares;
            c.falseBalance[msg.sender] = 0;
        }

        payable(msg.sender).transfer(payout);
    }

    // ---------- PRICES / PROBABILITY ----------

    function getPrices(uint256 claimId)
        external
        view
        returns (uint256 truePrice, uint256 falsePrice)
    {
        Claim storage c = claims[claimId];
        uint256 total = c.trueShares + c.falseShares;

        if (total == 0) {
            return (0, 0);
        }

        truePrice = (c.trueShares * 1e18) / total;
        falsePrice = (c.falseShares * 1e18) / total;
    }

    // ---------- READ HELPERS (for frontend) ----------

    function getClaimInfo(uint256 claimId)
        external
        view
        returns (
            string memory description,
            uint256 deadline,
            bool resolved,
            bool outcome,
            uint256 trueShares,
            uint256 falseShares
        )
    {
        Claim storage c = claims[claimId];
        return (
            c.description,
            c.deadline,
            c.resolved,
            c.outcome,
            c.trueShares,
            c.falseShares
        );
    }
}
