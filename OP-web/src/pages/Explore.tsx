import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Sparkles, MessageSquare, Users, Globe, Hash, 
    Loader2, TrendingUp, Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = 'http://localhost:3000';

interface MatrixServer {
    id: string;
    name: string;
    description: string;
    homeserver: string;
    members_count: number;
    rooms_count: number;
    category: string;
    is_public: boolean;
    avatar_url?: string;
    source?: string;
    org_id?: number;
    room_id?: string;
    space_id?: string;
}

interface AIResponse {
    answer: string;
    servers: MatrixServer[];
    query: string;
}

const ServerCard = ({ server }: { server: MatrixServer }) => {
    const { t } = useTranslation();
    
    const getSourceBadge = () => {
        switch (server.source) {
            case 'database':
                return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">{t('explore.badges.realOrg')}</span>;
            case 'matrix':
                return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium">{t('explore.badges.matrixSpace')}</span>;
            case 'web':
                return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">{t('explore.badges.web')}</span>;
            default:
                return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{t('explore.badges.curated')}</span>;
        }
    };
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="card p-5 cursor-pointer group border border-border hover:border-primary/50 hover:shadow-md transition-all"
        >
            <div className="flex items-start gap-4">
                {server.avatar_url ? (
                    <img src={server.avatar_url} alt={server.name} className="w-12 h-12 rounded-lg flex-shrink-0" />
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Hash className="w-6 h-6 text-primary" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                            {server.name}
                        </h3>
                        {getSourceBadge()}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{server.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{server.members_count.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{server.rooms_count} {t('explore.rooms')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span className="truncate">{server.homeserver}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function Explore() {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiAnswer, setAiAnswer] = useState('');
    const [servers, setServers] = useState<MatrixServer[]>([]);
    const [showResults, setShowResults] = useState(false);

    const popularSearches = [
        'Rust programming community',
        'Linux open source projects',
        'Matrix protocol discussion',
        'OpenNexus organization',
        'AI/ML communities'
    ];

    const handleSearch = async (query?: string) => {
        const searchTerm = query || searchQuery;
        if (!searchTerm.trim()) return;

        console.log('[Explore] Searching for:', searchTerm);
        setLoading(true);
        setShowResults(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/search/matrix-communities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchTerm })
            });

            console.log('[Explore] Response status:', response.status);

            if (response.ok) {
                const data: AIResponse = await response.json();
                console.log('[Explore] Received data:', data);
                console.log('[Explore] Servers count:', data.servers?.length || 0);
                setAiAnswer(data.answer);
                setServers(data.servers);
            } else {
                console.error('[Explore] Response not OK:', response.status);
                setAiAnswer(t('explore.errorMessage'));
                setServers([]);
            }
        } catch (err) {
            console.error('[Explore] Search failed:', err);
            setAiAnswer(t('explore.connectionError'));
            setServers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Search Header */}
            <div className={`transition-all duration-300 ${showResults ? 'py-6' : 'py-20'}`}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Logo/Title */}
                    {!showResults && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-12"
                        >
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Sparkles className="w-10 h-10 text-primary" />
                                <h1 className="text-5xl font-bold text-gray-900">{t('explore.title')}</h1>
                            </div>
                            <p className="text-gray-600 text-lg">
                                {t('explore.subtitle')}
                            </p>
                        </motion.div>
                    )}

                    {/* Search Box */}
                    <div className="relative">
                        <div className="relative flex items-center">
                            <Search className="absolute left-5 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={t('explore.searchPlaceholder')}
                                className="w-full pl-14 pr-32 py-4 rounded-full bg-white border border-border text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:shadow-lg transition-all text-base"
                            />
                            <button
                                onClick={() => handleSearch()}
                                disabled={loading || !searchQuery.trim()}
                                className="absolute right-2 px-6 py-2 rounded-full bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    t('explore.searchButton')
                                )}
                            </button>
                        </div>

                        {/* Popular Searches */}
                        {!showResults && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mt-6 flex flex-wrap gap-2 justify-center"
                            >
                                {popularSearches.map((search) => (
                                    <button
                                        key={search}
                                        onClick={() => {
                                            setSearchQuery(search);
                                            handleSearch(search);
                                        }}
                                        className="px-4 py-2 rounded-full bg-white border border-border text-sm text-gray-600 hover:border-primary hover:text-primary hover:shadow-sm transition-all"
                                    >
                                        {search}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <AnimatePresence>
                {showResults && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12"
                    >
                        {/* AI Overview Card */}
                        {aiAnswer && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8"
                            >
                                <div className="card p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-2">{t('explore.aiOverview')}</h3>
                                            <p className="text-gray-700 leading-relaxed">{aiAnswer}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Results Stats */}
                        {servers.length > 0 && (
                            <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>{t('explore.resultsFound', { count: servers.length })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    <span>{t('explore.searchingAcross')}</span>
                                </div>
                            </div>
                        )}

                        {/* Results Grid */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                                <p className="text-gray-500">{t('explore.searchingAllSources')}</p>
                            </div>
                        ) : servers.length > 0 ? (
                            <div className="space-y-4">
                                {servers.map((server, index) => (
                                    <motion.div
                                        key={server.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <ServerCard server={server} />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <Globe className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p className="text-lg mb-2">{t('explore.noResults')}</p>
                                <p className="text-sm">{t('explore.tryDifferentTerm')}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Features Section (only show when no results) */}
            {!showResults && (
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                                <Globe className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">{t('explore.features.realOrgs.title')}</h3>
                            <p className="text-sm text-gray-600">
                                {t('explore.features.realOrgs.description')}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                                <Hash className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">{t('explore.features.matrixSpaces.title')}</h3>
                            <p className="text-sm text-gray-600">
                                {t('explore.features.matrixSpaces.description')}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">{t('explore.features.aiPowered.title')}</h3>
                            <p className="text-sm text-gray-600">
                                {t('explore.features.aiPowered.description')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
