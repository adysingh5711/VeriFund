// packages/contracts/contracts/core/QuadraticVoting.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract QuadraticVoting is 
    Initializable, 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable,
    PausableUpgradeable 
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    
    struct VotingRound {
        uint256 startTime;
        uint256 endTime;
        uint256 commitEndTime;
        uint256 totalCredits;
        uint256 totalProposals;
        bool finalized;
        bytes32 merkleRoot; // For verified voter list
    }
    
    struct Vote {
        bytes32 commitment; // keccak256(proposalId, votes, nonce)
        uint256 votesRevealed;
        bool revealed;
        bool counted;
    }
    
    struct ProposalResult {
        uint256 totalVotes;
        uint256 quadraticScore;
        uint256 uniqueVoters;
        bool qualified; // Minimum threshold met
    }
    
    // State variables
    uint256 public constant CREDITS_PER_ROUND = 100;
    uint256 public constant MIN_VOTES_THRESHOLD = 50;
    uint256 public constant MAX_VOTES_PER_PROPOSAL = 10;
    
    uint256 public currentRoundId;
    mapping(uint256 => VotingRound) public votingRounds;
    mapping(uint256 => mapping(address => Vote)) public votes; // roundId => voter => vote
    mapping(uint256 => mapping(uint256 => ProposalResult)) public results; // roundId => proposalId => result
    mapping(address => uint256) public voterReputationScore;
    
    // Events
    event RoundStarted(uint256 indexed roundId, uint256 startTime, uint256 endTime);
    event VoteCommitted(uint256 indexed roundId, address indexed voter, bytes32 commitment);
    event VoteRevealed(uint256 indexed roundId, address indexed voter, uint256 indexed proposalId, uint256 votes);
    event RoundFinalized(uint256 indexed roundId, uint256 totalVotes);
    
    // Custom errors
    error InvalidVotingPhase();
    error InvalidVoteCount();
    error AlreadyVoted();
    error InvalidCommitment();
    error InsufficientCredits();
    error NotQualifiedVoter();
    
    function initialize(address admin) external initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }
    
    /**
     * @dev Start a new voting round with Merkle tree for voter verification
     * @param duration Duration of voting in seconds
     * @param commitDuration Duration of commit phase in seconds  
     * @param merkleRoot Merkle root of verified voters
     */
    function startVotingRound(
        uint256 duration,
        uint256 commitDuration,
        bytes32 merkleRoot
    ) external onlyRole(ADMIN_ROLE) {
        require(
            currentRoundId == 0 || votingRounds[currentRoundId].finalized,
            "Previous round not finalized"
        );
        
        currentRoundId++;
        uint256 startTime = block.timestamp;
        
        votingRounds[currentRoundId] = VotingRound({
            startTime: startTime,
            endTime: startTime + duration,
            commitEndTime: startTime + commitDuration,
            totalCredits: 0,
            totalProposals: 0,
            finalized: false,
            merkleRoot: merkleRoot
        });
        
        emit RoundStarted(currentRoundId, startTime, startTime + duration);
    }
    
    /**
     * @dev Commit vote with quadratic cost validation
     * @param commitment Keccak256 hash of (proposalId, votes, nonce)
     * @param merkleProof Proof that voter is in verified list
     */
    function commitVote(
        bytes32 commitment,
        bytes32[] calldata merkleProof
    ) external nonReentrant whenNotPaused {
        VotingRound storage round = votingRounds[currentRoundId];
        
        if (block.timestamp > round.commitEndTime || block.timestamp < round.startTime) {
            revert InvalidVotingPhase();
        }
        
        // Verify voter eligibility
        if (!_verifyVoter(msg.sender, merkleProof, round.merkleRoot)) {
            revert NotQualifiedVoter();
        }
        
        if (votes[currentRoundId][msg.sender].commitment != bytes32(0)) {
            revert AlreadyVoted();
        }
        
        votes[currentRoundId][msg.sender].commitment = commitment;
        
        emit VoteCommitted(currentRoundId, msg.sender, commitment);
    }
    
    /**
     * @dev Reveal vote and validate quadratic constraints
     * @param proposalId The proposal being voted for
     * @param voteCount Number of votes (1-10)
     * @param nonce Random nonce used in commitment
     */
    function revealVote(
        uint256 proposalId,
        uint256 voteCount,
        uint256 nonce
    ) external nonReentrant whenNotPaused {
        VotingRound storage round = votingRounds[currentRoundId];
        Vote storage vote = votes[currentRoundId][msg.sender];
        
        if (block.timestamp < round.commitEndTime || block.timestamp > round.endTime) {
            revert InvalidVotingPhase();
        }
        
        if (vote.revealed) {
            revert AlreadyVoted();
        }
        
        // Verify commitment
        bytes32 computedHash = keccak256(abi.encodePacked(proposalId, voteCount, nonce));
        if (computedHash != vote.commitment) {
            revert InvalidCommitment();
        }
        
        // Validate vote constraints
        if (voteCount == 0 || voteCount > MAX_VOTES_PER_PROPOSAL) {
            revert InvalidVoteCount();
        }
        
        // Check quadratic cost (voteCount^2) against available credits
        uint256 cost = voteCount * voteCount;
        if (cost > CREDITS_PER_ROUND) {
            revert InsufficientCredits();
        }
        
        // Update vote state
        vote.revealed = true;
        vote.votesRevealed = voteCount;
        
        // Update results
        ProposalResult storage result = results[currentRoundId][proposalId];
        result.totalVotes += voteCount;
        result.quadraticScore += _sqrt(voteCount * 1e18); // Scaled for precision
        result.uniqueVoters++;
        
        // Update round totals
        round.totalCredits += cost;
        
        // Update voter reputation
        voterReputationScore[msg.sender]++;
        
        emit VoteRevealed(currentRoundId, msg.sender, proposalId, voteCount);
    }
    
    /**
     * @dev Finalize voting round and mark qualified proposals
     */
    function finalizeRound() external onlyRole(ADMIN_ROLE) {
        VotingRound storage round = votingRounds[currentRoundId];
        require(block.timestamp > round.endTime, "Voting still active");
        require(!round.finalized, "Already finalized");
        
        round.finalized = true;
        
        emit RoundFinalized(currentRoundId, round.totalCredits);
    }
    
    /**
     * @dev Get quadratic score for a proposal
     */
    function getProposalScore(uint256 roundId, uint256 proposalId) 
        external 
        view 
        returns (ProposalResult memory) 
    {
        return results[roundId][proposalId];
    }
    
    /**
     * @dev Internal function to verify voter eligibility using Merkle proof
     */
    function _verifyVoter(
        address voter,
        bytes32[] calldata proof,
        bytes32 root
    ) internal pure returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(voter));
        return MerkleProof.verify(proof, root, leaf);
    }
    
    /**
     * @dev Internal square root function for quadratic calculations
     */
    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    // Emergency functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}