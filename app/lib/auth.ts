// app/lib/auth.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- Helper Functions for Client-Side Storage ---

// NOTE: This function is kept ONLY for the legacy social callback flow which requires 
// the JWT in a query parameter for backend verification (handleCallback).
export const getClientToken = (): string | null => {
    // Assuming you use localStorage for this specific, temporary purpose.
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
};

// --- API Functions (Authentication & Sync) ---

// @desc Login: Sets HTTP-only cookie on the client
export const login = async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // CRITICAL: Sends and receives cookies
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed.');
    }
    await response.json(); // Consumes body, but ignores token field.
};

// @desc Register: Sets HTTP-only cookie on the client
export const register = async (email: string, password: string, userType: 'BRAND' | 'INFLUENCER' | 'ADMIN'): Promise<void> => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, userType }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed.');
    }
    await response.json();
};

// @desc Sync: Calls a protected route
export const syncSocialAccount = async (platform: string) => {
    const response = await fetch(`${API_URL}/api/social/sync/${platform}`, {
        method: 'POST',
        credentials: 'include', // Sends HTTP-only cookie
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to sync ${platform}`);
    }

    return response.json();
};

// @desc Fetch Details: Calls a protected route
export const fetchAccountDetails = async (platform: string) => {
    const response = await fetch(`${API_URL}/api/social/account/${platform}`, {
        method: 'GET',
        credentials: 'include', // Sends HTTP-only cookie
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch ${platform} account details.`);
    }

    return response.json();
};

// @desc Logout: Clears HTTP-only cookie on the backend
export const handleBackendLogout = async () => {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Sends HTTP-only cookie to be cleared
    });

    if (!response.ok) {
        console.error("Backend logout failed, proceeding with client clear.");
    }
    // The backend clears the actual HTTP-only cookie.
};

// @desc Utility: Function to handle social login with ID token (if using POST /api/auth/google)
// NOTE: This function is not used in the current UserStatus.tsx due to the redirection flow.
export const socialLoginWithIdToken = async (idToken: string, userType: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/auth/google`, { // POST route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken, userType }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Social Login failed.');
    }
    await response.json();
};