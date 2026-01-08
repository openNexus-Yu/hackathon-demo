import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Users, Trophy, Zap, Building, MessageSquare, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
        viewport={{ once: true }}
        className="card p-8"
    >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Icon className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{description}</p>
    </motion.div>
);

const StatItem = ({ value, label }: { value: string, label: string }) => (
    <div className="text-center">
        <div className="text-4xl font-bold gradient-text mb-2">{value}</div>
        <div className="text-sm text-gray-400 uppercase tracking-wider font-medium">{label}</div>
    </div>
);

export default function Landing() {
    const { t } = useTranslation();
    return (
        <div className="relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
            </div>

            {/* Hero Section */}
            <section className="relative pt-24 pb-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-10">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-sm text-gray-600">{t('landing.betaBadge')}</span>
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-gray-900">
                        {t('landing.heroTitle')} <br />
                        <span className="gradient-text">{t('landing.heroTitleHighlight')}</span>
                        {" "} {t('landing.heroTitleSuffix')}
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 mb-12 leading-relaxed">
                        {t('landing.heroSubtitle')}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/auth"
                            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary hover:bg-primary-dark text-white font-semibold transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95"
                        >
                            {t('landing.startContributing')}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a
                            href="#features"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white border border-border hover:border-primary/30 text-gray-700 font-medium transition-all active:scale-95 shadow-sm"
                        >
                            {t('landing.exploreFeatures')}
                        </a>
                    </div>
                </motion.div>

                {/* Abstract UI Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="mt-24 relative w-full max-w-5xl mx-auto aspect-[16/9] bg-white rounded-2xl border border-border shadow-2xl shadow-primary/5 overflow-hidden hidden md:block"
                >
                    <div className="p-4 border-b border-border flex gap-2 bg-gray-50/50">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="p-8 grid grid-cols-3 gap-8 h-full">
                        <div className="col-span-1 space-y-4">
                            <div className="h-8 w-3/4 bg-gray-100 rounded mb-6" />
                            <div className="space-y-3">
                                <div className="h-12 w-full bg-primary/5 rounded-lg flex items-center px-3 border-l-2 border-primary"><div className="w-20 h-2 bg-gray-200 rounded" /></div>
                                <div className="h-12 w-full bg-gray-50 rounded-lg flex items-center px-3 opacity-50"><div className="w-16 h-2 bg-gray-200 rounded" /></div>
                                <div className="h-12 w-full bg-gray-50 rounded-lg flex items-center px-3 opacity-50"><div className="w-24 h-2 bg-gray-200 rounded" /></div>
                            </div>
                        </div>
                        <div className="col-span-2 space-y-4">
                            <div className="h-32 w-full bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-primary/10 flex items-center justify-center">
                                <Trophy className="w-12 h-12 text-primary" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-24 bg-gray-50 rounded-xl" />
                                <div className="h-24 bg-gray-50 rounded-xl" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Stats Section */}
            <section className="border-y border-border bg-white">
                <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <StatItem value="5,000+" label={t('landing.stats.organizations')} />
                    <StatItem value="1.2M+" label={t('landing.stats.developers')} />
                    <StatItem value="$5M+" label={t('landing.stats.distributed')} />
                    <StatItem value="150+" label={t('landing.stats.countries')} />
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-bold mb-5 text-gray-900">{t('landing.featuresTitle')} <span className="gradient-text">{t('landing.featuresTitleHighlight')}</span></h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        {t('landing.featuresSubtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={Code2}
                        title={t('landing.features.codeNexus.title')}
                        description={t('landing.features.codeNexus.description')}
                        delay={0.1}
                    />
                    <FeatureCard
                        icon={Trophy}
                        title={t('landing.features.incentive.title')}
                        description={t('landing.features.incentive.description')}
                        delay={0.2}
                    />
                    <FeatureCard
                        icon={MessageSquare}
                        title={t('landing.features.chat.title')}
                        description={t('landing.features.chat.description')}
                        delay={0.3}
                    />
                    <FeatureCard
                        icon={Building}
                        title={t('landing.features.orgHub.title')}
                        description={t('landing.features.orgHub.description')}
                        delay={0.4}
                    />
                    <FeatureCard
                        icon={Users}
                        title={t('landing.features.discovery.title')}
                        description={t('landing.features.discovery.description')}
                        delay={0.5}
                    />
                    <FeatureCard
                        icon={Zap}
                        title={t('landing.features.sync.title')}
                        description={t('landing.features.sync.description')}
                        delay={0.6}
                    />
                </div>
            </section>
        </div>
    );
}
