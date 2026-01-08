import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GitHubUser {
    login: string;
    id: number;
    avatar_url: string;
    name: string | null;
    email: string | null;
}

interface MatrixCredentials {
    user_id: string;
    access_token: string;
    device_id: string;
    homeserver_url: string;
}

interface AuthState {
    isAuthenticated: boolean;
    githubToken: string | null;
    user: GitHubUser | null;
    matrixCredentials: MatrixCredentials | null;

    // Actions
    login: (githubToken: string, user: GitHubUser, matrixCredentials: MatrixCredentials) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            githubToken: null,
            user: null,
            matrixCredentials: null,

            login: (githubToken, user, matrixCredentials) =>
                set({
                    isAuthenticated: true,
                    githubToken,
                    user,
                    matrixCredentials,
                }),

            logout: () =>
                set({
                    isAuthenticated: false,
                    githubToken: null,
                    user: null,
                    matrixCredentials: null,
                }),
        }),
        {
            name: 'op-web-auth',
        }
    )
);
