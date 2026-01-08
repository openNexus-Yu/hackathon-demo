import { motion } from 'framer-motion';
import { Search, Filter, Rocket, Users, MessageSquare, Trophy, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = 'http://localhost:3000';

interface Organization {
    id: number;
    github_org_id: number;
    org_name: string;
    avatar_url: string;
    description: string;
    member_count: number;
    platforms: string[];
}

// Demo mock organizations for showcase
const DEMO_ORGS: Organization[] = [
    {
        id: -1,
        github_org_id: -1,
        org_name: "Kubernetes",
        avatar_url: "",
        description: "Production-Grade Container Orchestration. Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications.",
        member_count: 3890,
        platforms: ["GitHub", "Cloud Native"],
    },
    {
        id: -2,
        github_org_id: -2,
        org_name: "TensorFlow",
        avatar_url: "",
        description: "An Open Source Machine Learning Framework for Everyone. TensorFlow is an end-to-end platform for machine learning.",
        member_count: 2654,
        platforms: ["GitHub", "AI/ML"],
    },
    {
        id: -3,
        github_org_id: -3,
        org_name: "React",
        avatar_url: "",
        description: "The library for web and native user interfaces. A JavaScript library for building user interfaces - maintained by Meta.",
        member_count: 4200,
        platforms: ["GitHub", "Frontend"],
    },
    {
        id: -4,
        github_org_id: -4,
        org_name: "Rust-Lang",
        avatar_url: "",
        description: "Empowering everyone to build reliable and efficient software. A language empowering everyone to build reliable and efficient software.",
        member_count: 2134,
        platforms: ["GitHub", "Systems"],
    },
];

// Emoji icons for demo orgs
const DEMO_ICONS: Record<string, string> = {
    "Kubernetes": "☸️",
    "TensorFlow": "🧠",
    "React": "⚛️",
    "Rust-Lang": "🦀",
};

const OrganizationCard = ({ org }: { org: Organization }) => {
    const { t } = useTranslation();
    const isDemo = org.id < 0;
    const icon = DEMO_ICONS[org.org_name];

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="group card p-6 relative"
        >
            <Link to={`/org/${org.org_name.toLowerCase().replace(/\./g, '')}`} className="absolute inset-0 z-10" />

            <div className="flex items-start justify-between mb-4">
                {org.avatar_url ? (
                    <img src={org.avatar_url} alt={org.org_name} className="w-12 h-12 rounded-lg object-cover" />
                ) : icon ? (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                        {icon}
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                        🏢
                    </div>
                )}
                <div className={`px-2 py-1 rounded text-xs font-semibold ${isDemo ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {isDemo ? t('discover.demo') : t('discover.verified')}
                </div>
            </div>

            <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary transition-colors">{org.org_name}</h3>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">{org.description || t('discover.noDescription')}</p>

            <div className="flex flex-wrap gap-2 mb-6">
                {org.platforms.map((platform: string) => (
                    <span key={platform} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 border border-border">
                        {platform}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-border">
                <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" /> {org.member_count}
                </div>
                <div className="flex items-center gap-1">
                    <Rocket className="w-4 h-4" /> GitHub
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4 relative z-20">
                <Link
                    to={`/org/${org.org_name.toLowerCase().replace(/\./g, '')}`}
                    className="flex-1 text-center py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary hover:text-white transition-all"
                >
                    {t('discover.viewOrg')}
                </Link>
                <Link
                    to={`/incentive/${org.org_name.toLowerCase().replace(/\./g, '')}`}
                    className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-all"
                    title={t('discover.incentiveProgram')}
                >
                    <Trophy className="w-4 h-4" />
                </Link>
                <Link
                    to={`/chat/${org.org_name.toLowerCase().replace(/\./g, '')}`}
                    className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                    title={t('discover.chatRoom')}
                >
                    <MessageSquare className="w-4 h-4" />
                </Link>
            </div>
        </motion.div>
    );
};

export default function Discover() {
    const { t } = useTranslation();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/orgs`);
            if (res.ok) {
                const data = await res.json();
                // Combine real orgs with demo orgs
                setOrgs([...data, ...DEMO_ORGS]);
            } else {
                // If API fails, still show demo orgs
                setOrgs(DEMO_ORGS);
            }
        } catch (err) {
            console.error('Failed to fetch organizations:', err);
            // Show demo orgs even if API fails
            setOrgs(DEMO_ORGS);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 text-gray-900">{t('discover.title')}</h1>
                <p className="text-gray-500 max-w-2xl mx-auto">
                    {t('discover.subtitle')}
                </p>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-12">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t('discover.searchPlaceholder')}
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-border text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary transition-colors"
                    />
                </div>
                <button className="px-6 py-4 rounded-xl bg-white border border-border hover:bg-gray-50 flex items-center gap-2 text-gray-600 font-medium whitespace-nowrap">
                    <Filter className="w-5 h-5" /> {t('discover.allFilters')}
                </button>
            </div>

            {/* Popular Tags */}
            <div className="flex flex-wrap gap-2 mb-12 justify-center">
                {['all', 'aiml', 'web3', 'mobile', 'cloud', 'tools'].map((tag) => (
                    <button
                        key={tag}
                        className={`px-4 py-2 rounded-full border text-sm transition-all ${tag === 'all' ? 'bg-primary text-white border-primary' : 'bg-white border-border text-gray-600 hover:border-primary hover:text-primary'}`}
                    >
                        {t(`discover.tags.${tag}`)}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            ) : orgs.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-lg mb-4">No organizations added yet</p>
                    <p className="text-sm">Add organizations from your Profile page to see them here</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orgs.map((org, index) => (
                        <motion.div
                            key={org.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <OrganizationCard org={org} />
                        </motion.div>
                    ))}
                </div>
            )}

            <div className="mt-16 text-center">
                <button className="px-8 py-3 rounded-full border border-border text-gray-600 hover:bg-gray-50 hover:border-primary transition-colors">
                    Load More
                </button>
            </div>
        </div>
    );
}
