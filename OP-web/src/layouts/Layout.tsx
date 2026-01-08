import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Github, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const NavLink = ({ to, children, active }: { to: string; children: React.ReactNode; active: boolean }) => (
    <Link
        to={to}
        className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${active ? "text-primary" : "text-gray-600 hover:text-primary"}`}
    >
        {children}
        {active && (
            <motion.div
                layoutId="navbar-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        )}
    </Link>
);

export default function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const { t } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isAuthenticated, user, logout } = useAuthStore();

    const navItems = [
        { name: t('nav.discover'), path: '/discover' },
        { name: t('nav.explore'), path: '/explore' },
        { name: t('nav.hub'), path: '/chat' },
    ];

    if (isAuthenticated) {
        navItems.splice(1, 0, { name: t('nav.profile'), path: '/profile' });
    }

    return (
        <div className="min-h-screen flex flex-col bg-background text-gray-900">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-border bg-white/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight group">
                            <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                ⚡
                            </span>
                            <span className="gradient-text">OpenSource Hub</span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <NavLink key={item.path} to={item.path} active={location.pathname === item.path}>
                                    {item.name}
                                </NavLink>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            <LanguageSwitcher />
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-primary transition-colors"
                            >
                                <Github className="w-5 h-5" />
                            </a>

                            {isAuthenticated ? (
                                <div className="flex items-center gap-3">
                                    <Link to="/profile" className="flex items-center gap-2">
                                        <img
                                            src={user?.avatar_url}
                                            alt={user?.login}
                                            className="w-8 h-8 rounded-full border-2 border-primary/30"
                                        />
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="text-gray-400 hover:text-primary transition-colors"
                                        title={t('auth.logout')}
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/auth"
                                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-medium transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                                >
                                    {t('auth.login')}
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-gray-600 hover:text-primary p-2"
                            >
                                {isMobileMenuOpen ? <X /> : <Menu />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white/95 border-b border-border backdrop-blur-xl"
                    >
                        <div className="px-4 py-4 space-y-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-primary/5"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </nav>

            {/* Content */}
            <main className="flex-1 pt-16">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-white py-12 mt-20">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
                    <p>© 2026 OpenSource Hub. Built for OpenSource, by OpenSource.</p>
                </div>
            </footer>
        </div>
    );
}
