'use client';

import React, { useState, useEffect } from 'react';
import { login, register, logout, getToken, syncSocialAccount } from '../lib/auth';

// Environment variables
const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const META_REDIRECT_BASE = process.env.NEXT_PUBLIC_META_REDIRECT_BASE;
const LINKEDIN_CLIENT_ID = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
const LINKEDIN_REDIRECT_URI = process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI;

// Generate a simple random state for CSRF protection
const generateState = () => {
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('oauth_state', state);
    return state;
};

/**
 * Handles the redirect to Meta for both Instagram and Facebook.
 */
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

/**
 * Handles LinkedIn OAuth redirect — Fixed for 2025 OpenID Connect
 */
const handleConnectLinkedIn = () => {
    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_REDIRECT_URI) {
        alert("ERROR: LinkedIn credentials not configured in .env.local");
        return;
    }

    const state = generateState();
    const scopes = 'openid profile email';  // Only these — no r_ scopes

    const linkedInUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code` +
        `&client_id=${LINKEDIN_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}` +
        `&scope=${scopes}` +  // Space separated, no encoding needed for scope
        `&state=${state}`;

    console.log('LinkedIn Auth URL:', linkedInUrl); // Debug ke liye — check console
    window.location.href = linkedInUrl;
};

// =================================================================
// MAIN COMPONENT
// =================================================================

export default function UserStatus() {
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState('influencer@test.com');
    const [password, setPassword] = useState('123456');
    const [userType, setUserType] = useState<'BRAND' | 'INFLUENCER' | 'ADMIN'>('INFLUENCER');
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setToken(getToken());
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
        } catch (error: any) {
            alert(`Authentication Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        setToken(null);
    };

    const handleSync = async (platform: 'instagram' | 'facebook' | 'linkedin') => {
        if (!token) {
            alert("Please login first.");
            return;
        }
        try {
            const result = await syncSocialAccount(platform);
            alert(`${platform.charAt(0).toUpperCase() + platform.slice(1)} sync successful!`);
            console.log('Sync result:', result);
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