import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { MessageSquare, Trophy, Globe, Mail, MapPin, GitBranch, Star, ExternalLink, Box, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

// Mock org data for demo orgs
const orgsData: Record<string, any> = {
    "opennexus-yu": {
        name: "OpenNexus-Yu",
        description: "Yu Developer Platform - 激励系统与聊天室集成平台",
        banner: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=400&fit=crop",
        logo: "🚀",
        website: "github.com/opennexus-yu",
        email: "hello@opennexus-yu.com",
        location: "Global",
        members: 50,
        stars: "1k+",
        repos: [
            { name: "yu-platform", description: "Yu Developer Platform with Incentive System", stars: 100, lang: "TypeScript" },
        ],
        // 使用用户实际创建的Space别名 (带空格的)
        matrixRoom: "#OpenNexus-Yu:localhost",
    },
    polkadot: {
        name: "Polkadot",
        description: "Polkadot empowers blockchain networks to work together under the protection of shared security.",
        banner: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=400&fit=crop",
        logo: "🟣",
        website: "polkadot.network",
        email: "hello@polkadot.network",
        location: "Global",
        members: 156,
        stars: "500k+",
        repos: [
            { name: "polkadot-sdk", description: "The Parity Polkadot Blockchain SDK", stars: 1420, lang: "Rust" },
            { name: "substrate", description: "Blockchain framework for the decentralized web", stars: 8400, lang: "Rust" },
        ],
        matrixRoom: "#polkadot:matrix.org",
    },
    openai: {
        name: "OpenAI",
        description: "AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity.",
        banner: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=400&fit=crop",
        logo: "🚀",
        website: "openai.com",
        email: "support@openai.com",
        location: "San Francisco, CA",
        members: 892,
        stars: "900k+",
        repos: [
            { name: "openai-cookbook", description: "Examples and guides for using the OpenAI API", stars: 54000, lang: "Python" },
            { name: "whisper", description: "Robust Speech Recognition", stars: 42000, lang: "Python" },
        ],
        matrixRoom: "#openai:matrix.org",
    },
    react: {
        name: "React",
        description: "The library for web and native user interfaces. Connect with the React community.",
        banner: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=400&fit=crop",
        logo: "⚛️",
        website: "react.dev",
        email: "react@meta.com",
        location: "Menlo Park, CA",
        members: 4200,
        stars: "220k+",
        repos: [
            { name: "react", description: "The library for web and native user interfaces", stars: 218000, lang: "JavaScript" },
            { name: "react-native", description: "A framework for building native apps using React", stars: 112000, lang: "JavaScript" },
        ],
        matrixRoom: "#react:matrix.org",
    },
    vercel: {
        name: "Vercel",
        description: "Develop. Preview. Ship. Vercel is the platform for frontend developers.",
        banner: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=1200&h=400&fit=crop",
        logo: "▲",
        website: "vercel.com",
        email: "support@vercel.com",
        location: "San Francisco, CA",
        members: 320,
        stars: "120k+",
        repos: [
            { name: "next.js", description: "The React Framework", stars: 118000, lang: "JavaScript" },
            { name: "turbo", description: "Incremental bundler and build system", stars: 24000, lang: "Rust" },
        ],
        matrixRoom: "#vercel:matrix.org",
    },
    "rust-lang": {
        name: "Rust-Lang",
        description: "Empowering everyone to build reliable and efficient software.",
        banner: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&h=400&fit=crop",
        logo: "🦀",
        website: "rust-lang.org",
        email: "core@rust-lang.org",
        location: "Global",
        members: 234,
        stars: "150k+",
        repos: [
            { name: "rust", description: "The Rust programming language", stars: 88000, lang: "Rust" },
            { name: "cargo", description: "The Rust package manager", stars: 11000, lang: "Rust" },
        ],
        matrixRoom: "#rust:matrix.org",
    },
    vuejs: {
        name: "Vue.js",
        description: "The Progressive JavaScript Framework.",
        banner: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=400&fit=crop",
        logo: "💚",
        website: "vuejs.org",
        email: "hello@vuejs.org",
        location: "Global",
        members: 98,
        stars: "205k+",
        repos: [
            { name: "vue", description: "The progressive JavaScript framework", stars: 205000, lang: "TypeScript" },
            { name: "vite", description: "Next generation frontend tooling", stars: 62000, lang: "TypeScript" },
        ],
        matrixRoom: "#vue:matrix.org",
    },
};

const defaultOrg = {
    name: "Organization",
    description: "An open source organization.",
    banner: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop",
    logo: "🏢",
    website: "example.com",
    email: "hello@example.com",
    location: "Global",
    members: 100,
    stars: "10k+",
    repos: [],
    matrixRoom: "#general:matrix.org",
};

const RepoCard = ({ name, description, lang, stars }: any) => (
    <div className="card p-4 hover:border-primary/50 group">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-semibold text-gray-900 group-hover:text-primary">
                <Box className="w-4 h-4 text-gray-400" />
                {name}
            </div>
            <span className="text-xs border border-border px-2 py-0.5 rounded-full text-gray-500">Public</span>
        </div>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{description}</p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
            {lang && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> {lang}</span>}
            <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {stars}</span>
        </div>
    </div>
);

export default function Org() {
    const { orgId } = useParams<{ orgId: string }>();
    const { githubToken } = useAuthStore();
    const [org, setOrg] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrgData();
    }, [orgId, githubToken]);

    const fetchOrgData = async () => {
        if (!orgId) return;

        // Check if it's a mock org first
        const mockOrg = orgsData[orgId.toLowerCase()];
        if (mockOrg) {
            setOrg(mockOrg);
            setLoading(false);
            return;
        }

        // Try to fetch real org data
        try {
            // Fetch org info from GitHub
            const orgRes = await fetch(`https://api.github.com/orgs/${orgId}`, {
                headers: githubToken ? { Authorization: `Bearer ${githubToken}` } : {},
            });

            if (orgRes.ok) {
                const orgData = await orgRes.json();

                // Fetch org repos
                const reposRes = await fetch(`https://api.github.com/orgs/${orgId}/repos?sort=stars&per_page=6`, {
                    headers: githubToken ? { Authorization: `Bearer ${githubToken}` } : {},
                });
                const reposData = reposRes.ok ? await reposRes.json() : [];

                // Calculate total stars
                const totalStars = reposData.reduce((sum: number, r: any) => sum + (r.stargazers_count || 0), 0);

                setOrg({
                    name: orgData.name || orgData.login,
                    description: orgData.description || `GitHub organization: ${orgData.login}`,
                    banner: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop",
                    logo: orgData.avatar_url,
                    website: orgData.blog || `github.com/${orgData.login}`,
                    email: orgData.email || `contact@${orgData.login}`,
                    location: orgData.location || "Global",
                    members: orgData.public_members_count || reposData.length,
                    stars: totalStars > 1000 ? `${Math.round(totalStars / 1000)}k+` : totalStars.toString(),
                    repos: reposData.slice(0, 4).map((r: any) => ({
                        name: r.name,
                        description: r.description || 'No description',
                        stars: r.stargazers_count,
                        lang: r.language,
                    })),
                    matrixRoom: `#${orgData.login}:matrix.org`,
                    repoCount: orgData.public_repos,
                });
            } else {
                // Fallback to default
                setOrg({ ...defaultOrg, name: orgId });
            }
        } catch (err) {
            console.error('Failed to fetch org data:', err);
            setOrg({ ...defaultOrg, name: orgId });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!org) {
        return (
            <div className="flex justify-center items-center min-h-[400px] text-gray-400">
                Organization not found
            </div>
        );
    }

    return (
        <div className="pb-20">
            {/* Banner */}
            <div className="relative h-64 bg-gray-200">
                <img src={org.banner} alt={org.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row gap-6 items-start mb-12"
                >
                    {org.logo && org.logo.startsWith('http') ? (
                        <img src={org.logo} alt={org.name} className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl object-cover" />
                    ) : (
                        <div className="w-32 h-32 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center text-5xl">
                            {org.logo || '🏢'}
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-semibold">
                                ✓ Verified
                            </span>
                        </div>
                        <p className="text-gray-500 mb-4 max-w-2xl">{org.description}</p>

                        <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                            <a href={`https://${org.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary">
                                <Globe className="w-4 h-4" /> {org.website}
                            </a>
                            <span className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> {org.location}
                            </span>
                            <a href={`mailto:${org.email}`} className="flex items-center gap-2 hover:text-primary">
                                <Mail className="w-4 h-4" /> {org.email}
                            </a>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {/* Chat Room Button - 直接进入Space的lobby */}
                        <button
                            onClick={() => {
                                const roomId = org.chatRoomId || org.matrixRoom;
                                console.log('[Org] Opening chat room lobby:', roomId);
                                
                                if (!roomId) {
                                    console.error('[Org] No room ID configured');
                                    alert('暂未配置聊天室');
                                    return;
                                }
                                
                                // Cinny Space lobby的正确格式: /#/ROOM_ALIAS/lobby
                                const encodedRoomId = encodeURIComponent(roomId);
                                const cinnyUrl = `http://localhost:3001/#/${encodedRoomId}/lobby`;
                                console.log('[Org] Opening Cinny lobby URL:', cinnyUrl);
                                window.open(cinnyUrl, '_blank');
                            }}
                            className="px-4 py-2 rounded-lg bg-white border border-border hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                            <MessageSquare className="w-4 h-4" /> Chat Room
                        </button>
                        <Link
                            to={`/incentive/${orgId}`}
                            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors text-white text-sm font-medium shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <Trophy className="w-4 h-4" /> Quests & Rewards
                        </Link>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                                <GitBranch className="w-5 h-5 text-gray-400" />
                                Pinned Repositories
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {org.repos.length > 0 ? org.repos.map((repo: any, i: number) => (
                                    <RepoCard key={i} {...repo} />
                                )) : (
                                    <div className="col-span-2 text-center py-8 text-gray-400 border border-dashed border-border rounded-xl">
                                        No repositories to display.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                                <Trophy className="w-5 h-5 text-gray-400" />
                                Active Quests
                            </h2>
                            <div className="space-y-4">
                                <Link to={`/incentive/${orgId}`} className="card p-4 flex items-center justify-between hover:border-primary/30 cursor-pointer group">
                                    <div>
                                        <h4 className="font-medium text-gray-900 group-hover:text-primary">Complete 5 Documentation PRs</h4>
                                        <p className="text-sm text-gray-500">Earn 500 XP + Badge</p>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-600 text-xs font-semibold">+500 XP</span>
                                </Link>
                                <Link to={`/incentive/${orgId}`} className="card p-4 flex items-center justify-between hover:border-primary/30 cursor-pointer group">
                                    <div>
                                        <h4 className="font-medium text-gray-900 group-hover:text-primary">First Bug Fix</h4>
                                        <p className="text-sm text-gray-500">Starter quest for new contributors</p>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-semibold">+200 XP</span>
                                </Link>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        <section className="card p-6">
                            <h3 className="font-bold mb-4 text-gray-900">Community Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Members</span>
                                    <span className="font-semibold text-gray-900">{org.members}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Total Stars</span>
                                    <span className="font-semibold text-gray-900">{org.stars}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Active Quests</span>
                                    <span className="font-semibold text-gray-900">12</span>
                                </div>
                            </div>
                        </section>

                        <section className="card p-6">
                            <h3 className="font-bold mb-4 text-gray-900">Quick Links</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        const roomId = org.chatRoomId || org.matrixRoom;
                                        console.log('[Org] Opening chat room lobby (sidebar):', roomId);
                                        
                                        if (!roomId) {
                                            console.error('[Org] No room ID configured');
                                            alert('暂未配置聊天室');
                                            return;
                                        }
                                        
                                        // Cinny Space lobby的正确格式: /#/ROOM_ALIAS/lobby
                                        const encodedRoomId = encodeURIComponent(roomId);
                                        const cinnyUrl = `http://localhost:3001/#/${encodedRoomId}/lobby`;
                                        console.log('[Org] Opening Cinny lobby URL (sidebar):', cinnyUrl);
                                        window.open(cinnyUrl, '_blank');
                                    }}
                                    className="flex items-center gap-2 text-gray-600 hover:text-primary py-2 w-full text-left"
                                >
                                    <MessageSquare className="w-4 h-4" /> Join Chat Room
                                </button>
                                <Link to={`/incentive/${orgId}`} className="flex items-center gap-2 text-gray-600 hover:text-primary py-2">
                                    <Trophy className="w-4 h-4" /> View Leaderboard
                                </Link>
                                <a href={`https://${org.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-primary py-2">
                                    <ExternalLink className="w-4 h-4" /> Official Website
                                </a>
                            </div>
                        </section>

                        <section className="card p-6">
                            <h3 className="font-bold mb-4 text-gray-900">Top Contributors</h3>
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-sm font-bold text-gray-500">
                                        {i}
                                    </div>
                                ))}
                                <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-xs font-bold text-primary">
                                    +{org.members - 5}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
