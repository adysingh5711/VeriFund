// packages/contracts/contracts/core/MilestoneFunding.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MilestoneFunding is 
    Initializable, 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable 
{
    using SafeERC20 for IERC20;
    
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");
    
    enum MilestoneStatus { Pending, InReview, Approved, Rejected, Disputed, Released }
    
    struct Milestone {
        string description;
        uint256 fundingAmount;
        uint256 deadline;
        string deliverableHash; // IPFS hash
        MilestoneStatus status;
        address[] assignedReviewers;
        uint256 approvalCount;
        uint256 submissionTime;
        bool autoReleaseEnabled;
        uint256 autoReleaseTime;
    }
    
    struct Project {
        address creator;
        string title;
        string description;
        address fundingToken;
        uint256 totalFunding;
        uint256 releasedFunding;
        uint256 milestoneCount;
        bool active;
        uint256 createdAt;
        mapping(uint256 => Milestone) milestones;
    }
    
    struct ReviewerStake {
        uint256 stakedAmount;
        uint256 successfulReviews;
        uint256 totalReviews;
        bool active;
    }
    
    // Constants
    uint256 public constant REVIEWER_STAKE_REQUIRED = 1000e18; // 1000 tokens
    uint256 public constant AUTO_RELEASE_DELAY = 7 days;
    uint256 public constant MIN_REVIEWERS = 2;
    uint256 public constant APPROVAL_THRESHOLD = 66; // 66% approval needed
    
    // State
    uint256 public nextProjectId;
    mapping(uint256 => Project) public projects;
    mapping(address => ReviewerStake) public reviewerStakes;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public reviewerVotes;
    
    IERC20 public stakeToken;
    address public treasury;
    uint256 public platformFeeRate = 200; // 2%
    
    // Events
    event ProjectCreated(uint256 indexed projectId, address indexed creator, uint256 totalFunding);
    event MilestoneSubmitted(uint256 indexed projectId, uint256 indexed milestoneId, string deliverableHash);
    event MilestoneReviewed(uint256 indexed projectId, uint256 indexed milestoneId, address indexed reviewer, bool approved);
    event MilestoneReleased(uint256 indexed projectId, uint256 indexed milestoneId, uint256 amount);
    event ReviewerStaked(address indexed reviewer, uint256 amount);
    event DisputeRaised(uint256 indexed projectId, uint256 indexed milestoneId, address indexed arbitrator);
    
    // Custom errors
    error InsufficientStake();
    error UnauthorizedReviewer();
    error InvalidMilestoneStatus();
    error DeadlineNotMet();
    error InsufficientFunds();
    error AlreadyReviewed();
    
    function initialize(
        address admin,
        address _stakeToken,
        address _treasury
    ) external initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        stakeToken = IERC20(_stakeToken);
        treasury = _treasury;
        nextProjectId = 1;
    }
    
    /**
     * @dev Create a new project with milestone structure
     */
    function createProject(
        string calldata title,
        string calldata description,
        address fundingToken,
        uint256[] calldata milestoneAmounts,
        string[] calldata milestoneDescriptions,
        uint256[] calldata milestoneDeadlines
    ) external nonReentrant returns (uint256 projectId) {
        require(milestoneAmounts.length >= 2, "Minimum 2 milestones required");
        require(milestoneAmounts.length <= 8, "Maximum 8 milestones allowed");
        require(
            milestoneAmounts.length == milestoneDescriptions.length &&
            milestoneDescriptions.length == milestoneDeadlines.length,
            "Array length mismatch"
        );
        
        projectId = nextProjectId++;
        Project storage project = projects[projectId];
        
        project.creator = msg.sender;
        project.title = title;
        project.description = description;
        project.fundingToken = fundingToken;
        project.milestoneCount = milestoneAmounts.length;
        project.active = true;
        project.createdAt = block.timestamp;
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            require(milestoneDeadlines[i] > block.timestamp, "Invalid deadline");
            
            Milestone storage milestone = project.milestones[i];
            milestone.description = milestoneDescriptions[i];
            milestone.fundingAmount = milestoneAmounts[i];
            milestone.deadline = milestoneDeadlines[i];
            milestone.status = MilestoneStatus.Pending;
            milestone.autoReleaseEnabled = true;
            milestone.autoReleaseTime = milestoneDeadlines[i] + AUTO_RELEASE_DELAY;
            
            totalAmount += milestoneAmounts[i];
        }
        
        project.totalFunding = totalAmount;
        
        emit ProjectCreated(projectId, msg.sender, totalAmount);
    }
    
    /**
     * @dev Fund a project by transferring tokens to escrow
     */
    function fundProject(uint256 projectId, uint256 amount) external nonReentrant {
        Project storage project = projects[projectId];
        require(project.active, "Project not active");
        
        IERC20(project.fundingToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // Could implement proportional funding logic here
        // For now, assuming full funding
    }
    
    /**
     * @dev Submit milestone deliverables for review
     */
    function submitMilestone(
        uint256 projectId,
        uint256 milestoneId,
        string calldata deliverableHash
    ) external {
        Project storage project = projects[projectId];
        require(msg.sender == project.creator, "Only creator can submit");
        
        Milestone storage milestone = project.milestones[milestoneId];
        require(milestone.status == MilestoneStatus.Pending, "Invalid status");
        
        milestone.deliverableHash = deliverableHash;
        milestone.status = MilestoneStatus.InReview;
        milestone.submissionTime = block.timestamp;
        
        // Auto-assign reviewers (simplified - in practice, use more sophisticated matching)
        _assignReviewers(projectId, milestoneId);
        
        emit MilestoneSubmitted(projectId, milestoneId, deliverableHash);
    }
    
    /**
     * @dev Review a milestone (for reviewers)
     */
    function reviewMilestone(
        uint256 projectId,
        uint256 milestoneId,
        bool approved,
        string calldata comments
    ) external onlyRole(REVIEWER_ROLE) {
        require(reviewerStakes[msg.sender].active, "Reviewer not active");
        
        Milestone storage milestone = projects[projectId].milestones[milestoneId];
        require(milestone.status == MilestoneStatus.InReview, "Not in review");
        require(!reviewerVotes[projectId][milestoneId][msg.sender], "Already reviewed");
        
        // Check if reviewer is assigned
        bool isAssigned = false;
        for (uint i = 0; i < milestone.assignedReviewers.length; i++) {
            if (milestone.assignedReviewers[i] == msg.sender) {
                isAssigned = true;
                break;
            }
        }
        require(isAssigned, "Not assigned reviewer");
        
        reviewerVotes[projectId][milestoneId][msg.sender] = true;
        
        if (approved) {
            milestone.approvalCount++;
        }
        
        reviewerStakes[msg.sender].totalReviews++;
        
        emit MilestoneReviewed(projectId, milestoneId, msg.sender, approved);
        
        // Check if we have enough reviews
        _checkMilestoneApproval(projectId, milestoneId);
    }
    
    /**
     * @dev Release milestone funds based on approval
     */
    function releaseMilestoneFunds(uint256 projectId, uint256 milestoneId) external nonReentrant {
        Project storage project = projects[projectId];
        Milestone storage milestone = project.milestones[milestoneId];
        
        bool canRelease = false;
        
        // Check various release conditions
        if (milestone.status == MilestoneStatus.Approved) {
            canRelease = true;
        } else if (
            milestone.autoReleaseEnabled && 
            block.timestamp > milestone.autoReleaseTime &&
            milestone.status == MilestoneStatus.InReview
        ) {
            canRelease = true;
            milestone.status = MilestoneStatus.Approved;
        }
        
        require(canRelease, "Cannot release funds");
        require(milestone.status != MilestoneStatus.Released, "Already released");
        
        uint256 releaseAmount = milestone.fundingAmount;
        uint256 platformFee = (releaseAmount * platformFeeRate) / 10000;
        uint256 creatorAmount = releaseAmount - platformFee;
        
        milestone.status = MilestoneStatus.Released;
        project.releasedFunding += releaseAmount;
        
        // Transfer funds
        IERC20(project.fundingToken).safeTransfer(project.creator, creatorAmount);
        IERC20(project.fundingToken).safeTransfer(treasury, platformFee);
        
        // Reward successful reviewers
        _rewardReviewers(projectId, milestoneId);
        
        emit MilestoneReleased(projectId, milestoneId, releaseAmount);
    }
    
    /**
     * @dev Stake tokens to become a reviewer
     */
    function stakeAsReviewer() external nonReentrant {
        require(!reviewerStakes[msg.sender].active, "Already active reviewer");
        
        stakeToken.safeTransferFrom(msg.sender, address(this), REVIEWER_STAKE_REQUIRED);
        
        reviewerStakes[msg.sender] = ReviewerStake({
            stakedAmount: REVIEWER_STAKE_REQUIRED,
            successfulReviews: 0,
            totalReviews: 0,
            active: true
        });
        
        _grantRole(REVIEWER_ROLE, msg.sender);
        
        emit ReviewerStaked(msg.sender, REVIEWER_STAKE_REQUIRED);
    }
    
    /**
     * @dev Internal function to assign reviewers to milestone
     */
    function _assignReviewers(uint256 projectId, uint256 milestoneId) internal {
        // Simplified assignment - in production, use reputation scoring
        // and expertise matching
        Milestone storage milestone = projects[projectId].milestones[milestoneId];
        
        // For now, assign first available reviewers
        // This would be much more sophisticated in production
        milestone.assignedReviewers = new address[](MIN_REVIEWERS);
        // Assignment logic would go here
    }
    
    /**
     * @dev Check if milestone has enough approvals
     */
    function _checkMilestoneApproval(uint256 projectId, uint256 milestoneId) internal {
        Milestone storage milestone = projects[projectId].milestones[milestoneId];
        
        uint256 requiredApprovals = (milestone.assignedReviewers.length * APPROVAL_THRESHOLD) / 100;
        
        if (milestone.approvalCount >= requiredApprovals) {
            milestone.status = MilestoneStatus.Approved;
        }
    }
    
    /**
     * @dev Reward reviewers for successful milestone review
     */
    function _rewardReviewers(uint256 projectId, uint256 milestoneId) internal {
        // Implement reviewer reward logic
        // This could involve distributing platform fees or governance tokens
    }
    
    // View functions
    function getProject(uint256 projectId) external view returns (
        address creator,
        string memory title,
        address fundingToken,
        uint256 totalFunding,
        uint256 releasedFunding,
        uint256 milestoneCount,
        bool active
    ) {
        Project storage project = projects[projectId];
        return (
            project.creator,
            project.title,
            project.fundingToken,
            project.totalFunding,
            project.releasedFunding,
            project.milestoneCount,
            project.active
        );
    }
    
    function getMilestone(uint256 projectId, uint256 milestoneId) external view returns (
        string memory description,
        uint256 fundingAmount,
        uint256 deadline,
        MilestoneStatus status,
        uint256 approvalCount,
        string memory deliverableHash
    ) {
        Milestone storage milestone = projects[projectId].milestones[milestoneId];
        return (
            milestone.description,
            milestone.fundingAmount,
            milestone.deadline,
            milestone.status,
            milestone.approvalCount,
            milestone.deliverableHash
        );
    }
}