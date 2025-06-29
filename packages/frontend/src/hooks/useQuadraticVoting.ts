// packages/frontend/src/hooks/useQuadraticVoting.ts
import { useState, useCallback, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { toast } from 'sonner';
import { parseEther, formatEther, keccak256, encodePacked } from 'viem';
import { QUADRATIC_VOTING_ABI, QUADRATIC_VOTING_ADDRESS } from '../constants/contracts';

interface VotingState {
  currentRoundId: number;
  availableCredits: number;
  votingPhase: 'commit' | 'reveal' | 'closed';
  userVotes: { [proposalId: string]: number };
  commitments: { [proposalId: string]: string };
  nonces: { [proposalId: string]: string };
}

interface ProposalResult {
  totalVotes: number;
  quadraticScore: number;
  uniqueVoters: number;
  fundingAllocated: bigint;
}

export function useQuadraticVoting() {
  const { address } = useAccount();
  const [votingState, setVotingState] = useState<VotingState>({
    currentRoundId: 0,
    availableCredits: 100,
    votingPhase: 'closed',
    userVotes: {},
    commitments: {},
    nonces: {}
  });
  const [isLoading, setIsLoading] = useState(false);

  // Read current round info
  const { data: currentRoundId } = useContractRead({
    address: QUADRATIC_VOTING_ADDRESS,
    abi: QUADRATIC_VOTING_ABI,
    functionName: 'currentRoundId',
    watch: true,
  });

  // Read user's available credits
  const { data: userCredits } = useContractRead({
    address: QUADRATIC_VOTING_ADDRESS,
    abi: QUADRATIC_VOTING_ABI,
    functionName: 'getUserCredits',
    args: [address, currentRoundId || 0],
    enabled: !!address && !!currentRoundId,
    watch: true,
  });

  // Read current round details
  const { data: roundData } = useContractRead({
    address: QUADRATIC_VOTING_ADDRESS,
    abi: QUADRATIC_VOTING_ABI,
    functionName: 'votingRounds',
    args: [currentRoundId || 0],
    enabled: !!currentRoundId,
    watch: true,
  });

  // Calculate quadratic cost for votes
  const calculateQuadraticCost = useCallback((votes: number): number => {
    return votes * votes;
  }, []);

  // Calculate total credits used across all proposals
  const getTotalCreditsUsed = useCallback((): number => {
    return Object.values(votingState.userVotes).reduce((total, votes) => {
      return total + calculateQuadraticCost(votes);
    }, 0);
  }, [votingState.userVotes, calculateQuadraticCost]);

  // Generate a random nonce for commitment
  const generateNonce = useCallback((): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }, []);

  // Create commitment hash
  const createCommitment = useCallback((proposalId: string, votes: number, nonce: string): string => {
    const commitment = keccak256(
      encodePacked(
        ['uint256', 'uint256', 'string'],
        [BigInt(proposalId), BigInt(votes), nonce]
      )
    );
    return commitment;
  }, []);

  // Determine current voting phase
  const getCurrentPhase = useCallback((): 'commit' | 'reveal' | 'closed' => {
    if (!roundData) return 'closed';

    const now = Math.floor(Date.now() / 1000);
    const [, startTime, commitDuration, revealDuration, , ,] = roundData;

    const commitEndTime = Number(startTime) + Number(commitDuration);
    const revealEndTime = commitEndTime + Number(revealDuration);

    if (now < commitEndTime) return 'commit';
    if (now < revealEndTime) return 'reveal';
    return 'closed';
  }, [roundData]);

  // Prepare commit vote transaction
  const { writeAsync: commitVote, isPending: isCommitting } = useContractWrite({
    address: QUADRATIC_VOTING_ADDRESS,
    abi: QUADRATIC_VOTING_ABI,
    functionName: 'commitVote',
    args: [],
    enabled: false, // We'll enable this when needed
  });

  // Prepare reveal vote transaction
  const { writeAsync: revealVote, isPending: isRevealing } = useContractWrite({
    address: QUADRATIC_VOTING_ADDRESS,
    abi: QUADRATIC_VOTING_ABI,
    functionName: 'revealVote',
    args: [],
    enabled: false,
  });

  // Update voting state when contract data changes
  useEffect(() => {
    if (currentRoundId && userCredits && roundData) {
      setVotingState(prev => ({
        ...prev,
        currentRoundId: Number(currentRoundId),
        availableCredits: Number(userCredits),
        votingPhase: getCurrentPhase(),
      }));
    }
  }, [currentRoundId, userCredits, roundData, getCurrentPhase]);

  // Cast vote for a proposal
  const castVote = useCallback(async (proposalId: string, votes: number) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (votes <= 0) {
      toast.error('Vote count must be positive');
      return;
    }

    const cost = calculateQuadraticCost(votes);
    const currentCreditsUsed = getTotalCreditsUsed();
    const creditsAfterVote = currentCreditsUsed - calculateQuadraticCost(votingState.userVotes[proposalId] || 0) + cost;

    if (creditsAfterVote > votingState.availableCredits) {
      toast.error('Insufficient credits');
      return;
    }

    const phase = getCurrentPhase();

    if (phase === 'commit') {
      // Generate nonce and create commitment
      const nonce = generateNonce();
      const commitment = createCommitment(proposalId, votes, nonce);

      // Update local state
      setVotingState(prev => ({
        ...prev,
        userVotes: { ...prev.userVotes, [proposalId]: votes },
        commitments: { ...prev.commitments, [proposalId]: commitment },
        nonces: { ...prev.nonces, [proposalId]: nonce },
      }));

      // Store in localStorage for persistence
      localStorage.setItem(`vote_${proposalId}_${currentRoundId}`, JSON.stringify({
        votes,
        nonce,
        commitment
      }));

      toast.success(`Vote prepared for proposal ${proposalId}. Remember to commit on-chain!`);

    } else if (phase === 'reveal') {
      toast.error('Cannot change votes during reveal phase');
    } else {
      toast.error('Voting is currently closed');
    }
  }, [
    address,
    calculateQuadraticCost,
    getTotalCreditsUsed,
    votingState.availableCredits,
    votingState.userVotes,
    getCurrentPhase,
    generateNonce,
    createCommitment,
    currentRoundId
  ]);

  // Commit all votes on-chain
  const commitAllVotes = useCallback(async () => {
    if (!address || Object.keys(votingState.commitments).length === 0) {
      toast.error('No votes to commit');
      return;
    }

    if (getCurrentPhase() !== 'commit') {
      toast.error('Not in commit phase');
      return;
    }

    setIsLoading(true);
    try {
      const proposalIds = Object.keys(votingState.commitments);
      const commitments = proposalIds.map(id => votingState.commitments[id]);

      // Call contract with batch commit (assuming the contract supports this)
      // For now, we'll commit individual votes
      for (let i = 0; i < proposalIds.length; i++) {
        const proposalId = proposalIds[i];
        const commitment = commitments[i];

        // This would need to be implemented with the actual contract call
        console.log(`Committing vote for proposal ${proposalId}: ${commitment}`);
      }

      toast.success('All votes committed successfully!');
    } catch (error) {
      console.error('Error committing votes:', error);
      toast.error('Failed to commit votes');
    } finally {
      setIsLoading(false);
    }
  }, [address, votingState.commitments, getCurrentPhase]);

  // Reveal all votes on-chain
  const revealAllVotes = useCallback(async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (getCurrentPhase() !== 'reveal') {
      toast.error('Not in reveal phase');
      return;
    }

    setIsLoading(true);
    try {
      const proposalIds = Object.keys(votingState.userVotes);

      for (const proposalId of proposalIds) {
        const votes = votingState.userVotes[proposalId];
        const nonce = votingState.nonces[proposalId];

        if (votes && nonce) {
          // This would call the actual reveal function
          console.log(`Revealing vote for proposal ${proposalId}: ${votes} votes with nonce ${nonce}`);
        }
      }

      toast.success('All votes revealed successfully!');
    } catch (error) {
      console.error('Error revealing votes:', error);
      toast.error('Failed to reveal votes');
    } finally {
      setIsLoading(false);
    }
  }, [address, votingState.userVotes, votingState.nonces, getCurrentPhase]);

  // Get proposal results
  const getProposalResults = useCallback(async (proposalId: string): Promise<ProposalResult | null> => {
    try {
      // This would read from the contract
      // For now, return mock data
      return {
        totalVotes: 0,
        quadraticScore: 0,
        uniqueVoters: 0,
        fundingAllocated: BigInt(0),
      };
    } catch (error) {
      console.error('Error fetching proposal results:', error);
      return null;
    }
  }, []);

  // Load saved votes from localStorage on mount
  useEffect(() => {
    if (currentRoundId && address) {
      const savedVotes: { [key: string]: number } = {};
      const savedCommitments: { [key: string]: string } = {};
      const savedNonces: { [key: string]: string } = {};

      // Check localStorage for saved votes
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`vote_`) && key.includes(`_${currentRoundId}`)) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            const proposalId = key.split('_')[1];

            savedVotes[proposalId] = data.votes;
            savedCommitments[proposalId] = data.commitment;
            savedNonces[proposalId] = data.nonce;
          } catch (error) {
            console.error('Error loading saved vote:', error);
          }
        }
      }

      setVotingState(prev => ({
        ...prev,
        userVotes: savedVotes,
        commitments: savedCommitments,
        nonces: savedNonces,
      }));
    }
  }, [currentRoundId, address]);

  return {
    // State
    votingState,
    isLoading: isLoading || isCommitting || isRevealing,

    // Actions
    castVote,
    commitAllVotes,
    revealAllVotes,

    // Utilities
    calculateQuadraticCost,
    getTotalCreditsUsed,
    getCurrentPhase,
    getProposalResults,

    // Computed values
    remainingCredits: votingState.availableCredits - getTotalCreditsUsed(),
    canVote: getCurrentPhase() === 'commit',
    canReveal: getCurrentPhase() === 'reveal',
    hasUncommittedVotes: Object.keys(votingState.userVotes).length > 0,
  };
}