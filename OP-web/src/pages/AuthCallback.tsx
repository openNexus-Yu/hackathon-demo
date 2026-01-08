import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const BACKEND_URL = 'http://localhost:3000';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const hasStartedRef = useRef(false);  // 使用useRef更可靠

    useEffect(() => {
        // 防止重复执行 - 使用useRef在React Strict Mode下也有效
        if (hasStartedRef.current) {
            console.log('[Auth] Already started, skipping duplicate call');
            return;
        }
        hasStartedRef.current = true;
        console.log('[Auth] Starting authentication flow');

        const code = searchParams.get('code');

        if (!code) {
            setStatus('error');
            setErrorMessage('No authorization code received.');
            return;
        }

        const exchangeCode = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/auth/github/callback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code }),
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`Authentication failed: ${errorData}`);
                }

                const data = await response.json();

                // Store credentials
                login(data.github_token, data.user, data.matrix_credentials);

                setStatus('success');

                // Redirect to profile after a short delay
                setTimeout(() => navigate('/profile'), 1500);

            } catch (err) {
                console.error('Auth error:', err);
                setStatus('error');
                setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
            }
        };

        exchangeCode();
    }, [searchParams, login, navigate]);  // 移除hasStarted依赖

    return (
        <div className="min-h-screen flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-3xl p-12 text-center max-w-md"
            >
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
                        <h2 className="text-2xl font-bold mb-2">Authenticating...</h2>
                        <p className="text-gray-400">Connecting your GitHub account</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-glow">
                            <CheckCircle2 className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 gradient-text">Welcome!</h2>
                        <p className="text-gray-400">Redirecting to your profile...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
                        <p className="text-gray-400 mb-6">{errorMessage}</p>
                        <button
                            onClick={() => navigate('/auth')}
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            Try Again
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
