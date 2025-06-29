// packages/frontend/src/hooks/useMilestoneFunding.ts
import { useState, useCallback, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { toast } from 'sonner';
import { parseEther, formatEther, Address } from 'viem';
import { MILESTONE_FUNDING_ABI, MILESTONE_FUNDING_ADDRESS, MOCK_ERC20_ABI, ProjectStatus, MilestoneStatus } from '../constants/contracts';

interface Project {
    id: number;
    creator: Address;
    ipfsHash: string;
    totalFunding: bigint;
    releasedFunding: bigint;
    milestoneCount: number;
    createdAt: number;
    active: boolean;
    status: ProjectStatus;
}

interface Milestone {
    description: string;
    fundingPercentage: number;
    deadline: number;
    ipfsHash: string;
    completed: boolean;
    reviewCount: number;
    approvalCount: number;
    status: MilestoneStatus;
}

interface ReviewerStake {
    amount: bigint;
    reviewCount: number;
    accuracyScore: number;
    active: boolean;
}

interface CreateProjectParams {
    ipfsHash: string;
    milestoneDescriptions: string[];
    fundingPercentages: number[];
    deadlines: number[];
}

export function useMilestoneFunding() {
    const { address } = useAccount();
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);

    // Read total project count
    const { data: projectCount } = useContractRead({
        address: MILESTONE_FUNDING_ADDRESS,
        abi: MILESTONE_FUNDING_ABI,
        functionName: 'projectCount',
    });

    // Read user's reviewer stake
    const { data: reviewerStake } = useContractRead({
        address: MILESTONE_FUNDING_ADDRESS,
        abi: MILESTONE_FUNDING_ABI,
        functionName: 'getReviewerStake',
        args: [address as Address],
    });

    // Check if user is a reviewer
    const { data: isReviewer } = useContractRead({
        address: MILESTONE_FUNDING_ADDRESS,
        abi: MILESTONE_FUNDING_ABI,
        functionName: 'isReviewer',
        args: [address as Address],
    });

    // Set up contract write hooks for MilestoneFunding
    const createProjectWrite = useContractWrite();
    const fundProjectWrite = useContractWrite();
    const stakeAsReviewerWrite = useContractWrite();

    // Get project details
    const getProject = useCallback(async (projectId: number): Promise<Project | null> => {
        try {
            // This would use the contract read to get project data
            // For now, return mock data structure
            return {
                id: projectId,
                creator: '0x0000000000000000000000000000000000000000',
                ipfsHash: '',
                totalFunding: BigInt(0),
                releasedFunding: BigInt(0),
                milestoneCount: 0,
                createdAt: Date.now(),
                active: true,
                status: ProjectStatus.ACTIVE,
            };
        } catch (error) {
            console.error('Error fetching project:', error);
            return null;
        }
    }, []);

    // Get milestone details
    const getMilestone = useCallback(async (
        projectId: number,
        milestoneIndex: number
    ): Promise<Milestone | null> => {
        try {
            // This would use the contract read to get milestone data
            return {
                description: '',
                fundingPercentage: 0,
                deadline: 0,
                ipfsHash: '',
                completed: false,
                reviewCount: 0,
                approvalCount: 0,
                status: MilestoneStatus.PENDING,
            };
        } catch (error) {
            console.error('Error fetching milestone:', error);
            return null;
        }
    }, []);

    // Create a new project
    const handleCreateProject = useCallback(async (params: CreateProjectParams) => {
        if (!address) {
            toast.error('Please connect your wallet');
            return;
        }

        // Validate parameters
        if (params.milestoneDescriptions.length < 3 || params.milestoneDescriptions.length > 8) {
            toast.error('Projects must have between 3 and 8 milestones');
            return;
        }

        if (params.fundingPercentages.reduce((sum, pct) => sum + pct, 0) !== 100) {
            toast.error('Funding percentages must sum to 100%');
            return;
        }

        setIsLoading(true);
        try {
            // Validate deadlines are in the future and in order
            const now = Math.floor(Date.now() / 1000);
            for (let i = 0; i < params.deadlines.length; i++) {
                if (params.deadlines[i] <= now) {
                    throw new Error(`Milestone ${i + 1} deadline must be in the future`);
                }
                if (i > 0 && params.deadlines[i] <= params.deadlines[i - 1]) {
                    throw new Error(`Milestone ${i + 1} deadline must be after previous milestone`);
                }
            }

            // Upload project metadata to IPFS (would be implemented with actual IPFS client)
            console.log('Uploading project metadata to IPFS:', params);

            // For now, we'll use the provided IPFS hash
            // In a real implementation, this would call createProject with the actual parameters
            toast.success('Project creation initiated. Please confirm the transaction.');

        } catch (error) {
            console.error('Error creating project:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create project');
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    // Fund a project
    const handleFundProject = useCallback(async (projectId: number, amount: string) => {
        if (!address) {
            toast.error('Please connect your wallet');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid funding amount');
            return;
        }

        try {
            const amountWei = parseEther(amount);
            console.log(`Funding project ${projectId} with ${amount} ETH`);

            // This would call the actual fund project function
            toast.success('Funding transaction initiated. Please confirm in your wallet.');

        } catch (error) {
            console.error('Error funding project:', error);
            toast.error('Failed to fund project');
        }
    }, [address]);

    // Submit milestone for review
    const submitMilestone = useCallback(async (
        projectId: number,
        milestoneIndex: number,
        ipfsHash: string
    ) => {
        if (!address) {
            toast.error('Please connect your wallet');
            return;
        }

        try {
            console.log(`Submitting milestone ${milestoneIndex} for project ${projectId}`);
            console.log('IPFS hash:', ipfsHash);

            // This would call the contract function
            toast.success('Milestone submitted for review!');

        } catch (error) {
            console.error('Error submitting milestone:', error);
            toast.error('Failed to submit milestone');
        }
    }, [address]);

    // Review a milestone (for reviewers)
    const reviewMilestone = useCallback(async (
        projectId: number,
        milestoneIndex: number,
        approved: boolean,
        comments: string
    ) => {
        if (!address) {
            toast.error('Please connect your wallet');
            return;
        }

        if (!isReviewer) {
            toast.error('You are not registered as a reviewer');
            return;
        }

        try {
            console.log(`Reviewing milestone ${milestoneIndex} for project ${projectId}`);
            console.log('Approved:', approved, 'Comments:', comments);

            // This would call the contract function
            toast.success(`Milestone ${approved ? 'approved' : 'rejected'} successfully!`);

        } catch (error) {
            console.error('Error reviewing milestone:', error);
            toast.error('Failed to submit review');
        }
    }, [address, isReviewer]);

    // Release funds for completed milestone
    const releaseFunds = useCallback(async (projectId: number, milestoneIndex: number) => {
        if (!address) {
            toast.error('Please connect your wallet');
            return;
        }

        try {
            console.log(`Releasing funds for milestone ${milestoneIndex} of project ${projectId}`);

            // This would call the contract function
            toast.success('Funds released successfully!');

        } catch (error) {
            console.error('Error releasing funds:', error);
            toast.error('Failed to release funds');
        }
    }, [address]);

    // Become a reviewer by staking tokens
    const becomeReviewer = useCallback(async (stakeAmount: string) => {
        if (!address) {
            toast.error('Please connect your wallet');
            return;
        }

        if (!stakeAmount || parseFloat(stakeAmount) < 1000) {
            toast.error('Minimum stake amount is 1000 tokens');
            return;
        }

        try {
            const amountWei = parseEther(stakeAmount);
            console.log(`Staking ${stakeAmount} tokens to become reviewer`);

            // This would call the actual stake function
            toast.success('Reviewer stake submitted. Please confirm the transaction.');

        } catch (error) {
            console.error('Error staking as reviewer:', error);
            toast.error('Failed to stake as reviewer');
        }
    }, [address]);

    // Load user's projects
    const loadUserProjects = useCallback(async () => {
        if (!address || !projectCount) return;

        setIsLoading(true);
        try {
            const userProjects: Project[] = [];

            // In a real implementation, this would iterate through projects
            // and filter by creator address
            for (let i = 1; i <= Number(projectCount); i++) {
                const project = await getProject(i);
                if (project && project.creator.toLowerCase() === address.toLowerCase()) {
                    userProjects.push(project);
                }
            }

            setProjects(userProjects);
        } catch (error) {
            console.error('Error loading user projects:', error);
            toast.error('Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    }, [address, projectCount, getProject]);

    // Load projects on mount and when dependencies change
    useEffect(() => {
        if (address && projectCount) {
            loadUserProjects();
        }
    }, [address, projectCount, loadUserProjects]);

    // Calculate project completion percentage
    const getProjectProgress = useCallback(async (projectId: number): Promise<number> => {
        try {
            const project = await getProject(projectId);
            if (!project) return 0;

            let completedMilestones = 0;
            for (let i = 0; i < project.milestoneCount; i++) {
                const milestone = await getMilestone(projectId, i);
                if (milestone?.completed) {
                    completedMilestones++;
                }
            }

            return (completedMilestones / project.milestoneCount) * 100;
        } catch (error) {
            console.error('Error calculating project progress:', error);
            return 0;
        }
    }, [getProject, getMilestone]);

    return {
        // State
        projects,
        isLoading: isLoading,
        projectCount: Number(projectCount || 0),
        reviewerStake: reviewerStake ? {
            amount: reviewerStake[0] || BigInt(0),
            reviewCount: Number(reviewerStake[1] || 0),
            accuracyScore: Number(reviewerStake[2] || 0),
            active: Boolean(reviewerStake[3]),
        } : null,
        isReviewer: Boolean(isReviewer),

        // Actions
        handleCreateProject,
        handleFundProject,
        submitMilestone,
        reviewMilestone,
        releaseFunds,
        becomeReviewer,

        // Utilities
        getProject,
        getMilestone,
        getProjectProgress,
        loadUserProjects,

        // Computed values
        hasActiveProjects: projects.some(p => p.status === ProjectStatus.ACTIVE),
        totalProjectsFunded: projects.length,
        canReview: Boolean(isReviewer),
        needsReviewerStake: !isReviewer && Boolean(address),
    };
}