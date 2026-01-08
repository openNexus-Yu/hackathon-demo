import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    LayoutDashboard, Target, Users, Gift,
    Plus, Edit2, Trash2, Search, Filter, ArrowLeft,
    Loader2, Clock, Zap, Trophy, TrendingUp, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import CampaignModal from '../components/admin/CampaignModal';
import PrizeModal from '../components/admin/PrizeModal';
import PrizeKeyModal from '../components/admin/PrizeKeyModal';
import ActivityModal from '../components/admin/ActivityModal';
import TaskModal from '../components/admin/TaskModal';

const BACKEND_URL = 'http://localhost:3000';

// Types
interface Campaign {
    id?: number;
    org_id?: number;
    name: string;
    description: string | null;
    type: 'permanent' | 'limited';
    start_time: string | null;
    end_time: string | null;
    is_active?: boolean;
    activities_count?: number;
    tasks_count?: number;
    chat_room_id?: string | null;
}

interface Prize {
    id: number;
    org_id: number;
    name: string;
    description: string | null;
    image_url: string | null;
    type: string;
    points_required: number;
    stock: number | null;
    claimed_count: number;
    is_available: boolean;
    use_key_pool?: boolean;  // 是否使用密钥库
    available_keys?: number;  // 可用密钥数
    delivery_type?: string;  // 配送方式
}

interface Activity {
    id: number;
    campaign_id: number;
    name: string;
    description: string | null;
    icon: string | null;
    order_index: number;
    campaign_name?: string;
}

interface Task {
    id: number;
    activity_id: number;
    title: string;
    description: string | null;
    points: number;
    task_type: string;
    recurrence: string;
    stock_limit: number | null;
    order_index: number;
    claimed_count: number;
    is_active: boolean;
    chat_room_id: string | null;
    chat_required: boolean;
    activity_name?: string;
    campaign_name?: string;
}

interface Stats {
    total_campaigns: number;
    total_activities: number;
    total_tasks: number;
    total_prizes: number;
    total_users: number;
    total_points_distributed: number;
}

