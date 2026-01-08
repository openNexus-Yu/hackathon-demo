import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Loader2, ArrowLeft, ExternalLink, Copy, Check,
    Github, MessageSquare, Key, User, Server
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import CryptoJS from 'crypto-js';

// Organization to Matrix space mapping (space_id format: !xxx:localhost)
const orgRoomMapping: Record<string, string> = {
    polkadot: "#polkadot:localhost",
    openai: "#openai:localhost",
    react: "#reactjs:localhost",
    vercel: "#vercel:localhost",
    "rust-lang": "#rust:localhost",
    vuejs: "#vuejs:localhost",
    // Real organizations will be dynamically mapped
    "opennexus-yu": "#OpenNexus-Yu:localhost",
};

// Generate Cinny URL for organization space lobby
function getOrgSpaceUrl(orgId: string): string {
    // Try to get room alias from mapping
    const roomAlias = orgRoomMapping[orgId];
    if (roomAlias) {
        // For spaces, go to lobby; for rooms, go to room directly
        return `http://localhost:3001/#/${encodeURIComponent(roomAlias)}/lobby`;
    }
    // Default: use orgId as room alias
    const defaultAlias = `#${orgId}:localhost`;
    return `http://localhost:3001/#/${encodeURIComponent(defaultAlias)}/lobby`;
}

// Compute Matrix password from GitHub ID
function computeMatrixPassword(githubId: number, clientSecret: string): string {
    const message = `${githubId}-${clientSecret}`;
    return CryptoJS.SHA256(message).toString();
}

// GitHub Client Secret (should match backend)
const GITHUB_CLIENT_SECRET = '2620496c4ad1ede0ec0c695ed99e9b0fbe9ac39a';

type ChatStep = 'checking' | 'not-logged-in' | 'show-credentials' | 'cinny';

export default function Chat() {
    const { orgId } = useParams<{ orgId: string }>();
    const { isAuthenticated, user } = useAuthStore();

    const [step, setStep] = useState<ChatStep>('checking');
    const [copied, setCopied] = useState(false);
    const [matrixCredentials, setMatrixCredentials] = useState<{
        username: string;
        password: string;
        homeserver: string;
    } | null>(null);

    const matrixRoom = orgId ? orgRoomMapping[orgId] : null;
    const cinnyUrl = orgId
        ? getOrgSpaceUrl(orgId)
        : 'http://localhost:3001';

    useEffect(() => {
        // Check authentication status
        if (!isAuthenticated || !user) {
            setStep('not-logged-in');
            return;
        }

        // Compute Matrix credentials
        const username = user.login.toLowerCase().replace(/[^a-z0-9._=-]/g, '');
        const password = computeMatrixPassword(user.id, GITHUB_CLIENT_SECRET);

        setMatrixCredentials({
            username,
            password,
            homeserver: 'http://localhost:8008',
        });

        setStep('show-credentials');
    }, [isAuthenticated, user]);

    const copyPassword = async () => {
        if (!matrixCredentials) return;

        try {
            await navigator.clipboard.writeText(matrixCredentials.password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const openCinny = () => {
        setStep('cinny');
    };

    // Step 1: Checking auth status
    if (step === 'checking') {
        return (
            <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-500">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Step 2: Not logged in - show connect button
    if (step === 'not-logged-in') {
        return (
            <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Join the Conversation</h1>
                    <p className="text-gray-500 mb-8">
                        Connect your GitHub account to access the chat rooms and connect with the community.
                    </p>
                    <Link
                        to="/auth"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
                    >
                        <Github className="w-5 h-5" />
                        Connect with GitHub
                    </Link>
                    {orgId && (
                        <p className="mt-4 text-sm text-gray-400">
                            You'll be able to join the {orgId.charAt(0).toUpperCase() + orgId.slice(1)} chat room after connecting.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Step 3: Show Matrix credentials
    if (step === 'show-credentials' && matrixCredentials) {
        return (
            <div className="h-[calc(100vh-64px)] flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-4">
                    {orgId && (
                        <Link to={`/org/${orgId}`} className="text-gray-500 hover:text-primary">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    )}
                    <h1 className="font-bold text-gray-900">
                        {orgId ? `${orgId.charAt(0).toUpperCase() + orgId.slice(1)} Chat Room` : 'Community Chat'}
                    </h1>
                </div>

                {/* Credentials Card */}
                <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
                    <div className="w-full max-w-lg">
                        <div className="card p-8">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Key className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Your Chat Credentials</h2>
                                <p className="text-gray-500 text-sm">
                                    Use these credentials to log into the Cinny chat client
                                </p>
                            </div>

                            <div className="space-y-4 mb-8">
                                {/* Homeserver */}
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Server className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-500">Homeserver</span>
                                    </div>
                                    <code className="text-gray-900 font-mono text-sm">{matrixCredentials.homeserver}</code>
                                </div>

                                {/* Username */}
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-500">Username</span>
                                    </div>
                                    <code className="text-gray-900 font-mono text-sm">{matrixCredentials.username}</code>
                                </div>

                                {/* Password */}
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <Key className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-500">Password</span>
                                        </div>
                                        <button
                                            onClick={copyPassword}
                                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all ${copied
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                                                }`}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    Copy
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <code className="text-gray-900 font-mono text-xs break-all block">
                                        {matrixCredentials.password}
                                    </code>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={openCinny}
                                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <MessageSquare className="w-5 h-5" />
                                Open Cinny Chat
                                <ExternalLink className="w-4 h-4" />
                            </button>

                            <p className="mt-4 text-center text-xs text-gray-400">
                                Copy the password first, then paste it in Cinny's login page
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 4: Show Cinny iframe
    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setStep('show-credentials')}
                        className="text-gray-500 hover:text-primary"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-gray-900">
                            {orgId ? `${orgId.charAt(0).toUpperCase() + orgId.slice(1)} Chat Room` : 'Community Chat'}
                        </h1>
                        {matrixRoom && (
                            <p className="text-xs text-gray-500">{matrixRoom}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setStep('show-credentials')}
                        className="text-sm text-gray-500 hover:text-primary flex items-center gap-1"
                    >
                        <Key className="w-4 h-4" />
                        Show Credentials
                    </button>
                    <a
                        href={cinnyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary flex items-center gap-1 hover:underline"
                    >
                        Open in new tab <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* Chat Frame */}
            <div className="flex-1 relative bg-gray-50">
                <iframe
                    src={cinnyUrl}
                    className="w-full h-full border-0"
                    title="Cinny Chat"
                />
            </div>
        </div>
    );
}
