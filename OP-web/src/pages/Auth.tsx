import { motion } from 'framer-motion';
import { Github, Gitlab, ArrowRight, Shield, Zap, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = 'http://localhost:3000';

export default function Auth() {
    const { t } = useTranslation();
    const handleGitHubLogin = () => {
        // Redirect to backend GitHub OAuth endpoint
        window.location.href = `${BACKEND_URL}/api/auth/github`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px]" style={{ animationDelay: '3s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Card */}
                <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl shadow-primary/5">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6 animate-glow">
                            <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold mb-3">{t('auth.welcome')}</h1>
                        <p className="text-gray-400">
                            {t('auth.welcomeDescription')}
                        </p>
                    </div>

                    {/* OAuth Buttons */}
                    <div className="space-y-4">
                        <button
                            onClick={handleGitHubLogin}
                            className="group w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 font-medium"
                        >
                            <Github className="w-5 h-5" />
                            {t('auth.continueWith', { provider: 'GitHub' })}
                            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </button>

                        <button
                            disabled
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white/[0.02] border border-white/5 text-gray-500 cursor-not-allowed font-medium"
                        >
                            <Gitlab className="w-5 h-5" />
                            {t('auth.comingSoon', { provider: 'GitLab' })}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <span className="text-xs text-gray-500 uppercase tracking-wider">{t('auth.benefits')}</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Zap className="w-4 h-4 text-primary" /> {t('auth.syncContributions')}
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Users className="w-4 h-4 text-primary" /> {t('auth.joinCommunities')}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-600 mt-8">
                    {t('auth.agreeTerms')}
                </p>
            </motion.div>
        </div>
    );
}
