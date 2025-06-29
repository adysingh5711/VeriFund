// packages/frontend/src/constants/contracts.ts
import { Address } from 'viem';

// Contract addresses - these would be populated after deployment
export const QUADRATIC_VOTING_ADDRESS: Address = '0x0000000000000000000000000000000000000000';
export const MILESTONE_FUNDING_ADDRESS: Address = '0x0000000000000000000000000000000000000000';
export const MOCK_ERC20_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

// QuadraticVoting contract ABI
export const QUADRATIC_VOTING_ABI = [
    // Events
    {
        type: 'event',
        name: 'VotingRoundStarted',
        inputs: [
            { name: 'roundId', type: 'uint256', indexed: true },
            { name: 'startTime', type: 'uint256', indexed: false },
            { name: 'commitDuration', type: 'uint256', indexed: false },
            { name: 'revealDuration', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'VoteCommitted',
        inputs: [
            { name: 'roundId', type: 'uint256', indexed: true },
            { name: 'voter', type: 'address', indexed: true },
            { name: 'proposalId', type: 'uint256', indexed: true },
            { name: 'commitment', type: 'bytes32', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'VoteRevealed',
        inputs: [
            { name: 'roundId', type: 'uint256', indexed: true },
            { name: 'voter', type: 'address', indexed: true },
            { name: 'proposalId', type: 'uint256', indexed: true },
            { name: 'votes', type: 'uint256', indexed: false },
        ],
    },

    // Read Functions
    {
        type: 'function',
        name: 'currentRoundId',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'votingRounds',
        inputs: [{ name: '', type: 'uint256' }],
        outputs: [
            { name: 'roundId', type: 'uint256' },
            { name: 'startTime', type: 'uint256' },
            { name: 'commitDuration', type: 'uint256' },
            { name: 'revealDuration', type: 'uint256' },
            { name: 'baseCredits', type: 'uint256' },
            { name: 'active', type: 'bool' },
            { name: 'merkleRoot', type: 'bytes32' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getUserCredits',
        inputs: [
            { name: 'user', type: 'address' },
            { name: 'roundId', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getProposalResult',
        inputs: [
            { name: 'roundId', type: 'uint256' },
            { name: 'proposalId', type: 'uint256' },
        ],
        outputs: [
            { name: 'totalVotes', type: 'uint256' },
            { name: 'quadraticScore', type: 'uint256' },
            { name: 'uniqueVoters', type: 'uint256' },
            { name: 'fundingAllocated', type: 'uint256' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getUserReputation',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [
            { name: 'participationCount', type: 'uint256' },
            { name: 'accuracyScore', type: 'uint256' },
            { name: 'totalCreditsUsed', type: 'uint256' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'paused',
        inputs: [],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
    },

    // Write Functions
    {
        type: 'function',
        name: 'initialize',
        inputs: [{ name: '_admin', type: 'address' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'startVotingRound',
        inputs: [
            { name: '_commitDuration', type: 'uint256' },
            { name: '_revealDuration', type: 'uint256' },
            { name: '_baseCredits', type: 'uint256' },
            { name: '_merkleRoot', type: 'bytes32' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'commitVote',
        inputs: [
            { name: '_proposalId', type: 'uint256' },
            { name: '_commitment', type: 'bytes32' },
            { name: '_merkleProof', type: 'bytes32[]' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'revealVote',
        inputs: [
            { name: '_proposalId', type: 'uint256' },
            { name: '_votes', type: 'uint256' },
            { name: '_nonce', type: 'string' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'pause',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'unpause',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable',
    },
] as const;

// MilestoneFunding contract ABI
export const MILESTONE_FUNDING_ABI = [
    // Events
    {
        type: 'event',
        name: 'ProjectCreated',
        inputs: [
            { name: 'projectId', type: 'uint256', indexed: true },
            { name: 'creator', type: 'address', indexed: true },
            { name: 'ipfsHash', type: 'string', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'MilestoneCompleted',
        inputs: [
            { name: 'projectId', type: 'uint256', indexed: true },
            { name: 'milestoneIndex', type: 'uint256', indexed: true },
            { name: 'amountReleased', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'ReviewerAssigned',
        inputs: [
            { name: 'projectId', type: 'uint256', indexed: true },
            { name: 'milestoneIndex', type: 'uint256', indexed: true },
            { name: 'reviewer', type: 'address', indexed: true },
        ],
    },
    {
        type: 'event',
        name: 'ReviewSubmitted',
        inputs: [
            { name: 'projectId', type: 'uint256', indexed: true },
            { name: 'milestoneIndex', type: 'uint256', indexed: true },
            { name: 'reviewer', type: 'address', indexed: true },
            { name: 'approved', type: 'bool', indexed: false },
        ],
    },

    // Read Functions
    {
        type: 'function',
        name: 'projectCount',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'projects',
        inputs: [{ name: '', type: 'uint256' }],
        outputs: [
            { name: 'id', type: 'uint256' },
            { name: 'creator', type: 'address' },
            { name: 'ipfsHash', type: 'string' },
            { name: 'totalFunding', type: 'uint256' },
            { name: 'releasedFunding', type: 'uint256' },
            { name: 'milestoneCount', type: 'uint256' },
            { name: 'createdAt', type: 'uint256' },
            { name: 'active', type: 'bool' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getMilestone',
        inputs: [
            { name: '_projectId', type: 'uint256' },
            { name: '_milestoneIndex', type: 'uint256' },
        ],
        outputs: [
            { name: 'description', type: 'string' },
            { name: 'fundingPercentage', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'ipfsHash', type: 'string' },
            { name: 'completed', type: 'bool' },
            { name: 'reviewCount', type: 'uint256' },
            { name: 'approvalCount', type: 'uint256' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getReviewerStake',
        inputs: [{ name: '_reviewer', type: 'address' }],
        outputs: [
            { name: 'amount', type: 'uint256' },
            { name: 'reviewCount', type: 'uint256' },
            { name: 'accuracyScore', type: 'uint256' },
            { name: 'active', type: 'bool' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'isReviewer',
        inputs: [{ name: '_address', type: 'address' }],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
    },

    // Write Functions
    {
        type: 'function',
        name: 'initialize',
        inputs: [
            { name: '_stakingToken', type: 'address' },
            { name: '_treasury', type: 'address' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'createProject',
        inputs: [
            { name: '_ipfsHash', type: 'string' },
            { name: '_milestoneDescriptions', type: 'string[]' },
            { name: '_fundingPercentages', type: 'uint256[]' },
            { name: '_deadlines', type: 'uint256[]' },
        ],
        outputs: [{ name: 'projectId', type: 'uint256' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'fundProject',
        inputs: [{ name: '_projectId', type: 'uint256' }],
        outputs: [],
        stateMutability: 'payable',
    },
    {
        type: 'function',
        name: 'stakeAsReviewer',
        inputs: [{ name: '_amount', type: 'uint256' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'submitMilestone',
        inputs: [
            { name: '_projectId', type: 'uint256' },
            { name: '_milestoneIndex', type: 'uint256' },
            { name: '_ipfsHash', type: 'string' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'reviewMilestone',
        inputs: [
            { name: '_projectId', type: 'uint256' },
            { name: '_milestoneIndex', type: 'uint256' },
            { name: '_approved', type: 'bool' },
            { name: '_comments', type: 'string' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'releaseFunds',
        inputs: [
            { name: '_projectId', type: 'uint256' },
            { name: '_milestoneIndex', type: 'uint256' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
] as const;

// MockERC20 ABI for testing
export const MOCK_ERC20_ABI = [
    {
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'transfer',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'approve',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'allowance',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'mint',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
] as const;

// Network configuration
export const SUPPORTED_CHAINS = {
    hardhat: {
        id: 31337,
        name: 'Hardhat',
        rpcUrl: 'http://127.0.0.1:8545',
    },
    sepolia: {
        id: 11155111,
        name: 'Sepolia',
        rpcUrl: 'https://sepolia.infura.io/v3/',
    },
} as const;

// Contract deployment addresses by network
export const DEPLOYMENT_ADDRESSES = {
    [SUPPORTED_CHAINS.hardhat.id]: {
        QuadraticVoting: '0x0000000000000000000000000000000000000000', // Will be updated after deployment
        MilestoneFunding: '0x0000000000000000000000000000000000000000',
        MockERC20: '0x0000000000000000000000000000000000000000',
    },
    [SUPPORTED_CHAINS.sepolia.id]: {
        QuadraticVoting: '0x0000000000000000000000000000000000000000',
        MilestoneFunding: '0x0000000000000000000000000000000000000000',
        MockERC20: '0x0000000000000000000000000000000000000000',
    },
} as const;

// Helper function to get contract addresses for current network
export function getContractAddress(contractName: keyof typeof DEPLOYMENT_ADDRESSES[31337], chainId: number): Address {
    const addresses = DEPLOYMENT_ADDRESSES[chainId as keyof typeof DEPLOYMENT_ADDRESSES];
    if (!addresses) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return addresses[contractName];
}

// Voting phases enum for type safety
export enum VotingPhase {
    COMMIT = 'commit',
    REVEAL = 'reveal',
    CLOSED = 'closed',
}

// Project status enum
export enum ProjectStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    UNDER_REVIEW = 'under_review',
}

// Milestone status enum
export enum MilestoneStatus {
    PENDING = 'pending',
    SUBMITTED = 'submitted',
    UNDER_REVIEW = 'under_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    COMPLETED = 'completed',
}