export default function Admin() {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'activities' | 'tasks' | 'prizes'>('dashboard');
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showPrizeModal, setShowPrizeModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editingPrize, setEditingPrize] = useState<Prize | null>(null);

    const numericOrgId = 1; // Demo

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'dashboard') {
                // Fetch campaigns first to calculate stats
                const res = await fetch(`${BACKEND_URL}/api/incentive/${numericOrgId}/campaigns?user_id=1`);
                if (res.ok) {
                    const data = await res.json();
                    const allCampaigns = [...data.limited, ...data.permanent];
                    
                    // Calculate stats from campaigns
                    const totalActivities = allCampaigns.reduce((sum, c) => sum + (c.activities?.length || 0), 0);
                    const totalTasks = allCampaigns.reduce((sum, c) => 
                        sum + (c.activities?.reduce((s: number, a: any) => s + (a.tasks?.length || 0), 0) || 0), 0
                    );
                    
                    // Fetch prizes for stats
                    const prizesRes = await fetch(`${BACKEND_URL}/api/incentive/${numericOrgId}/prizes`);
                    let totalPrizes = 0;
                    if (prizesRes.ok) {
                        const prizesData = await prizesRes.json();
                        totalPrizes = prizesData.length;
                    }
                    
                    setStats({
                        total_campaigns: allCampaigns.length,
                        total_activities: totalActivities,
                        total_tasks: totalTasks,
                        total_prizes: totalPrizes,
                        total_users: 0,
                        total_points_distributed: 0
                    });
                }
            } else if (activeTab === 'campaigns') {
                // Fetch campaigns
                const res = await fetch(`${BACKEND_URL}/api/incentive/${numericOrgId}/campaigns?user_id=1`);
                if (res.ok) {
                    const data = await res.json();
                    setCampaigns([...data.limited, ...data.permanent]);
                }
            } else if (activeTab === 'activities') {
                // Fetch activities
                const res = await fetch(`${BACKEND_URL}/api/incentive/${numericOrgId}/activities`);
                if (res.ok) {
                    const data = await res.json();
                    setActivities(data);
                }
                // Also fetch campaigns for dropdown
                const campaignsRes = await fetch(`${BACKEND_URL}/api/incentive/${numericOrgId}/campaigns?user_id=1`);
                if (campaignsRes.ok) {
                    const campaignsData = await campaignsRes.json();
                    setCampaigns([...campaignsData.limited, ...campaignsData.permanent]);
                }
            } else if (activeTab === 'tasks') {
                // Fetch tasks
                const res = await fetch(`${BACKEND_URL}/api/incentive/${numericOrgId}/tasks`);
                if (res.ok) {
                    const data = await res.json();
                    setTasks(data);
                }
                // Also fetch activities for dropdown
                const activitiesRes = await fetch(`${BACKEND_URL}/api/incentive/${numericOrgId}/activities`);
                if (activitiesRes.ok) {
                    const activitiesData = await activitiesRes.json();
                    setActivities(activitiesData);
                }
            } else if (activeTab === 'prizes') {
                // Fetch prizes
                const res = await fetch(`${BACKEND_URL}/api/incentive/${numericOrgId}/prizes`);
                if (res.ok) {
                    const data = await res.json();
                    console.log('📦 Fetched prizes:', data);
                    setPrizes(data);
                }
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCampaign = async (id: number) => {
        if (!confirm(t('common.confirmDelete') || '确定要删除吗?')) return;
        
        try {
            const res = await fetch(`${BACKEND_URL}/api/incentive/campaign/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                await fetchData();
                alert(t('common.deleteSuccess') || '删除成功');
            }
        } catch (err) {
            console.error('Failed to delete:', err);
            alert(t('common.deleteFailed') || '删除失败');
        }
    };

    const handleDeletePrize = async (id: number) => {
        if (!confirm(t('common.confirmDelete') || '确定要删除吗?')) return;
        
        try {
            const res = await fetch(`${BACKEND_URL}/api/incentive/prize/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                await fetchData();
                alert(t('common.deleteSuccess') || '删除成功');
            }
        } catch (err) {
            console.error('Failed to delete:', err);
            alert(t('common.deleteFailed') || '删除失败');
        }
    };

    const handleSaveCampaign = async (campaign: any) => {
        try {
            if (campaign.id) {
                // Update existing campaign
                const res = await fetch(`${BACKEND_URL}/api/incentive/campaign/${campaign.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(campaign),
                });
                if (res.ok) {
                    await fetchData();
                    alert('更新成功');
                }
            } else {
                // Create new campaign
                const res = await fetch(`${BACKEND_URL}/api/incentive/${numericOrgId}/campaigns`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(campaign),
                });
                if (res.ok) {
                    await fetchData();
                    alert('创建成功');
                }
            }
            setEditingCampaign(null);
        } catch (err) {
            console.error('Failed to save campaign:', err);
            alert('保存失败');
            throw err;
        }
    };

    const handleSavePrize = async (prize: any) => {
        try {
            if (prize.id) {
                // Update existing prize
                console.log('🔧 Updating prize:', prize);
                const res = await fetch(`${BACKEND_URL}/api/incentive/prize/${prize.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(prize),
                });
                if (res.ok) {
                    const updated = await res.json();
                    console.log('✅ Updated prize response:', updated);
                    await fetchData();
                    alert('更新成功');
                }
            } else {
                // Create new prize
                const res = await fetch(`${BACKEND_URL}/api/incentive/${numericOrgId}/prizes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(prize),
                });
                if (res.ok) {
                    const newPrize = await res.json();
                    console.log('Created prize:', newPrize);
                    await fetchData();
                    alert('创建成功');
                }
            }
            setEditingPrize(null);
        } catch (err) {
            console.error('Failed to save prize:', err);
            alert('保存失败');
            throw err;
        }
    };

    const handleEditCampaign = (campaign: Campaign) => {
        // Convert null to empty string for form
        setEditingCampaign({
            ...campaign,
            chat_room_id: campaign.chat_room_id || ''
        } as any);
        setShowCampaignModal(true);
    };

    const handleEditPrize = (prize: Prize) => {
        // Convert null to empty string for form
        setEditingPrize({
            ...prize,
            description: prize.description || '',
            image_url: prize.image_url || ''
        } as any);
        setShowPrizeModal(true);
    };

    const handleDeleteActivity = async (id: number) => {
        if (!confirm(t('common.confirmDelete') || '确定要删除吗?')) return;
        
        try {
            const res = await fetch(`${BACKEND_URL}/api/incentive/activity/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                await fetchData();
                alert(t('common.deleteSuccess') || '删除成功');
            }
        } catch (err) {
            console.error('Failed to delete:', err);
            alert(t('common.deleteFailed') || '删除失败');
        }
    };

    const handleSaveActivity = async (activity: any) => {
        try {
            if (activity.id) {
                // Update existing activity
                const res = await fetch(`${BACKEND_URL}/api/incentive/activity/${activity.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(activity),
                });
                if (res.ok) {
                    await fetchData();
                    alert('更新成功');
                }
            } else {
                // Create new activity
                const res = await fetch(`${BACKEND_URL}/api/incentive/campaign/${activity.campaign_id}/activities`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(activity),
                });
                if (res.ok) {
                    await fetchData();
                    alert('创建成功');
                }
            }
            setEditingActivity(null);
        } catch (err) {
            console.error('Failed to save activity:', err);
            alert('保存失败');
            throw err;
        }
    };

    const handleEditActivity = (activity: Activity) => {
        setEditingActivity({
            ...activity,
            description: activity.description || ''
        } as any);
        setShowActivityModal(true);
    };

    const handleDeleteTask = async (id: number) => {
        if (!confirm(t('common.confirmDelete') || '确定要删除吗?')) return;
        
        try {
            const res = await fetch(`${BACKEND_URL}/api/incentive/task/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                await fetchData();
                alert(t('common.deleteSuccess') || '删除成功');
            }
        } catch (err) {
            console.error('Failed to delete:', err);
            alert(t('common.deleteFailed') || '删除失败');
        }
    };

    const handleSaveTask = async (task: any) => {
        try {
            if (task.id) {
                // Update existing task
                const res = await fetch(`${BACKEND_URL}/api/incentive/task/${task.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task),
                });
                if (res.ok) {
                    await fetchData();
                    alert('更新成功');
                }
            } else {
                // Create new task
                const res = await fetch(`${BACKEND_URL}/api/incentive/activity/${task.activity_id}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task),
                });
                if (res.ok) {
                    await fetchData();
                    alert('创建成功');
                }
            }
            setEditingTask(null);
        } catch (err) {
            console.error('Failed to save task:', err);
            alert('保存失败');
            throw err;
        }
    };

    const handleEditTask = (task: Task) => {
        setEditingTask({
            ...task,
            description: task.description || '',
            chat_room_id: task.chat_room_id || ''
        } as any);
        setShowTaskModal(true);
    };

    const handleCreateNew = () => {
        if (activeTab === 'campaigns') {
            setEditingCampaign(null);
            setShowCampaignModal(true);
        } else if (activeTab === 'activities') {
            setEditingActivity(null);
            setShowActivityModal(true);
        } else if (activeTab === 'tasks') {
            setEditingTask(null);
            setShowTaskModal(true);
        } else if (activeTab === 'prizes') {
            setEditingPrize(null);
            setShowPrizeModal(true);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-border sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link 
                                to={`/incentive/${orgId}`}
                                className="text-gray-500 hover:text-primary"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">管理后台</h1>
                                <p className="text-sm text-gray-500">{orgId ? `${orgId} 组织` : '激励系统管理'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {(activeTab === 'campaigns' || activeTab === 'activities' || activeTab === 'tasks' || activeTab === 'prizes') && (
                                <button 
                                    onClick={handleCreateNew}
                                    className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    {activeTab === 'campaigns' && '新建活动'}
                                    {activeTab === 'activities' && '新建主题'}
                                    {activeTab === 'tasks' && '新建任务'}
                                    {activeTab === 'prizes' && '新增奖品'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    <TabButton
                        active={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                        icon={LayoutDashboard}
                    >
                        仪表板
                    </TabButton>
                    <TabButton
                        active={activeTab === 'campaigns'}
                        onClick={() => setActiveTab('campaigns')}
                        icon={Target}
                    >
                        活动管理
                    </TabButton>
                    <TabButton
                        active={activeTab === 'activities'}
                        onClick={() => setActiveTab('activities')}
                        icon={Activity}
                    >
                        主题管理
                    </TabButton>
                    <TabButton
                        active={activeTab === 'tasks'}
                        onClick={() => setActiveTab('tasks')}
                        icon={Trophy}
                    >
                        任务管理
                    </TabButton>
                    <TabButton
                        active={activeTab === 'prizes'}
                        onClick={() => setActiveTab('prizes')}
                        icon={Gift}
                    >
                        奖品管理
                    </TabButton>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {activeTab === 'dashboard' && <DashboardView stats={stats} />}
                        {activeTab === 'campaigns' && (
                            <CampaignsView 
                                campaigns={campaigns} 
                                onDelete={handleDeleteCampaign}
                                onEdit={handleEditCampaign}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                            />
                        )}
                        {activeTab === 'activities' && (
                            <ActivitiesView 
                                activities={activities}
                                onDelete={handleDeleteActivity}
                                onEdit={handleEditActivity}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                            />
                        )}
                        {activeTab === 'tasks' && (
                            <TasksView 
                                tasks={tasks}
                                onDelete={handleDeleteTask}
                                onEdit={handleEditTask}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                            />
                        )}
                        {activeTab === 'prizes' && (
                            <PrizesView 
                                prizes={prizes}
                                onDelete={handleDeletePrize}
                                onEdit={handleEditPrize}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <CampaignModal
                isOpen={showCampaignModal}
                onClose={() => {
                    setShowCampaignModal(false);
                    setEditingCampaign(null);
                }}
                onSave={handleSaveCampaign}
                campaign={editingCampaign}
            />
            
            <ActivityModal
                isOpen={showActivityModal}
                onClose={() => {
                    setShowActivityModal(false);
                    setEditingActivity(null);
                }}
                onSave={handleSaveActivity}
                activity={editingActivity}
                campaigns={campaigns.filter(c => c.id !== undefined) as Array<{ id: number; name: string }>}
            />
            
            <TaskModal
                isOpen={showTaskModal}
                onClose={() => {
                    setShowTaskModal(false);
                    setEditingTask(null);
                }}
                onSave={handleSaveTask}
                task={editingTask}
                activities={activities}
            />
            
            <PrizeModal
                isOpen={showPrizeModal}
                onClose={() => {
                    setShowPrizeModal(false);
                    setEditingPrize(null);
                }}
                onSave={handleSavePrize}
                prize={editingPrize}
            />
        </div>
    );
}

// Tab Button Component
function TabButton({ active, onClick, icon: Icon, children }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap",
                active 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-white text-gray-600 hover:bg-gray-50"
            )}
        >
            <Icon className="w-4 h-4" />
            {children}
        </button>
    );
}

// Dashboard View
function DashboardView({ stats }: { stats: Stats | null }) {
    if (!stats) return <div>No data</div>;

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="总活动数"
                    value={stats.total_campaigns}
                    icon={Target}
                    color="blue"
                />
                <StatCard
                    title="总任务数"
                    value={stats.total_tasks}
                    icon={Trophy}
                    color="green"
                />
                <StatCard
                    title="总奖品数"
                    value={stats.total_prizes}
                    icon={Gift}
                    color="purple"
                />
                <StatCard
                    title="参与用户"
                    value={stats.total_users}
                    icon={Users}
                    color="orange"
                />
                <StatCard
                    title="分发积分"
                    value={stats.total_points_distributed}
                    icon={Zap}
                    color="yellow"
                />
                <StatCard
                    title="增长趋势"
                    value="+12%"
                    icon={TrendingUp}
                    color="cyan"
                />
            </div>

            {/* Recent Activity */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">最近活动</h3>
                <div className="text-center py-8 text-gray-400">
                    暂无最近活动记录
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }: any) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        cyan: 'bg-cyan-50 text-cyan-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
        >
            <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2 rounded-lg", colorClasses[color])}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{title}</div>
        </motion.div>
    );
}

// Campaigns View
function CampaignsView({ campaigns, onDelete, onEdit, searchQuery, onSearchChange }: any) {
    const filteredCampaigns = campaigns.filter((c: Campaign) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="card p-4 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="搜索活动..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="flex-1 outline-none text-gray-900"
                />
                <button className="p-2 hover:bg-gray-50 rounded-lg">
                    <Filter className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Campaigns List */}
            <div className="space-y-3">
                {filteredCampaigns.length === 0 ? (
                    <div className="card p-12 text-center text-gray-400">
                        {searchQuery ? '未找到匹配的活动' : '暂无活动'}
                    </div>
                ) : (
                    filteredCampaigns.map((campaign: Campaign) => (
                        <motion.div
                            key={campaign.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="card p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-gray-900">{campaign.name}</h3>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full font-medium",
                                            campaign.type === 'limited' 
                                                ? "bg-red-100 text-red-600" 
                                                : "bg-green-100 text-green-600"
                                        )}>
                                            {campaign.type === 'limited' ? '限时' : '常驻'}
                                        </span>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full",
                                            campaign.is_active 
                                                ? "bg-green-100 text-green-600" 
                                                : "bg-gray-100 text-gray-600"
                                        )}>
                                            {campaign.is_active ? '进行中' : '已暂停'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">{campaign.description || '暂无描述'}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        {campaign.type === 'limited' && campaign.end_time && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                截止: {new Date(campaign.end_time).toLocaleDateString('zh-CN')}
                                            </span>
                                        )}
                                        <span>{campaign.activities_count || 0} 个主题</span>
                                        <span>{campaign.tasks_count || 0} 个任务</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onEdit(campaign)}
                                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(campaign.id)}
                                        className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

// Prizes View
function PrizesView({ prizes, onDelete, onEdit, searchQuery, onSearchChange }: any) {
    const filteredPrizes = prizes.filter((p: Prize) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 密钥管理状态
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [selectedPrize, setSelectedPrize] = useState<{ id: number; name: string } | null>(null);

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="card p-4 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="搜索奖品..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="flex-1 outline-none text-gray-900"
                />
                <button className="p-2 hover:bg-gray-50 rounded-lg">
                    <Filter className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Prizes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPrizes.length === 0 ? (
                    <div className="col-span-full card p-12 text-center text-gray-400">
                        {searchQuery ? '未找到匹配的奖品' : '暂无奖品'}
                    </div>
                ) : (
                    filteredPrizes.map((prize: Prize) => {
                        console.log(`🎫 Prize ${prize.id}:`, {
                            name: prize.name,
                            use_key_pool: prize.use_key_pool,
                            available_keys: prize.available_keys,
                            delivery_type: prize.delivery_type
                        });
                        return (
                        <motion.div
                            key={prize.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card p-4 hover:shadow-md transition-all"
                        >
                            <div className="flex flex-col h-full">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 mb-1">{prize.name}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2">{prize.description || '暂无描述'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-yellow-500" />
                                        <span className="font-bold text-primary">{prize.points_required}</span>
                                        <span className="text-xs text-gray-400">积分</span>
                                    </div>
                                    {prize.use_key_pool ? (
                                        <span className="flex items-center gap-1 text-xs text-green-600">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                            密钥库: {prize.available_keys || 0}
                                        </span>
                                    ) : prize.stock ? (
                                        <span className="text-xs text-gray-500">
                                            库存: {prize.stock - prize.claimed_count}/{prize.stock}
                                        </span>
                                    ) : null}
                                </div>

                                <div className="flex items-center gap-2 mt-3">
                                    {prize.use_key_pool && (
                                        <button
                                            onClick={() => {
                                                setSelectedPrize({ id: prize.id!, name: prize.name });
                                                setShowKeyModal(true);
                                            }}
                                            className="flex-1 p-2 hover:bg-green-50 rounded-lg text-green-600 text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                            密钥
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onEdit(prize)}
                                        className="flex-1 p-2 hover:bg-blue-50 rounded-lg text-blue-600 text-sm font-medium transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4 inline mr-1" />
                                        编辑
                                    </button>
                                    <button
                                        onClick={() => onDelete(prize.id)}
                                        className="flex-1 p-2 hover:bg-red-50 rounded-lg text-red-600 text-sm font-medium transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 inline mr-1" />
                                        删除
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                        );
                    })
                )}
            </div>

            {/* 密钥管理模态框 */}
            {showKeyModal && selectedPrize && (
                <PrizeKeyModal
                    prizeId={selectedPrize.id}
                    prizeName={selectedPrize.name}
                    onClose={() => {
                        setShowKeyModal(false);
                        setSelectedPrize(null);
                    }}
                />
            )}
        </div>
    );
}

// Activities View
function ActivitiesView({ activities, onDelete, onEdit, searchQuery, onSearchChange }: any) {
    const filteredActivities = activities.filter((a: Activity) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="card p-4 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="搜索主题..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="flex-1 outline-none text-gray-900"
                />
                <button className="p-2 hover:bg-gray-50 rounded-lg">
                    <Filter className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Activities List */}
            <div className="space-y-3">
                {filteredActivities.length === 0 ? (
                    <div className="card p-12 text-center text-gray-400">
                        {searchQuery ? '未找到匹配的主题' : '暂无主题'}
                    </div>
                ) : (
                    filteredActivities.map((activity: Activity) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="card p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="text-3xl">{activity.icon || '🎯'}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-gray-900">{activity.name}</h3>
                                            {activity.campaign_name && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                                                    {activity.campaign_name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{activity.description || '暂无描述'}</p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                            <span>排序: {activity.order_index}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onEdit(activity)}
                                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(activity.id)}
                                        className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

// Tasks View
function TasksView({ tasks, onDelete, onEdit, searchQuery, onSearchChange }: any) {
    const filteredTasks = tasks.filter((t: Task) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="card p-4 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="搜索任务..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="flex-1 outline-none text-gray-900"
                />
                <button className="p-2 hover:bg-gray-50 rounded-lg">
                    <Filter className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                    <div className="card p-12 text-center text-gray-400">
                        {searchQuery ? '未找到匹配的任务' : '暂无任务'}
                    </div>
                ) : (
                    filteredTasks.map((task: Task) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="card p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-gray-900">{task.title}</h3>
                                        {task.activity_name && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                                                {task.activity_name}
                                            </span>
                                        )}
                                        {task.campaign_name && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                                                {task.campaign_name}
                                            </span>
                                        )}
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full font-medium",
                                            task.recurrence === 'once' ? "bg-gray-100 text-gray-600" :
                                            task.recurrence === 'daily' ? "bg-green-100 text-green-600" :
                                            "bg-blue-100 text-blue-600"
                                        )}>
                                            {task.recurrence === 'once' ? '一次性' : 
                                             task.recurrence === 'daily' ? '每日' : '每周'}
                                        </span>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full",
                                            task.is_active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                                        )}>
                                            {task.is_active ? '进行中' : '已暂停'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">{task.description || '暂无描述'}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Zap className="w-3 h-3 text-yellow-500" />
                                            {task.points} 积分
                                        </span>
                                        <span>已领取: {task.claimed_count}</span>
                                        {task.stock_limit && <span>库存: {task.stock_limit}</span>}
                                        {task.chat_required && <span>需要聊天室</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onEdit(task)}
                                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(task.id)}
                                        className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
