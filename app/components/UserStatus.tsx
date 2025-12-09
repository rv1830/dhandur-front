'use client';

import React, { useState, useEffect } from 'react';
// 💡 fetchAccountDetails को lib/auth.ts से इंपोर्ट करें (जिसे आपने पिछले चरण में जोड़ा था)
import { login, register, logout, getToken, syncSocialAccount, fetchAccountDetails } from '../lib/auth'; 

// Environment variables (unchanged)
const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const META_REDIRECT_BASE = process.env.NEXT_PUBLIC_META_REDIRECT_BASE;
const LINKEDIN_CLIENT_ID = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
const LINKEDIN_REDIRECT_URI = process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI;

// Generate a simple random state for CSRF protection (unchanged)
const generateState = () => {
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('oauth_state', state);
    return state;
};

// --- Redirect Handlers (unchanged, assuming .env points to localhost:3000) ---
const handleConnectMeta = (platform: 'instagram' | 'facebook') => {
    if (!META_APP_ID || !META_REDIRECT_BASE) {
        alert("ERROR: Please configure Meta credentials in .env.local");
        return;
    }

    const state = generateState();
    const scopes = platform === 'instagram'
        ? 'public_profile,email,pages_show_list,instagram_basic,instagram_manage_insights,business_management'
        : 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts';

    const redirectUri = `${META_REDIRECT_BASE}/${platform}`; 

    const dialogUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${META_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${scopes}` +
        `&response_type=code` +
        `&state=${state}`;

    window.location.href = dialogUrl;
};

const handleConnectLinkedIn = () => {
    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_REDIRECT_URI) {
        alert("ERROR: LinkedIn credentials not configured in .env.local");
        return;
    }

    const state = generateState();
    const scopes = 'openid profile email';  

    const linkedInUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code` +
        `&client_id=${LINKEDIN_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}` +
        `&scope=${scopes}` +  
        `&state=${state}`;

    console.log('LinkedIn Auth URL:', linkedInUrl); 
    window.location.href = linkedInUrl;
};

// =================================================================
// 🚀 NEW COMPONENT: SocialProfileDisplay (Data Fetching and Display)
// =================================================================
interface SocialAccountData {
    platform: string;
    profileName: string;
    followersCount: number;
    lastSynced: string;
}

const SocialProfileDisplay = ({ platform }: { platform: 'linkedin' | 'instagram' | 'facebook' }) => {
    const [data, setData] = useState<SocialAccountData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Call the new GET API route
            const result = await fetchAccountDetails(platform);
            setData(result);
        } catch (err: any) {
            // Handle 404 (Not Connected) gracefully
            if (err.message.includes('404')) {
                setError(`${platform.charAt(0).toUpperCase() + platform.slice(1)} not connected.`);
            } else {
                setError(`Failed to load data: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load data on component mount/reload
        loadData();
    }, [platform]);

    if (loading) return <div style={{ padding: '10px', color: '#0A66C2' }}>Loading {platform} data...</div>;
    
    // Display if not connected
    if (error && error.includes('not connected')) return <div style={{ color: '#888', padding: '10px', border: '1px dashed #ccc', borderRadius: '5px', marginTop: '10px' }}>{error}</div>;
    if (error) return <div style={{ color: '#f44336', padding: '10px', border: '1px solid #f44336', borderRadius: '5px', marginTop: '10px' }}>Error: {error}</div>;
    if (!data) return null;

    // Display Data
    const icon = {
        'linkedin': '💼',
        'instagram': '📸',
        'facebook': '📘'
    }[platform];

    return (
        <div style={{ border: '1px solid #0A66C2', padding: '15px', borderRadius: '8px', marginTop: '15px', background: '#e6f7ff' }}>
            <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icon} {data.profileName || data.platform}
            </h4>
            <p style={{ margin: '5px 0', fontSize: '1.1em', fontWeight: 'bold' }}>
                Followers/Page Likes: {data.followersCount.toLocaleString()}
            </p>
            <p style={{ margin: '0', fontSize: '0.8em', color: '#666' }}>
                Last Synced: {new Date(data.lastSynced).toLocaleString()}
            </p>
        </div>
    );
};


// =================================================================
// MAIN COMPONENT (UserStatus)
// =================================================================

export default function UserStatus() {
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState('influencer@test.com');
    const [password, setPassword] = useState('123456');
    const [userType, setUserType] = useState<'BRAND' | 'INFLUENCER' | 'ADMIN'>('INFLUENCER');
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);

    // Key to force reload SocialProfileDisplay components after a sync or redirect
    const [syncKey, setSyncKey] = useState(0); 
    
    useEffect(() => {
        setToken(getToken());

        // Check for success redirect from backend (after OAuth flow)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('sync_status')) {
            alert(`Sync Success: ${urlParams.get('sync_status')}`);
            // Force re-render of profile section to fetch new data
            setSyncKey(prev => prev + 1); 
            // Clean up the URL (remove the query parameter)
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleAuth = async () => {
        setLoading(true);
        try {
            if (authMode === 'register') {
                await register(email, password, userType);
                alert("Registration Successful!");
            } else {
                await login(email, password);
                alert("Login Successful!");
            }
            setToken(getToken());
            setSyncKey(prev => prev + 1); // Reload profiles after successful login/registration
        } catch (error: any) {
            alert(`Authentication Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        setToken(null);
        setSyncKey(0); // Reset profile view
    };

    const handleSync = async (platform: 'instagram' | 'facebook' | 'linkedin') => {
        if (!token) {
            alert("Please login first.");
            return;
        }
        try {
            await syncSocialAccount(platform);
            alert(`${platform.charAt(0).toUpperCase() + platform.slice(1)} sync successful!`);
            setSyncKey(prev => prev + 1); // Force reload profile data after manual sync
        } catch (error: any) {
            alert(`Sync Failed: ${error.message}`);
        }
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>🚀 Dhanur Frontend Tester</h2>
            <hr />

            {token ? (
                <div>
                    <h3>✅ Logged In Successfully</h3>
                    <p><strong>JWT:</strong> {token.substring(0, 30)}...</p>
                    <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px' }}>
                        Logout
                    </button>
                    <hr />

                    <h3>🔗 Connect Social Accounts</h3>
                    <p>As <strong>{userType}</strong></p>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', margin: '20px 0' }}>
                        <button onClick={() => handleConnectMeta('instagram')} style={{ padding: '15px', background: '#E4405F', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                            📸 Connect Instagram
                        </button>
                        <button onClick={() => handleConnectMeta('facebook')} style={{ padding: '15px', background: '#1877F2', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                            📘 Connect Facebook Page
                        </button>
                        <button onClick={handleConnectLinkedIn} style={{ padding: '15px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                            💼 Connect LinkedIn
                        </button>
                    </div>

                    <hr />

                    <h3>📊 Connected Profiles</h3>
                    {/* 🚀 PROFILES SECTION: Key forces re-render when syncKey changes */}
                    <div key={syncKey} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <SocialProfileDisplay platform="linkedin" />
                        <SocialProfileDisplay platform="instagram" />
                        <SocialProfileDisplay platform="facebook" />
                    </div>
                    
                    <hr style={{ marginTop: '20px' }}/>

                    <h4>🔄 Manual Sync</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => handleSync('instagram')} style={{ padding: '10px 15px', background: '#2196F3', color: 'white', border: 'none' }}>
                            Sync Instagram
                        </button>
                        <button onClick={() => handleSync('facebook')} style={{ padding: '10px 15px', background: '#2196F3', color: 'white', border: 'none' }}>
                            Sync Facebook
                        </button>
                        <button onClick={() => handleSync('linkedin')} style={{ padding: '10px 15px', background: '#2196F3', color: 'white', border: 'none' }}>
                            Sync LinkedIn
                        </button>
                    </div>
                </div>
            ) : (
                // --- Login / Register Section (unchanged) ---
                <div>
                    <h3>{authMode === 'login' ? 'Login' : 'Register'}</h3>
                    {authMode === 'register' && (
                        <select value={userType} onChange={(e) => setUserType(e.target.value as any)} style={{ width: '100%', padding: '10px', margin: '10px 0' }}>
                            <option value="INFLUENCER">Influencer</option>
                            <option value="BRAND">Brand</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    )}
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', margin: '10px 0' }} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', margin: '10px 0' }} />
                    <button onClick={handleAuth} disabled={loading} style={{ width: '100%', padding: '15px', background: '#4CAF50', color: 'white', border: 'none', margin: '10px 0' }}>
                        {loading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Register')}
                    </button>
                    <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ width: '100%', padding: '10px', background: '#ddd', border: 'none' }}>
                        Switch to {authMode === 'login' ? 'Register' : 'Login'}
                    </button>
                </div>
            )}
        </div>
    );
}