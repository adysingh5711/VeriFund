'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Heart, Users, Clock, ExternalLink, GitBranch } from 'lucide-react';
import { useContractWrite, useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';

interface Proposal {
    id: string;
    title: string;
    description: string;
    creator: string;
    fundingGoal: bigint;
    currentFunding: bigint;
    votes: number;
    uniqueVoters: number;
    deadline: Date;
    category: string;
    githubRepo?: string;
    ipfsHash: string;
    milestones: Milestone[];
}

interface Milestone {
    id: number;
    description: string;
    fundingAmount: bigint;
    deadline: Date;
    status: 'pending' | 'in-review' | 'approved' | 'rejected';
}

interface QuadraticVotingCardProps {
    proposal: Proposal;
    availableCredits: number;
    onVote: (proposalId: string, votes: number) => void;
    userVotes: number;
}

export function QuadraticVotingCard({
    proposal,
    availableCredits,
    onVote,
    userVotes = 0
}: QuadraticVotingCardProps) {
    const [voteCount, setVoteCount] = useState(userVotes);
    const [isHovered, setIsHovered] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const { address } = useAccount();

    // Calculate quadratic cost
    const quadraticCost = voteCount * voteCount;
    const canAfford = quadraticCost <= availableCredits;

    // Calculate funding progress
    const fundingProgress = Number(proposal.currentFunding * 100n / proposal.fundingGoal);

    // Time remaining
    const timeRemaining = Math.max(0, proposal.deadline.getTime() - Date.now());
    const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));

    const handleVoteChange = (value: number[]) => {
        setVoteCount(value[0]);
    };

    const handleSubmitVote = () => {
        if (canAfford && voteCount > 0) {
            onVote(proposal.id, voteCount);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="group"
        >
            <Card className="relative overflow-hidden backdrop-blur-sm bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                                    {proposal.category}
                                </Badge>
                                {proposal.githubRepo && (
                                    <GitBranch className="w-4 h-4 text-gray-400" />
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                                {proposal.title}
                            </h3>

                            <p className="text-gray-300 text-sm line-clamp-3 mb-4">
                                {proposal.description}
                            </p>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-gray-400 hover:text-white"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Funding Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">
                                {formatEther(proposal.currentFunding)} ETH raised
                            </span>
                            <span className="text-gray-400">
                                of {formatEther(proposal.fundingGoal)} ETH
                            </span>
                        </div>
                        <Progress
                            value={fundingProgress}
                            className="h-2 bg-white/10"
                            indicatorClassName="bg-gradient-to-r from-purple-500 to-blue-500"
                        />
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between text-sm text-gray-400 pt-2">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                <span>{proposal.votes} votes</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{proposal.uniqueVoters} backers</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{daysRemaining}d left</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="relative z-10">
                    {/* Voting Interface */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-300">
                                Vote Count: {voteCount}
                            </label>
                            <div className="text-sm text-gray-400">
                                Cost: {quadraticCost} credits
                            </div>
                        </div>

                        <Slider
                            value={[voteCount]}
                            onValueChange={handleVoteChange}
                            max={10}
                            min={0}
                            step={1}
                            className="w-full"
                            disabled={!address}
                        />

                        {/* Cost Visualization */}
                        <div className="grid grid-cols-5 gap-1">
                            {[1, 2, 3, 4, 5].map((votes) => {
                                const cost = votes * votes;
                                const isSelected = voteCount >= votes;
                                const canAffordThis = cost <= availableCredits;

                                return (
                                    <motion.div
                                        key={votes}
                                        className={`h-8 rounded flex items-center justify-center text-xs font-medium transition-all ${isSelected && canAffordThis
                                                ? 'bg-purple-500 text-white'
                                                : isSelected && !canAffordThis
                                                    ? 'bg-red-500/50 text-red-200'
                                                    : canAffordThis
                                                        ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                                                        : 'bg-red-500/20 text-red-400'
                                            }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {cost}
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Available: {availableCredits} credits</span>
                            <span>
                                {canAfford ? '✓ Affordable' : '✗ Too expensive'}
                            </span>
                        </div>

                        <Button
                            onClick={handleSubmitVote}
                            disabled={!address || !canAfford || voteCount === 0 || voteCount === userVotes}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                        >
                            {!address ? 'Connect Wallet' :
                                voteCount === userVotes ? 'Current Vote' :
                                    voteCount === 0 ? 'Select Votes' :
                                        !canAfford ? 'Insufficient Credits' :
                                            'Cast Vote'}
                        </Button>
                    </div>

                    {/* Milestone Preview */}
                    <AnimatePresence>
                        {isHovered && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-4 pt-4 border-t border-white/10"
                            >
                                <h4 className="text-sm font-medium text-white mb-2">
                                    Milestones ({proposal.milestones.length})
                                </h4>
                                <div className="space-y-2">
                                    {proposal.milestones.slice(0, 3).map((milestone, index) => (
                                        <div key={milestone.id} className="flex items-center gap-2 text-xs">
                                            <div className={`w-2 h-2 rounded-full ${milestone.status === 'approved' ? 'bg-green-500' :
                                                    milestone.status === 'in-review' ? 'bg-yellow-500' :
                                                        milestone.status === 'rejected' ? 'bg-red-500' :
                                                            'bg-gray-500'
                                                }`} />
                                            <span className="text-gray-300 truncate">
                                                {milestone.description}
                                            </span>
                                            <span className="text-gray-400 ml-auto">
                                                {formatEther(milestone.fundingAmount)} ETH
                                            </span>
                                        </div>
                                    ))}
                                    {proposal.milestones.length > 3 && (
                                        <div className="text-xs text-gray-400 text-center">
                                            +{proposal.milestones.length - 3} more milestones
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
}