'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Zap, Target, Clock } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface DashboardStats {
    totalFunding: number;
    activeProposals: number;
    totalVotes: number;
    uniqueVoters: number;
    avgCompletionRate: number;
    fundingTrend: number[];
    votingTrend: number[];
    categoryDistribution: { [key: string]: number };
    milestoneSuccess: number;
    recentActivity: ActivityItem[];
}

interface ActivityItem {
    id: string;
    type: 'vote' | 'proposal' | 'milestone' | 'funding';
    title: string;
    timestamp: Date;
    amount?: number;
    user?: string;
}

export function AnalyticsDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch dashboard data
        fetchDashboardStats();
    }, [timeRange]);

    const fetchDashboardStats = async () => {
        // This would fetch from your API/subgraph
        // For now, using mock data
        const mockStats: DashboardStats = {
            totalFunding: 245000,
            activeProposals: 42,
            totalVotes: 1337,
            uniqueVoters: 256,
            avgCompletionRate: 84.2,
            fundingTrend: [12000, 15000, 18000, 22000, 25000, 28000, 31000],
            votingTrend: [45, 52, 48, 61, 58, 67, 71],
            categoryDistribution: {
                'DeFi': 35,
                'NFT': 28,
                'Infrastructure': 22,
                'Gaming': 15
            },
            milestoneSuccess: 87.5,
            recentActivity: [
                {
                    id: '1',
                    type: 'vote',
                    title: 'New votes on "DEX Aggregator Protocol"',
                    timestamp: new Date(),
                    amount: 15
                },
                {
                    id: '2',
                    type: 'milestone',
                    title: 'Milestone completed: "Smart Contract Audit"',
                    timestamp: new Date(Date.now() - 1000 * 60 * 30),
                    amount: 5000
                }
            ]
        };

        setStats(mockStats);
        setLoading(false);
    };

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    const lineChartData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
        datasets: [
            {
                label: 'Funding (ETH)',
                data: stats.fundingTrend,
                borderColor: 'rgb(147, 51, 234)',
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const barChartData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
        datasets: [
            {
                label: 'Votes Cast',
                data: stats.votingTrend,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
            },
        ],
    };

    const doughnutData = {
        labels: Object.keys(stats.categoryDistribution),
        datasets: [
            {
                data: Object.values(stats.categoryDistribution),
                backgroundColor: [
                    'rgba(147, 51, 234, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 101, 101, 0.8)',
                ],
                borderColor: [
                    'rgb(147, 51, 234)',
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)',
                    'rgb(245, 101, 101)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'rgb(156, 163, 175)',
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    color: 'rgb(156, 163, 175)',
                },
                grid: {
                    color: 'rgba(156, 163, 175, 0.1)',
                },
            },
            y: {
                ticks: {
                    color: 'rgb(156, 163, 175)',
                },
                grid: {
                    color: 'rgba(156, 163, 175, 0.1)',
                },
            },
        },
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-300">
                                Total Funding
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                ${stats.totalFunding.toLocaleString()}
                            </div>
                            <p className="text-xs text-purple-300">
                                +12.5% from last month
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-300">
                                Active Proposals
                            </CardTitle>
                            <Target className="h-4 w-4 text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {stats.activeProposals}
                            </div>
                            <p className="text-xs text-blue-300">
                                8 new this week
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-300">
                                Total Votes
                            </CardTitle>
                            <Zap className="h-4 w-4 text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {stats.totalVotes}
                            </div>
                            <p className="text-xs text-green-300">
                                {stats.uniqueVoters} unique voters
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-300">
                                Success Rate
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-yellow-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {stats.milestoneSuccess}%
                            </div>
                            <p className="text-xs text-yellow-300">
                                Milestone completion
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Charts Section */}
            <Tabs defaultValue="funding" className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList className="bg-white/5 border-white/10">
                        <TabsTrigger value="funding" className="data-[state=active]:bg-purple-500/20">
                            Funding Trends
                        </TabsTrigger>
                        <TabsTrigger value="voting" className="data-[state=active]:bg-purple-500/20">
                            Voting Activity
                        </TabsTrigger>
                        <TabsTrigger value="categories" className="data-[state=active]:bg-purple-500/20">
                            Categories
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2">
                        {(['7d', '30d', '90d'] as const).map((range) => (
                            <Badge
                                key={range}
                                variant={timeRange === range ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => setTimeRange(range)}
                            >
                                {range}
                            </Badge>
                        ))}
                    </div>
                </div>

                <TabsContent value="funding" className="space-y-4">
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white">Funding Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <Line data={lineChartData} options={chartOptions} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="voting" className="space-y-4">
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white">Voting Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <Bar data={barChartData} options={chartOptions} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white">Project Categories</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <Doughnut data={doughnutData} options={{ ...chartOptions, maintainAspectRatio: false }} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white">Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {stats.recentActivity.map((activity) => (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                                        >
                                            <div className={`w-2 h-2 rounded-full ${activity.type === 'vote' ? 'bg-purple-500' :
                                                    activity.type === 'milestone' ? 'bg-green-500' :
                                                        activity.type === 'proposal' ? 'bg-blue-500' :
                                                            'bg-yellow-500'
                                                }`} />
                                            <div className="flex-1">
                                                <p className="text-sm text-white font-medium">
                                                    {activity.title}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {activity.timestamp.toLocaleDateString()}
                                                </p>
                                            </div>
                                            {activity.amount && (
                                                <Badge variant="outline" className="text-xs">
                                                    {activity.type === 'vote' ? `${activity.amount} votes` : `${activity.amount}`}
                                                </Badge>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}