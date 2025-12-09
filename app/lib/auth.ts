// app/lib/auth.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- Helper Functions for Client-Side Storage ---

export const logout = () => {
    localStorage.removeItem('token');
};

export const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

export const getAuthHeaders = (): HeadersInit => {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// --- API Functions (Authentication & Sync) ---

// Real Login API Call (existing)
export const login = async (email: string, password: string): Promise<void> => {
    // ... (existing login logic)
    const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed.');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token); // Store the REAL token
};

// Real Register API Call (existing)
export const register = async (email: string, password: string, userType: 'BRAND' | 'INFLUENCER' | 'ADMIN'): Promise<void> => {
    // ... (existing register logic)
    const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userType }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed.');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token); // Store the REAL token
};


// Function to call the sync endpoint (existing)
export const syncSocialAccount = async (platform: string) => {
    const response = await fetch(`${API_URL}/api/social/sync/${platform}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to sync ${platform}`);
    }

    return response.json();
};

// 🚀 NEW FUNCTION: Fetch Social Account Details
export const fetchAccountDetails = async (platform: string) => {
    const response = await fetch(`${API_URL}/api/social/account/${platform}`, {
        method: 'GET',
        headers: getAuthHeaders(), // Only Authorization header needed
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch ${platform} account details.`);
    }

    return response.json();
};