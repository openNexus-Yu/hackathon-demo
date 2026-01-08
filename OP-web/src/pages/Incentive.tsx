import { motion } from 'framer-motion';
import { Target, Zap, Gift, Trophy, ArrowLeft, CheckCircle, Twitter, Code2, FileText, ChevronRight, Loader2, Clock, Star, MessageSquare, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = 'http://localhost:3000';

// Types from backend API
interface Task {
    id: number;
    title: string;
    description: string | null;
    points: number;
    task_type: string;
    recurrence: string;
    stock_limit: number | null;
    claimed_count: number;
    is_active: boolean;
    user_claimed: boolean;
    chat_room_id: string | null;
    chat_required: boolean;
}

interface Activity {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    order_index: number;
    tasks: Task[];
}

interface Campaign {
    id: number;
    org_id: number;
    name: string;
    description: string | null;
    banner_url: string | null;
    type: 'permanent' | 'limited';
    start_time: string | null;
    end_time: string | null;
    is_active: boolean;
    activities: Activity[];
    chat_room_id: string | null;
}

interface CampaignList {
    permanent: Campaign[];
    limited: Campaign[];
}

interface UserPoints {
    user_id: number;
    org_id: number;
    total_points: number;
    spent_points: number;
    available_points: number;
    level: number;
}

interface Prize {
    id: number;
    name: string;
    description: string | null;
    image_url: string | null;
    type: string;
    points_required: number;
    stock: number | null;
    claimed_count: number;
    is_available: boolean;
}

// Mock org data for demo orgs ONLY (不包括真实组织)
const orgsData: Record<string, { name: string; logo: string; banner?: string; isDemo?: boolean; matrixRoom?: string }> = {
    // OpenNexus-Yu 是真实组织,不在这里定义
    // "opennexus-yu" 将从 Org.tsx 的 orgsData 获取或从 GitHub API 获取
    
    // 🌟 精选知名开源组织
    kubernetes: { 
        name: "Kubernetes", 
        logo: "☸️", 
        banner: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1200&h=300&fit=crop", 
        isDemo: true,
        matrixRoom: "#kubernetes:matrix.org"
    },
    tensorflow: {
        name: "TensorFlow",
        logo: "🧠",
        banner: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=300&fit=crop",
        isDemo: true,
        matrixRoom: "#tensorflow:matrix.org"
    },
    react: {
        name: "React",
        logo: "⚛️",
        banner: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=300&fit=crop",
        isDemo: true,
        matrixRoom: "#react:matrix.org"
    },
    "rust-lang": {
        name: "Rust",
        logo: "🦀",
        banner: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&h=300&fit=crop",
        isDemo: true,
        matrixRoom: "#rust:matrix.org"
    },
};

// 🎉 精美的模拟数据 - 所有模拟组织共享统一数据
const generateDemoIncentiveData = (): { campaigns: CampaignList; userPoints: UserPoints; prizes: Prize[]; leaderboard: any[] } => {
    // 统一的通用模拟数据
    const demoData = {
        campaigns: {
                limited: [
                    {
                        id: 901,
                        org_id: 999,
                        name: "🎄 2025新年开发者大挑战",
                        description: "加入开源社区，赢取丰厚奖励！",
                        type: "limited" as const,
                        start_time: "2025-01-01T00:00:00Z",
                        end_time: "2025-01-31T23:59:59Z",
                        is_active: true,
                        banner_url: null,
                        chat_room_id: null,
                        activities: [
                            {
                                id: 9001,
                                name: "🎯 新手入门任务",
                                icon: "🎓",
                                description: "快速上手，赢取新手奖励",
                                order_index: 1,
                                tasks: [
                                    {
                                        id: 90001,
                                        title: "👋 注册并完善个人资料",
                                        description: "创建账户，上传头像，填写个人简介",
                                        points: 100,
                                        task_type: "manual",
                                        recurrence: "once",
                                        user_claimed: true,
                                        claimed_count: 8234
                                    },
                                    {
                                        id: 90002,
                                        title: "📚 完成新手教程",
                                        description: "学习官方新手教程，获得证书",
                                        points: 200,
                                        task_type: "content",
                                        recurrence: "once",
                                        user_claimed: false,
                                        claimed_count: 5432,
                                        stock_limit: 10000
                                    },
                                    {
                                        id: 90003,
                                        title: "🚀 完成第一个项目",
                                        description: "创建并部署你的第一个项目，上传截图",
                                        points: 300,
                                        task_type: "dev",
                                        recurrence: "once",
                                        user_claimed: false,
                                        claimed_count: 3210
                                    },
                                    {
                                        id: 90004,
                                        title: "👥 加入社区聊天室",
                                        description: "加入 Matrix 聊天室，与开发者交流",
                                        points: 150,
                                        task_type: "chat",
                                        recurrence: "once",
                                        user_claimed: false,
                                        chat_required: true,
                                        chat_room_id: "#community:matrix.org",
                                        claimed_count: 6789
                                    }
                                ]
                            },
                            {
                                id: 9002,
                                name: "💻 代码贡献任务",
                                icon: "🐛",
                                description: "为开源项目贡献代码，成为核心贡献者",
                                order_index: 2,
                                tasks: [
                                    {
                                        id: 90005,
                                        title: "🔍 修复 Good First Issue",
                                        description: "从 Good First Issue 列表中选一个问题修复",
                                        points: 500,
                                        task_type: "dev",
                                        recurrence: "once",
                                        user_claimed: false,
                                        claimed_count: 892
                                    },
                                    {
                                        id: 90006,
                                        title: "✅ 提交一个 PR",
                                        description: "提交一个 Pull Request 并被合并",
                                        points: 800,
                                        task_type: "dev",
                                        recurrence: "daily",
                                        user_claimed: false,
                                        claimed_count: 2341
                                    },
                                    {
                                        id: 90007,
                                        title: "🐞 报告一个 Bug",
                                        description: "发现并报告一个有效的 Bug，附带复现步骤",
                                        points: 300,
                                        task_type: "dev",
                                        recurrence: "weekly",
                                        user_claimed: true,
                                        claimed_count: 1567
                                    },
                                    {
                                        id: 90008,
                                        title: "📄 完善文档",
                                        description: "改进项目文档，修复错误或添加示例",
                                        points: 400,
                                        task_type: "content",
                                        recurrence: "weekly",
                                        user_claimed: false,
                                        claimed_count: 1123
                                    }
                                ]
                            },
                            {
                                id: 9003,
                                name: "🎤 社区互动任务",
                                icon: "🎉",
                                description: "在社区中活跃，帮助他人，分享经验",
                                order_index: 3,
                                tasks: [
                                    {
                                        id: 90009,
                                        title: "📝 写一篇技术博客",
                                        description: "分享开发经验或最佳实践，字数 > 1500",
                                        points: 600,
                                        task_type: "content",
                                        recurrence: "weekly",
                                        user_claimed: false,
                                        claimed_count: 445
                                    },
                                    {
                                        id: 90010,
                                        title: "🎥 录制视频教程",
                                        description: "录制技术教程视频，时长 > 15分钟",
                                        points: 1000,
                                        task_type: "content",
                                        recurrence: "once",
                                        user_claimed: false,
                                        claimed_count: 178
                                    },
                                    {
                                        id: 90011,
                                        title: "👍 在社区回答问题",
                                        description: "在 Stack Overflow 或 Reddit 上回答相关问题",
                                        points: 200,
                                        task_type: "social",
                                        recurrence: "daily",
                                        user_claimed: false,
                                        claimed_count: 3456
                                    },
                                    {
                                        id: 90012,
                                        title: "🐦 分享到 Twitter",
                                        description: "分享开源相关内容，带上标签",
                                        points: 150,
                                        task_type: "social",
                                        recurrence: "daily",
                                        user_claimed: true,
                                        claimed_count: 5234
                                    }
                                ]
                            }
                        ]
                    }
                ],
                permanent: [
                    {
                        id: 902,
                        org_id: 999,
                        name: "🏆 核心贡献者计划",
                        description: "长期贡献，持续成长，成为开源专家",
                        type: "permanent" as const,
                        start_time: null,
                        end_time: null,
                        is_active: true,
                        banner_url: null,
                        chat_room_id: null,
                        activities: [
                            {
                                id: 9004,
                                name: "🚀 高级开发任务",
                                icon: "🛠️",
                                description: "挑战更高难度的开发任务",
                                order_index: 1,
                                tasks: [
                                    {
                                        id: 90013,
                                        title: "⚡ 优化性能",
                                        description: "优化项目性能，提升 10% 以上",
                                        points: 2000,
                                        task_type: "dev",
                                        recurrence: "once",
                                        user_claimed: false,
                                        claimed_count: 45
                                    },
                                    {
                                        id: 90014,
                                        title: "🔐 安全漏洞修复",
                                        description: "发现并修复安全漏洞",
                                        points: 3000,
                                        task_type: "dev",
                                        recurrence: "once",
                                        user_claimed: false,
                                        claimed_count: 23
                                    },
                                    {
                                        id: 90015,
                                        title: "🌟 新功能开发",
                                        description: "开发一个新的功能或插件",
                                        points: 5000,
                                        task_type: "dev",
                                        recurrence: "once",
                                        user_claimed: false,
                                        claimed_count: 12
                                    }
                                ]
                            },
                            {
                                id: 9005,
                                name: "🎓 教育与培训",
                                icon: "📖",
                                description: "帮助更多人学习开源技术",
                                tasks: [
                                    {
                                        id: 90016,
                                        title: "🎤 举办线上讲座",
                                        description: "主办一场技术分享讲座",
                                        points: 1500,
                                        task_type: "content",
                                        recurrence: "once",
                                        user_claimed: false,
                                        claimed_count: 67
                                    },
                                    {
                                        id: 90017,
                                        title: "📑 编写教程系列",
                                        description: "创建完整的学习路径，至少 5 章节",
                                        points: 2500,
                                        task_type: "content",
                                        recurrence: "once",
                                        user_claimed: false,
                                        claimed_count: 34
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
        userPoints: {
                user_id: 1,
                org_id: 1,
                available_points: 4850,
                total_points: 7200,
                level: 8
            },
        prizes: [
                {
                    id: 9001,
                    name: "🎽 开源社区限量 T恤",
                    description: "官方设计的 2025 限量版 T恤，全球限量",
                    points_required: 800,
                    stock: 1000,
                    claimed_count: 456,
                    is_available: true
                },
                {
                    id: 9002,
                    name: "💻 苹果 AirPods Pro",
                    description: "适合编程用的顶级耳机，消噪功能一流",
                    points_required: 3500,
                    stock: 200,
                    claimed_count: 89,
                    is_available: true
                },
                {
                    id: 9003,
                    name: "🎓 技术认证考试券",
                    description: "免费的技术认证考试，提升职业竞争力",
                    points_required: 2000,
                    stock: 500,
                    claimed_count: 234,
                    is_available: true
                },
                {
                    id: 9004,
                    name: "✈️ 国际开源大会门票",
                    description: "2025 年国际开源大会门票 + 差旅补贴",
                    points_required: 8000,
                    stock: 50,
                    claimed_count: 12,
                    is_available: true
                },
                {
                    id: 9005,
                    name: "🔧 JetBrains 全家桶",
                    description: "JetBrains 所有 IDE 一年使用权",
                    points_required: 1500,
                    stock: 300,
                    claimed_count: 167,
                    is_available: true
                },
                {
                    id: 9006,
                    name: "📚 O'Reilly 会员",
                    description: "O'Reilly 在线学习平台一年会员",
                    points_required: 1000,
                    stock: 500,
                    claimed_count: 345,
                    is_available: true
                }
            ],
        leaderboard: [
                { rank: 1, username: "opensource-hero", avatar: "🥷", points: 25680, level: 15, contributions: 342 },
                { rank: 2, username: "code-master", avatar: "☁️", points: 23450, level: 14, contributions: 298 },
                { rank: 3, username: "dev-guru", avatar: "🚀", points: 21230, level: 13, contributions: 276 },
                { rank: 4, username: "tech-wizard", avatar: "🧙", points: 19870, level: 13, contributions: 254 },
                { rank: 5, username: "community-star", avatar: "⚓", points: 18540, level: 12, contributions: 231 },
                { rank: 6, username: "contributor-pro", avatar: "👑", points: 17320, level: 12, contributions: 218 },
                { rank: 7, username: "open-source-fan", avatar: "🎨", points: 16100, level: 11, contributions: 203 },
                { rank: 8, username: "You", avatar: "👤", points: 7200, level: 8, contributions: 89, isCurrentUser: true },
                { rank: 9, username: "code-ninja", avatar: "🥷", points: 14650, level: 11, contributions: 187 },
                { rank: 10, username: "tech-newbie", avatar: "👶", points: 13420, level: 10, contributions: 172 }
            ]
    };

    // 所有模拟组织返回相同数据
    return demoData as any;
};

// Task type icons
const getTaskIcon = (taskType: string) => {
    switch (taskType) {
        case 'dev': return Code2;
        case 'social': return Twitter;
        case 'content': return FileText;
        case 'chat': return MessageSquare;
        default: return Target;
    }
};

// Task type colors
const taskTypeColors: Record<string, { bg: string; text: string; border: string }> = {
    dev: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    social: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
    content: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
    manual: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
    chat: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
};

// Modal Component
// Components
const TaskCard = ({ task, onClaim, onOpenChat }: { task: Task; onClaim: (taskId: number) => void; onOpenChat?: (chatRoomId: string) => void }) => {
    const { t } = useTranslation();
    const colors = taskTypeColors[task.task_type] || taskTypeColors.manual;
    const Icon = getTaskIcon(task.task_type);

    const recurrenceLabels: Record<string, string> = {
        daily: '🔄 每日',
        weekly: '📅 每周',
        once: '',
    };

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className={cn(
                "card p-4 cursor-pointer group relative overflow-hidden transition-all",
                task.user_claimed && "opacity-60"
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", colors.bg, colors.text)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
                        {task.recurrence !== 'once' && (
                            <span className="text-xs text-gray-400">{recurrenceLabels[task.recurrence]}</span>
                        )}
                        {task.chat_required && (
                            <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                <MessageSquare className="w-3 h-3" />
                                {t('incentive.chatRequired')}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                    {task.stock_limit && (
                        <div className="text-xs text-gray-400 mt-1">
                            {t('incentive.limitedStock')}: {task.claimed_count}/{task.stock_limit}
                        </div>
                    )}
                    {task.chat_room_id && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenChat?.(task.chat_room_id!);
                            }}
                            className="mt-2 text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium"
                        >
                            <MessageSquare className="w-3 h-3" />
                            {t('incentive.goToChat')}
                        </button>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-primary/10 to-primary-dark/10 px-2 py-1 rounded-full">
                        <Zap className="w-3 h-3 text-primary" />
                        <span className="text-sm font-bold text-primary">{task.points}</span>
                    </div>
                    {task.user_claimed ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {t('incentive.completed')}
                        </span>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClaim(task.id);
                            }}
                            className="text-xs bg-primary text-white px-3 py-1 rounded-full hover:bg-primary-dark transition-colors"
                        >
                            {t('incentive.claim')}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const ActivitySection = ({ activity, onClaimTask, onOpenChat }: { activity: Activity; onClaimTask: (taskId: number) => void; onOpenChat?: (chatRoomId: string) => void }) => {
    const { t } = useTranslation();
    return (
    <div className="mb-6 p-2 rounded-xl">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <span className="text-xl">{activity.icon}</span>
                <h3 className="font-bold text-gray-900">{activity.name}</h3>
                <span className="text-xs text-gray-400">({activity.tasks.length} {t('incentive.tasks')})</span>
            </div>
        </div>
        <div className="space-y-3">
            {activity.tasks.map((task) => (
                <TaskCard key={task.id} task={task} onClaim={onClaimTask} onOpenChat={onOpenChat} />
            ))}
        </div>
    </div>
);
};

const CampaignCard = ({ campaign, isActive, onClick }: { campaign: Campaign; isActive: boolean; onClick: () => void }) => {
    const { t } = useTranslation();
    return (
    <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        className={cn(
            "card p-4 cursor-pointer transition-all",
            isActive && "ring-2 ring-primary"
        )}
    >
        <div className="flex items-center gap-3">
            {campaign.type === 'limited' ? (
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-red-600" />
                </div>
            ) : (
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-green-600" />
                </div>
            )}
            <div className="flex-1">
                <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                <p className="text-xs text-gray-500">
                    {campaign.activities.length} {t('incentive.activities')} · {campaign.activities.reduce((sum, a) => sum + a.tasks.length, 0)} {t('incentive.tasks')}
                </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        {campaign.type === 'limited' && campaign.end_time && (
            <div className="mt-2 text-xs text-red-500">
                ⏰ {t('incentive.deadline')}: {new Date(campaign.end_time).toLocaleDateString('zh-CN')}
            </div>
        )}
    </motion.div>
);
};

const PrizeCard = ({ prize, userPoints, onRedeem }: { prize: Prize; userPoints: number; onRedeem: (prizeId: number) => void }) => {
    const { t } = useTranslation();
    const canAfford = userPoints >= prize.points_required;
    const inStock = prize.is_available;

    return (
        <div className="card p-4 relative group">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center text-2xl">
                    {prize.name.charAt(0)}
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{prize.name}</h4>
                    <p className="text-sm text-gray-500">{prize.description}</p>
                    {prize.stock && (
                        <p className="text-xs text-gray-400">{t('incentive.stock')}: {prize.stock - prize.claimed_count}/{prize.stock}</p>
                    )}
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 text-primary font-bold mb-1">
                        <Zap className="w-4 h-4" />
                        {prize.points_required}
                    </div>
                    <button
                        onClick={() => onRedeem(prize.id)}
                        disabled={!canAfford || !inStock}
                        className={cn(
                            "text-xs px-3 py-1.5 rounded-full transition-colors",
                            canAfford && inStock
                                ? "bg-primary text-white hover:bg-primary-dark"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        {!inStock ? t('incentive.soldOut') : !canAfford ? t('incentive.insufficientPoints') : t('incentive.redeem')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Incentive() {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { githubToken, user } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'quests' | 'prizes' | 'leaderboard'>('quests');
    const [org, setOrg] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<CampaignList>({ permanent: [], limited: [] });
    const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
    const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [, setClaiming] = useState<number | null>(null);

    // Use org_id = 1 for demo (or parse from URL)
    const numericOrgId = 1; // Demo org ID
    const userId = user?.id || 1; // Demo user ID

    // Assuming user with ID 1 is admin for demo
    const isAdmin = true; // In real app: user.id === org.owner_id

    useEffect(() => {
        fetchData();
    }, [orgId, githubToken]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 首先尝试从 Org.tsx 的 orgsData 获取真实组织数据
            if (orgId?.toLowerCase() === 'opennexus-yu') {
                // OpenNexus-Yu 是真实组织 - 使用后端数据
                setOrg({
                    name: "OpenNexus-Yu",
                    logo: "🚀",
                    banner: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=300&fit=crop",
                    isDemo: false,  // 标记为非模拟数据
                    matrixRoom: "#OpenNexus-Yu:localhost"
                });

                // 从后端获取真实数据
                const campaignsRes = await fetch(`${BACKEND_URL}/api/incentive/${numericOrgId}/campaigns?user_id=${userId}`);
                if (campaignsRes.ok) {
                    const campaignsData: CampaignList = await campaignsRes.json();
                    setCampaigns(campaignsData);
                    if (!activeCampaign) {
                        if (campaignsData.limited.length > 0) setActiveCampaign(campaignsData.limited[0]);
                        else if (campaignsData.permanent.length > 0) setActiveCampaign(campaignsData.permanent[0]);
                    }
                }

                const pointsRes = await fetch(`${BACKEND_URL}/api/incentive/${numericOrgId}/points?user_id=${userId}`);
                if (pointsRes.ok) {
                    setUserPoints(await pointsRes.json());
                }

                const prizesRes = await fetch(`${BACKEND_URL}/api/incentive/${numericOrgId}/prizes`);
                if (prizesRes.ok) {
                    setPrizes(await prizesRes.json());
                }
            } else {
                // 模拟组织 - 使用精美的模拟数据
                const demoOrg = orgsData[(orgId || '').toLowerCase()];
                if (demoOrg) {
                    setOrg(demoOrg);
                    
                    // 🎉 使用精美的模拟数据
                    const demoData = generateDemoIncentiveData();
                    setCampaigns(demoData.campaigns);
                    setUserPoints(demoData.userPoints);
                    setPrizes(demoData.prizes);
                    setLeaderboard(demoData.leaderboard || []);
                    
                    // 设置默认活动计划
                    if (!activeCampaign) {
                        if (demoData.campaigns.limited.length > 0) setActiveCampaign(demoData.campaigns.limited[0]);
                        else if (demoData.campaigns.permanent.length > 0) setActiveCampaign(demoData.campaigns.permanent[0]);
                    }
                } else if (orgId && githubToken) {
                    // GitHub 组织
                    const orgRes = await fetch(`https://api.github.com/orgs/${orgId}`, {
                        headers: { Authorization: `Bearer ${githubToken}` },
                    });
                    if (orgRes.ok) {
                        const orgData = await orgRes.json();
                        setOrg({
                            name: orgData.name || orgData.login,
                            logo: orgData.avatar_url,
                            banner: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=300&fit=crop",
                            isDemo: false,
                        });
                    }
                } else {
                    setOrg({ name: t('incentive.title'), logo: "⚡", isDemo: true });
                }
            }
        } catch (err) {
            console.error('Failed to fetch incentive data:', err);
            setOrg({ name: t('incentive.title'), logo: "⚡", isDemo: true });
        } finally {
            setLoading(false);
        }
    };

    const handleClaimTask = async (taskId: number) => {
        // 模拟组织直接本地处理
        if (org?.isDemo) {
            setClaiming(taskId);
            // 模拟领取成功
            setTimeout(() => {
                alert('🎉 ' + t('common.success') + '! (Demo)');
                // 更新本地状态
                const updatedCampaigns = {
                    ...campaigns,
                    limited: campaigns.limited.map(c => ({
                        ...c,
                        activities: c.activities.map((a: Activity) => ({
                            ...a,
                            tasks: a.tasks.map((t: Task) => 
                                t.id === taskId ? { ...t, user_claimed: true } : t
                            )
                        }))
                    })),
                    permanent: campaigns.permanent.map(c => ({
                        ...c,
                        activities: c.activities.map((a: Activity) => ({
                            ...a,
                            tasks: a.tasks.map((t: Task) => 
                                t.id === taskId ? { ...t, user_claimed: true } : t
                            )
                        }))
                    }))
                };
                setCampaigns(updatedCampaigns);
                // 更新 activeCampaign
                if (activeCampaign) {
                    const updated = [...updatedCampaigns.limited, ...updatedCampaigns.permanent]
                        .find(c => c.id === activeCampaign.id);
                    if (updated) setActiveCampaign(updated);
                }
                setClaiming(null);
            }, 500);
            return;
        }

        // 真实组织调用后端API
        setClaiming(taskId);
        try {
            const res = await fetch(`${BACKEND_URL}/api/incentive/task/${taskId}/claim?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                await fetchData();
            } else {
                const error = await res.json();
                alert(error.detail || t('common.error'));
            }
        } catch (err) {
            console.error('Failed to claim task:', err);
        } finally {
            setClaiming(null);
        }
    };

    const handleRedeemPrize = async (prizeId: number) => {
        // 模拟组织直接本地处理
        if (org?.isDemo) {
            alert('🎁 ' + t('common.success') + '! (Demo)');
            return;
        }

        // 真实组织调用后端API
        try {
            const res = await fetch(`${BACKEND_URL}/api/incentive/prize/${prizeId}/redeem?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                alert(t('common.success') + '!');
                await fetchData();
            } else {
                const error = await res.json();
                alert(error.detail || t('common.error'));
            }
        } catch (err) {
            console.error('Failed to redeem prize:', err);
        }
    };

    // 聊天室跳转 - 修复为lobby格式
    const handleOpenChat = (chatRoomId: string) => {
        console.log('[Incentive] Opening chat room lobby:', chatRoomId);
        
        if (!chatRoomId) {
            console.error('[Incentive] No chat room ID provided');
            alert(t('incentive.chatRequired'));
            return;
        }
        
        // Cinny Space lobby的正确格式: /#/ROOM_ALIAS/lobby
        const encodedRoomId = encodeURIComponent(chatRoomId);
        const cinnyUrl = `http://localhost:3001/#/${encodedRoomId}/lobby`;
        console.log('[Incentive] Opening Cinny lobby URL:', cinnyUrl);
        window.open(cinnyUrl, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    // All campaigns for potential future use
    // const allCampaigns = [...campaigns.limited, ...campaigns.permanent];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Banner */}
            <div className="relative h-32 bg-gradient-to-r from-primary to-primary-dark">
                {org?.banner && (
                    <img src={org.banner} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary-dark/90" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {orgId && (
                            <Link to={`/org/${orgId}`} className="text-white/80 hover:text-white">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        )}
                        {org?.logo?.startsWith('http') ? (
                            <img src={org.logo} alt={org?.name} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">
                                {org?.logo || '🏢'}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-white">{org?.name} {t('incentive.title')}</h1>
                            <p className="text-white/70 text-sm">{t('incentive.description')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* 聊天室快速入口 - 使用组织的matrixRoom */}
                        {org?.matrixRoom && (
                            <button
                                onClick={() => handleOpenChat(org.matrixRoom)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all"
                            >
                                <MessageSquare className="w-4 h-4" />
                                {t('incentive.joinChatRoom')}
                            </button>
                        )}
                        
                        {/* Admin Backend - 跳转到独立管理后台 */}
                        {isAdmin && (
                            <button
                                onClick={() => navigate(`/admin/${orgId}`)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                {t('common.admin')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* User Stats Bar */}
                <div className="card p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold">
                                {userPoints?.level || 1}
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">{t('incentive.level')}</div>
                                <div className="font-bold text-gray-900">Lv.{userPoints?.level || 1}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-primary-dark/10 rounded-xl">
                            <Zap className="w-5 h-5 text-primary" />
                            <div>
                                <div className="font-bold text-primary">{userPoints?.available_points || 0}</div>
                                <div className="text-xs text-gray-500">{t('incentive.availablePoints')}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <div>
                                <div className="font-bold text-gray-700">{userPoints?.total_points || 0}</div>
                                <div className="text-xs text-gray-500">{t('incentive.totalPoints')}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('quests')}
                        className={cn(
                            "px-6 py-2 rounded-full font-medium transition-all",
                            activeTab === 'quests'
                                ? "bg-primary text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <Target className="w-4 h-4 inline mr-2" />
                        {t('incentive.tasks')}
                    </button>
                    <button
                        onClick={() => setActiveTab('prizes')}
                        className={cn(
                            "px-6 py-2 rounded-full font-medium transition-all",
                            activeTab === 'prizes'
                                ? "bg-primary text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <Gift className="w-4 h-4 inline mr-2" />
                        {t('incentive.prizes')}
                    </button>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={cn(
                            "px-6 py-2 rounded-full font-medium transition-all",
                            activeTab === 'leaderboard'
                                ? "bg-primary text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <Trophy className="w-4 h-4 inline mr-2" />
                        {t('incentive.leaderboard')}
                    </button>
                </div>

                {activeTab === 'quests' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Campaign List Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-gray-900">{t('incentive.campaigns')}</h3>
                            </div>

                            {campaigns.limited.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-xs text-red-500 font-medium mb-2 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {t('incentive.limitedCampaigns')}
                                    </h4>
                                    <div className="space-y-2">
                                        {campaigns.limited.map((campaign) => (
                                            <CampaignCard
                                                key={campaign.id}
                                                campaign={campaign}
                                                isActive={activeCampaign?.id === campaign.id}
                                                onClick={() => setActiveCampaign(campaign)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {campaigns.permanent.length > 0 && (
                                <div>
                                    <h4 className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
                                        <Star className="w-3 h-3" /> {t('incentive.permanentCampaigns')}
                                    </h4>
                                    <div className="space-y-2">
                                        {campaigns.permanent.map((campaign) => (
                                            <CampaignCard
                                                key={campaign.id}
                                                campaign={campaign}
                                                isActive={activeCampaign?.id === campaign.id}
                                                onClick={() => setActiveCampaign(campaign)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Task Content */}
                        <div className="lg:col-span-3">
                            {activeCampaign ? (
                                <>
                                    <div className="flex items-center justify-between mb-4 border-b pb-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{activeCampaign.name}</h2>
                                            {activeCampaign.description && (
                                                <p className="text-sm text-gray-500">{activeCampaign.description}</p>
                                            )}
                                        </div>
                                        {activeCampaign.type === 'limited' && activeCampaign.end_time && (
                                            <div className="text-sm text-red-500 flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {t('incentive.deadline')}: {new Date(activeCampaign.end_time).toLocaleDateString('zh-CN')}
                                            </div>
                                        )}
                                    </div>

                                    {activeCampaign.activities.map((activity) => (
                                        <ActivitySection
                                            key={activity.id}
                                            activity={activity}
                                            onClaimTask={handleClaimTask}
                                            onOpenChat={handleOpenChat}
                                        />
                                    ))}
                                    {activeCampaign.activities.length === 0 && (
                                        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                            {t('incentive.noActivities')}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center text-gray-400 py-12">
                                    {t('incentive.selectCampaign')}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'prizes' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">🎁 {t('incentive.prizeStore')}</h2>
                                <p className="text-gray-500">{t('incentive.prizeStoreDescription')}</p>
                            </div>
                        </div>

                        {prizes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {prizes.map((prize) => (
                                    <PrizeCard
                                        key={prize.id}
                                        prize={prize}
                                        userPoints={userPoints?.available_points || 0}
                                        onRedeem={handleRedeemPrize}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 py-12">
                                {t('incentive.noPrizes')}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">🏆 {t('incentive.contributorLeaderboard')}</h2>
                                <p className="text-gray-500">{t('incentive.leaderboardDescription')}</p>
                            </div>
                        </div>

                        {leaderboard.length > 0 ? (
                            <div className="space-y-2">
                                {leaderboard.map((user) => (
                                    <motion.div
                                        key={user.rank}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: user.rank * 0.05 }}
                                        className={cn(
                                            "card p-4 transition-all hover:shadow-md",
                                            user.isCurrentUser && "ring-2 ring-primary bg-primary/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* 排名 */}
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                                                user.rank === 1 && "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white",
                                                user.rank === 2 && "bg-gradient-to-br from-gray-300 to-gray-500 text-white",
                                                user.rank === 3 && "bg-gradient-to-br from-orange-400 to-orange-600 text-white",
                                                user.rank > 3 && "bg-gray-100 text-gray-600"
                                            )}>
                                                {user.rank <= 3 ? (
                                                    user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : "🥉"
                                                ) : (
                                                    `#${user.rank}`
                                                )}
                                            </div>

                                            {/* 用户信息 */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-2xl">{user.avatar}</span>
                                                    <span className={cn(
                                                        "font-bold text-gray-900",
                                                        user.isCurrentUser && "text-primary"
                                                    )}>
                                                        {user.username}
                                                    </span>
                                                    {user.isCurrentUser && (
                                                        <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                                                            {t('incentive.you')}
                                                        </span>
                                                    )}
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                        Lv.{user.level}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Zap className="w-4 h-4 text-yellow-500" />
                                                        {user.points.toLocaleString()} {t('incentive.points')}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Target className="w-4 h-4 text-blue-500" />
                                                        {user.contributions} {t('incentive.contributions')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 py-12">
                                {t('incentive.noLeaderboard')}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
