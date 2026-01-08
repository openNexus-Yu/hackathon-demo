import { motion, AnimatePresence } from 'framer-motion';
import { Star, Users, ExternalLink, Zap, Github, Box, Loader2, Trophy, MapPin, Building, Plus, LayoutGrid, X, Check, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

const BACKEND_URL = 'http://localhost:3000';

interface GitHubStats {
    public_repos: number;
    followers: number;
    following: number;
    public_gists: number;
}

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string;
    stargazers_count: number;
    language: string;
    html_url: string;
    fork: boolean;
}

interface ContributionDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

interface GitHubOrg {
    id: number;
    login: string;
    avatar_url: string;
    description: string;
}

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
    <motion.div
        whileHover={{ y: -4 }}
        className="card p-6 flex items-start justify-between"
    >
        <div>
            <p className="text-gray-500 text-sm mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
    </motion.div>
);

const PlatformTab = ({ name, icon: Icon, active, onClick, connected }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${active
            ? 'bg-primary text-white shadow-lg shadow-primary/20'
            : connected
                ? 'bg-white border border-border text-gray-700 hover:bg-gray-50'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-transparent'
            }`}
        disabled={!connected}
    >
        <Icon className="w-4 h-4" />
        {name}
        {!connected && <span className="text-xs opacity-60">(Not connected)</span>}
    </button>
);

const OrgCard = ({ org, delay, onAddToPlatform, onRemoveFromPlatform, isAdded }: {
    org: GitHubOrg,
    delay: number,
    onAddToPlatform?: (org: GitHubOrg) => void,
    onRemoveFromPlatform?: (org: GitHubOrg) => void,
    isAdded?: boolean
}) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-border hover:border-primary/30 transition-colors"
    >
        <img
            src={org.avatar_url}
            alt={org.login}
            className="w-12 h-12 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">{org.login}</h4>
            <p className="text-xs text-gray-500 truncate">{org.description || 'GitHub Organization'}</p>
        </div>
        {isAdded ? (
            <button
                onClick={() => onRemoveFromPlatform?.(org)}
                className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors whitespace-nowrap"
            >
                Remove
            </button>
        ) : onAddToPlatform && (
            <button
                onClick={() => onAddToPlatform(org)}
                className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors whitespace-nowrap"
            >
                + Add
            </button>
        )}
    </motion.div>
);

// Repo Selector Modal
const RepoSelectorModal = ({
    isOpen,
    onClose,
    allRepos,
    pinnedIds,
    onSave,
    loading
}: {
    isOpen: boolean;
    onClose: () => void;
    allRepos: GitHubRepo[];
    pinnedIds: number[];
    onSave: (ids: number[]) => void;
    loading: boolean;
}) => {
    const [selected, setSelected] = useState<number[]>(pinnedIds);

    useEffect(() => {
        setSelected(pinnedIds);
    }, [pinnedIds, isOpen]);

    const toggleRepo = (id: number) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(i => i !== id));
        } else if (selected.length < 6) {
            setSelected([...selected, id]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Select Pinned Repositories</h2>
                        <p className="text-sm text-gray-500">Choose up to 6 repositories ({selected.length}/6)</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {allRepos.map(repo => (
                                <div
                                    key={repo.id}
                                    onClick={() => toggleRepo(repo.id)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selected.includes(repo.id)
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selected.includes(repo.id) ? 'bg-primary border-primary' : 'border-gray-300'
                                                }`}>
                                                {selected.includes(repo.id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{repo.name}</h4>
                                                <p className="text-xs text-gray-500 line-clamp-1">{repo.description || 'No description'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            {repo.language && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" />{repo.language}</span>}
                                            <span className="flex items-center gap-1"><Star className="w-3 h-3" />{repo.stargazers_count}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-gray-600 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        onClick={() => { onSave(selected); onClose(); }}
                        className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark"
                    >
                        Save
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default function Profile() {
    const { isAuthenticated, user, githubToken } = useAuthStore();
    const [activePlatform, setActivePlatform] = useState('github');
    const [stats, setStats] = useState<GitHubStats | null>(null);
    const [allRepos, setAllRepos] = useState<GitHubRepo[]>([]);
    const [pinnedRepoIds, setPinnedRepoIds] = useState<number[]>([]);
    const [contributionData, setContributionData] = useState<ContributionDay[]>([]);
    const [totalContributions, setTotalContributions] = useState(0);
    const [loading, setLoading] = useState(true);
    const [repoModalOpen, setRepoModalOpen] = useState(false);
    const [reposLoading, setReposLoading] = useState(false);
    const [userOrgs, setUserOrgs] = useState<GitHubOrg[]>([]);
    const [orgsLoading, setOrgsLoading] = useState(false);
    const [addedOrgIds, setAddedOrgIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (githubToken && user && activePlatform === 'github') {
            fetchGitHubData();
            fetchContributions();
            fetchUserOrgs();
        }
    }, [githubToken, user, activePlatform]);

    const fetchUserOrgs = async () => {
        if (!githubToken) return;

        setOrgsLoading(true);
        try {
            // Fetch user's GitHub orgs
            const res = await fetch(`${BACKEND_URL}/api/github/orgs?token=${githubToken}`);
            if (res.ok) {
                const data = await res.json();
                setUserOrgs(data);
            }

            // Fetch platform orgs to know which are already added
            const platformRes = await fetch(`${BACKEND_URL}/api/orgs`);
            if (platformRes.ok) {
                const platformOrgs = await platformRes.json();
                const addedIds = new Set<number>(platformOrgs.map((o: { github_org_id: number }) => o.github_org_id));
                setAddedOrgIds(addedIds);
            }
        } catch (err) {
            console.error('Failed to fetch user orgs:', err);
        } finally {
            setOrgsLoading(false);
        }
    };

    const handleAddOrgToPlatform = async (org: GitHubOrg) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/orgs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orgName: org.login,
                    githubOrgId: org.id,
                    avatarUrl: org.avatar_url,
                    description: org.description,
                    memberCount: 1,
                }),
            });
            if (res.ok) {
                setAddedOrgIds(prev => new Set(prev).add(org.id));
                alert(`Organization "${org.login}" has been added to the platform!`);
            } else {
                const error = await res.json();
                alert(`Failed to add: ${error.detail || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Failed to add org to platform:', err);
            alert('Failed to add organization. Please try again.');
        }
    };

    const handleRemoveOrg = async (org: GitHubOrg) => {
        if (!confirm(`Remove "${org.login}" from the platform?`)) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/orgs/${org.id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setAddedOrgIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(org.id);
                    return newSet;
                });
                alert(`Organization "${org.login}" has been removed.`);
            } else {
                const error = await res.json();
                alert(`Failed to remove: ${error.detail || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Failed to remove org:', err);
            alert('Failed to remove organization. Please try again.');
        }
    };

    const fetchGitHubData = async () => {
        if (!githubToken || !user) return;

        setLoading(true);
        try {
            // Fetch stats
            const userRes = await fetch('https://api.github.com/user', {
                headers: { Authorization: `Bearer ${githubToken}` }
            });
            const userData = await userRes.json();
            setStats({
                public_repos: userData.public_repos,
                followers: userData.followers,
                following: userData.following,
                public_gists: userData.public_gists,
            });

            // Fetch Repos
            const reposRes = await fetch(`https://api.github.com/users/${user.login}/repos?sort=updated&per_page=30`, {
                headers: { Authorization: `Bearer ${githubToken}` }
            });
            const reposData = await reposRes.json();
            setAllRepos(reposData);

            // Default: pin first 6
            if (pinnedRepoIds.length === 0 && reposData.length > 0) {
                setPinnedRepoIds(reposData.slice(0, 6).map((r: GitHubRepo) => r.id));
            }

        } catch (err) {
            console.error('Failed to fetch GitHub data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchContributions = async () => {
        if (!githubToken || !user) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/github/contributions/${user.login}?token=${githubToken}`);
            if (res.ok) {
                const data = await res.json();
                setContributionData(data.contributions);
                setTotalContributions(data.total);
            }
        } catch (err) {
            console.error('Failed to fetch contributions:', err);
        }
    };

    const openRepoModal = async () => {
        setRepoModalOpen(true);
        setReposLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/github/repos/${user?.login}?token=${githubToken}`);
            if (res.ok) {
                const data = await res.json();
                setAllRepos(data);
            }
        } catch (err) {
            console.error('Failed to fetch all repos:', err);
        } finally {
            setReposLoading(false);
        }
    };

    if (!isAuthenticated || !user) {
        return <Navigate to="/auth" replace />;
    }

    const platforms = [
        { name: 'GitHub', icon: Github, connected: true },
        { name: 'GitLab', icon: Box, connected: false },
        { name: 'Gitee', icon: Box, connected: false },
    ];

    const pinnedRepos = allRepos.filter(r => pinnedRepoIds.includes(r.id));

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Repo Selector Modal */}
            <AnimatePresence>
                <RepoSelectorModal
                    isOpen={repoModalOpen}
                    onClose={() => setRepoModalOpen(false)}
                    allRepos={allRepos}
                    pinnedIds={pinnedRepoIds}
                    onSave={setPinnedRepoIds}
                    loading={reposLoading}
                />
            </AnimatePresence>

            {/* Header Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row gap-8 items-start mb-12"
            >
                <div className="relative">
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-accent p-[2px]">
                        <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                            <img
                                src={user.avatar_url}
                                alt={user.login}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-primary w-6 h-6 rounded-full border-4 border-white flex items-center justify-center">
                        <Github className="w-3 h-3 text-white" />
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">{user.name || user.login}</h1>
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                            Lvl 12
                        </span>
                    </div>
                    <p className="text-gray-500 mb-4 max-w-2xl">
                        Building the future. Open source enthusiast.
                    </p>

                    <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-2">
                            <Building className="w-4 h-4" /> OpenSource Hub
                        </span>
                        <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Global
                        </span>
                        <a
                            href={`https://github.com/${user.login}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 hover:text-primary cursor-pointer transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" /> github.com/{user.login}
                        </a>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-lg bg-white border border-border hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                        Edit Profile
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors text-white text-sm font-medium shadow-lg shadow-primary/20">
                        Share
                    </button>
                </div>
            </motion.div>

            {/* Platform Selector */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-3">
                    {platforms.map((platform) => (
                        <PlatformTab
                            key={platform.name}
                            name={platform.name}
                            icon={platform.icon}
                            active={activePlatform === platform.name.toLowerCase()}
                            onClick={() => platform.connected && setActivePlatform(platform.name.toLowerCase())}
                            connected={platform.connected}
                        />
                    ))}
                </div>
                <button className="text-sm text-primary flex items-center gap-1 hover:underline">
                    <Plus className="w-4 h-4" /> Connect New Platform
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard label="Public Repos" value={stats?.public_repos ?? '-'} icon={Github} color="bg-gray-100 text-gray-600" />
                <StatCard label="Followers" value={stats?.followers ?? '-'} icon={Users} color="bg-blue-100 text-blue-600" />
                <StatCard label="Contributions" value={totalContributions || '-'} icon={Star} color="bg-green-100 text-green-600" />
                <StatCard label="Total XP" value="12,450" icon={Zap} color="bg-purple-100 text-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Contribution Graph */}
                    <section>
                        <h2 className="text-xl font-bold mb-6 flex items-center justify-between text-gray-900">
                            <span>Contribution Activity ({totalContributions} contributions)</span>
                        </h2>
                        <div className="card p-6 overflow-x-auto">
                            {contributionData.length > 0 ? (
                                <div className="min-w-[700px] flex justify-center">
                                    <ActivityCalendar
                                        data={contributionData}
                                        theme={{
                                            light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                                            dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                                        }}
                                        labels={{
                                            totalCount: '{{count}} contributions in the last year',
                                        }}
                                        blockSize={12}
                                        blockMargin={4}
                                        fontSize={12}
                                    />
                                    <ReactTooltip id="react-tooltip" />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-12 text-gray-400">
                                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading contributions...
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Pinned Repositories */}
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <LayoutGrid className="w-5 h-5 text-gray-400" />
                                Pinned Repositories
                            </h2>
                            <button
                                onClick={openRepoModal}
                                className="text-sm text-primary hover:text-primary-dark"
                            >
                                Customize
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {pinnedRepos.length > 0 ? pinnedRepos.map(repo => (
                                    <a
                                        key={repo.id}
                                        href={repo.html_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="card p-4 hover:border-primary/50 group block h-full"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 font-semibold text-gray-900 group-hover:text-primary">
                                                <Box className="w-4 h-4 text-gray-400" />
                                                {repo.name}
                                            </div>
                                            <span className="text-xs border border-border px-2 py-0.5 rounded-full text-gray-500">Public</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">
                                            {repo.description || "No description provided."}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            {repo.language && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> {repo.language}</span>}
                                            <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stargazers_count}</span>
                                        </div>
                                    </a>
                                )) : (
                                    <div className="col-span-2 text-center py-8 text-gray-400 border border-dashed border-border rounded-xl">
                                        No repositories pinned. Click "Customize" to select.
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Recent Quests */}
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Recent Quests</h2>
                            <button className="text-sm text-primary hover:text-primary-dark">View All</button>
                        </div>

                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="card p-4 flex items-center justify-between group cursor-pointer hover:border-primary/30">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg ${i === 1 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center`}>
                                            <Trophy className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 group-hover:text-primary transition-colors">Fix critical bug in Substrate</h4>
                                            <p className="text-xs text-gray-500">Completed 2 hours ago • +500 XP</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-semibold">
                                        Approved
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">My Organizations</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={fetchUserOrgs}
                                    className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                    title="Refresh from GitHub"
                                >
                                    <RefreshCw className={`w-4 h-4 ${orgsLoading ? 'animate-spin' : ''}`} />
                                </button>
                                <a
                                    href={`${BACKEND_URL}/api/auth/github?reauth=true`}
                                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                                >
                                    Re-authorize
                                </a>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {orgsLoading ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : userOrgs.length > 0 ? (
                                userOrgs.map((org, idx) => (
                                    <OrgCard
                                        key={org.id}
                                        org={org}
                                        delay={idx * 0.1}
                                        isAdded={addedOrgIds.has(org.id)}
                                        onAddToPlatform={handleAddOrgToPlatform}
                                        onRemoveFromPlatform={handleRemoveOrg}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                    No GitHub organizations found
                                    <p className="mt-2 text-xs">Click "Re-authorize" to grant organization access</p>
                                </div>
                            )}
                        </div>
                        <Link
                            to="/discover"
                            className="block w-full mt-4 py-3 rounded-xl border border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors text-sm font-medium text-center"
                        >
                            + Discover More Organizations
                        </Link>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-6 text-gray-900">Achievements</h2>
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="aspect-square rounded-lg bg-gray-100 border border-border hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-help group relative">
                                    <div className="absolute inset-0 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">
                                        {i === 1 ? '🌟' : i === 2 ? '🚀' : '🔒'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

            </div>
        </div>
    );
}
