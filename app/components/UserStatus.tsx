// UserStatus.tsx (or your main frontend file)
'use client';

import React, { useState, useEffect } from 'react';
import { 
    login, 
    register, 
    handleBackendLogout, 
    syncSocialAccount, 
    fetchAccountDetails,
    getClientToken // Temporary utility for social callback
} from '../lib/auth'; 
import { useRouter } from 'next/navigation'; 

// Environment variables (ASSUMED to be set correctly in .env.local)
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const META_REDIRECT_BASE = process.env.NEXT_PUBLIC_META_REDIRECT_BASE;
const LINKEDIN_CLIENT_ID = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
const LINKEDIN_REDIRECT_URI = process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const YOUTUBE_REDIRECT_URI = process.env.NEXT_PUBLIC_YOUTUBE_REDIRECT_URI;
const SNAPCHAT_CLIENT_ID = process.env.NEXT_PUBLIC_SNAPCHAT_CLIENT_ID;
const SNAPCHAT_REDIRECT_URI = process.env.NEXT_PUBLIC_SNAPCHAT_REDIRECT_URI;
const TWITTER_CLIENT_ID = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
const TWITTER_REDIRECT_URI = process.env.NEXT_PUBLIC_TWITTER_REDIRECT_URI;


// --- UTILITIES (PKCE, State, etc.) ---
const generateState = () => { /* ... unchanged logic ... */
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('oauth_state', state);
    return state;
};
const base64UrlEncode = (array: Uint8Array) => { /* ... unchanged logic ... */
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};
const generatePkce = async () => { /* ... unchanged logic ... */
    const codeVerifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = base64UrlEncode(new Uint8Array(hash));
    return { codeVerifier, codeChallenge };
};
// --- END UTILITIES ---


// --- 🛑 NEW/UPDATED: Social LOGIN Handlers (Redirects to Backend Auth routes) ---
const handleGoogleLogin = (userType: string) => {
    if (!GOOGLE_CLIENT_ID || !API_URL) {
        alert("ERROR: Google credentials not configured.");
        return;
    }
    const state = generateState();
    const scopes = 'openid profile email'; 
    
    // Redirecting user to backend's login initiation route (router.get('/google'))
    // Backend will then handle the full Google OAuth redirection flow.
    const googleLoginUrl = `${API_URL}/api/auth/google?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(API_URL)}/api/auth/google/callback&scope=${encodeURIComponent(scopes)}&state=${state}&prompt=select_account`;
    
    window.location.href = googleLoginUrl;
};

const handleLinkedInLogin = () => {
    if (!LINKEDIN_CLIENT_ID || !API_URL) {
        alert("ERROR: LinkedIn credentials not configured.");
        return;
    }
    // Redirecting user to backend's login initiation route (router.get('/linkedin'))
    const state = generateState();
    const scopes = 'openid profile email';  

    const linkedInUrl = `${API_URL}/api/auth/linkedin?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(API_URL)}/api/auth/linkedin/callback&scope=${scopes}&state=${state}`;

    window.location.href = linkedInUrl;
};
// --- END Social LOGIN Handlers ---


// --- Social CONNECT Handlers (For linking AFTER initial login) ---
const handleConnectMeta = (platform: 'instagram' | 'facebook') => { /* ... unchanged logic ... */
    if (!META_APP_ID || !META_REDIRECT_BASE) { alert("ERROR: Please configure Meta credentials in .env.local"); return; }
    const state = generateState();
    const scopes = platform === 'instagram' ? 'public_profile,email,pages_show_list,instagram_basic,instagram_manage_insights,business_management' : 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts';
    const redirectUri = `${META_REDIRECT_BASE}/${platform}`; 

    const dialogUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${META_APP_ID}` + `&redirect_uri=${encodeURIComponent(redirectUri)}` + `&scope=${scopes}` +
        `&response_type=code` + `&state=${state}`;
    window.location.href = dialogUrl;
};

const handleConnectLinkedIn = () => { /* ... unchanged logic ... */
    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_REDIRECT_URI) { alert("ERROR: LinkedIn credentials not configured in .env.local"); return; }
    const state = generateState();
    const scopes = 'openid profile email';  
    const linkedInUrl = `https://www.linkedin.com/oauth/v2/authorization?` + `response_type=code` + `&client_id=${LINKEDIN_CLIENT_ID}` + `&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}` + `&scope=${scopes}` + `&state=${state}`;
    window.location.href = linkedInUrl;
};

const handleConnectYoutube = () => { /* ... unchanged logic ... */
    if (!GOOGLE_CLIENT_ID || !YOUTUBE_REDIRECT_URI) { alert("ERROR: YouTube credentials not configured in .env.local"); return; }
    const state = generateState();
    const scopes = 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly';
    const youtubeUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + `client_id=${GOOGLE_CLIENT_ID}` + `&redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT_URI)}` + `&response_type=code` + `&scope=${encodeURIComponent(scopes)}` + `&access_type=offline` + `&state=${state}`;
    window.location.href = youtubeUrl;
};

const handleConnectSnapchat = async () => { /* ... unchanged logic ... */
    if (!SNAPCHAT_CLIENT_ID || !SNAPCHAT_REDIRECT_URI) { alert("ERROR: Snapchat credentials not configured in .env.local"); return; }
    const state = generateState();
    const { codeVerifier, codeChallenge } = await generatePkce();
    localStorage.setItem('snapchat_code_verifier', codeVerifier);
    const scopes = 'https://auth.snapchat.com/oauth2/api/user.display_name https://auth.snapchat.com/oauth2/api/user.external_id https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar'; 
    const snapchatUrl = `https://accounts.snapchat.com/login/oauth2/authorize?` + `client_id=${SNAPCHAT_CLIENT_ID}` + `&redirect_uri=${encodeURIComponent(SNAPCHAT_REDIRECT_URI)}` + `&response_type=code` + `&scope=${encodeURIComponent(scopes)}` + `&state=${state}` + `&code_challenge=${codeChallenge}` + `&code_challenge_method=S256`; 
    window.location.href = snapchatUrl;
};

const handleConnectTwitter = async () => { /* ... unchanged logic ... */
    if (!TWITTER_CLIENT_ID || !TWITTER_REDIRECT_URI) { alert("ERROR: Twitter credentials not configured in .env.local"); return; }
    const state = generateState();
    const { codeVerifier, codeChallenge } = await generatePkce();
    localStorage.setItem('twitter_code_verifier', codeVerifier); 
    const scopes = 'users.read tweet.read followers.read offline.access'; 
    const twitterUrl = `https://twitter.com/i/oauth2/authorize?` + `response_type=code` + `&client_id=${TWITTER_CLIENT_ID}` + `&redirect_uri=${encodeURIComponent(TWITTER_REDIRECT_URI)}` + `&scope=${encodeURIComponent(scopes)}` + `&state=${state}` + `&code_challenge=${codeChallenge}` + `&code_challenge_method=S256`;    
    window.location.href = twitterUrl;
};


// --- Social Profile Display (unchanged) ---
interface SocialAccountData { platform: string; profileName: string; followersCount: number; lastSynced: string; }
const ALL_PLATFORMS = ['linkedin', 'instagram', 'facebook', 'youtube', 'snapchat', 'twitter'] as const;
type PlatformKey = typeof ALL_PLATFORMS[number];
const SocialProfileDisplay = ({ platform }: { platform: PlatformKey }) => {
    const [data, setData] = useState<SocialAccountData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true); setError(null);
        try {
            const result = await fetchAccountDetails(platform);
            setData(result); 
        } catch (err: any) {
            if (err.message.includes('404')) { setError(`${platform.charAt(0).toUpperCase() + platform.slice(1)} not connected.`); } 
            else if (err.message.includes('401')) { setError(`Authentication required. Please re-login.`); } 
            else { setError(`Failed to load data: ${err.message}`); }
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && window.document.cookie.includes('token')) {
             loadData();
        } else {
             setLoading(false); setError("Not logged in (Cookie missing).");
        }
    }, [platform]);

    if (loading) return <div style={{ padding: '10px', color: '#0A66C2' }}>Loading {platform} data...</div>;
    if (error && error.includes('not connected')) return <div style={{ color: '#888', padding: '10px', border: '1px dashed #ccc', borderRadius: '5px', marginTop: '10px' }}>{error}</div>;
    if (error) return <div style={{ color: '#f44336', padding: '10px', border: '1px solid #f44336', borderRadius: '5px', marginTop: '10px' }}>Error: {error}</div>;
    if (!data || !data.platform) return null;

    const icon = { 'linkedin': '💼', 'instagram': '📸', 'facebook': '📘', 'youtube': '▶️', 'snapchat': '👻', 'twitter': '🐦' }[platform];

    return (
        <div style={{ border: '1px solid #0A66C2', padding: '15px', borderRadius: '8px', marginTop: '15px', background: '#e6f7ff' }}>
            <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icon} {data.profileName || data.platform.charAt(0).toUpperCase() + data.platform.slice(1)}
            </h4>
            <p style={{ margin: '5px 0', fontSize: '1.1em', fontWeight: 'bold' }}>
                Followers/Page Likes: {data.followersCount ? data.followersCount.toLocaleString() : 'N/A'}
            </p>
            <p style={{ margin: '0', fontSize: '0.8em', color: '#666' }}>
                Last Synced: {new Date(data.lastSynced).toLocaleString()}
            </p>
        </div>
    );
};


// =================================================================
// 🚀 NEW: AuthUtilitiesForm (OTP and Reset Password UI)
// =================================================================
const AuthUtilitiesForm = () => {
    const [utilMode, setUtilMode] = useState<'otp_send' | 'otp_verify' | 'reset_send' | 'reset_password'>('otp_send');
    const [input1, setInput1] = useState(''); // Email or Phone
    const [input2, setInput2] = useState(''); // OTP or Code, New Password
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUtilityAction = async () => {
        setLoading(true); setMessage('');
        try {
            let endpoint = ''; let body: any = {};
            // ... (Endpoint and body logic based on utilMode) ...
            if (utilMode === 'otp_send') { endpoint = '/api/auth/otp/send'; body = { phoneNumber: input1 }; } 
            else if (utilMode === 'otp_verify') { endpoint = '/api/auth/otp/verify'; body = { phoneNumber: input1, otp: input2 }; } 
            else if (utilMode === 'reset_send') { endpoint = '/api/auth/reset/send'; body = { email: input1 }; } 
            else if (utilMode === 'reset_password') { endpoint = '/api/auth/reset'; 
                const parts = input2.split(',').map(s => s.trim());
                if (parts.length < 2) throw new Error('Format: Code, NewPassword');
                body = { email: input1, resetCode: parts[0], newPassword: parts[1] };
            }

            const response = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
            const data = await response.json();

            if (response.ok) {
                setMessage(`Success! ${data.message || 'Action completed.'}`);
                if (utilMode === 'otp_verify' || utilMode === 'reset_password') {
                    // Force reload to check the new/cleared cookie status
                    window.location.reload(); 
                }
            } else {
                setMessage(`Error: ${data.message || 'Operation failed.'}`);
            }
        } catch (error: any) { setMessage(`Fatal Error: ${error.message}`); } finally { setLoading(false); }
    };
    
    // ... (rest of the render logic for AuthUtilitiesForm) ...
    const getButtonText = () => {
        switch (utilMode) {
            case 'otp_send': return 'Send OTP';
            case 'otp_verify': return 'Verify OTP & Login';
            case 'reset_send': return 'Send Reset Code';
            case 'reset_password': return 'Reset Password';
        }
    };
    const getInput1Placeholder = () => {
        if (utilMode.includes('otp')) return 'Phone Number (+91...)';
        if (utilMode.includes('reset')) return 'Email Address';
        return '';
    };
    const getInput2Placeholder = () => {
        if (utilMode === 'otp_verify') return '6-Digit OTP Code';
        if (utilMode === 'reset_password') return 'Code, NewPassword (e.g., 123456, newpass123)';
        return 'N/A';
    };

    return (
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginTop: '20px', background: '#f9f9f9' }}>
            <h4>⚙️ Auth Utilities (OTP/Reset)</h4>
            <select value={utilMode} onChange={(e) => {setUtilMode(e.target.value as any); setInput1(''); setInput2(''); setMessage('');}} style={{ width: '100%', padding: '8px', margin: '8px 0' }}>
                <option value="otp_send">Send OTP (Phone)</option>
                <option value="otp_verify">Verify OTP & Login</option>
                <option value="reset_send">Send Password Reset Code</option>
                <option value="reset_password">Confirm Password Reset</option>
            </select>
            <input type="text" placeholder={getInput1Placeholder()} value={input1} onChange={(e) => setInput1(e.target.value)} style={{ width: '100%', padding: '8px', margin: '8px 0' }} />
            {(utilMode === 'otp_verify' || utilMode === 'reset_password') && (
                <input type="text" placeholder={getInput2Placeholder()} value={input2} onChange={(e) => setInput2(e.target.value)} style={{ width: '100%', padding: '8px', margin: '8px 0' }} />
            )}
            <button onClick={handleUtilityAction} disabled={loading || !input1} style={{ width: '100%', padding: '10px', background: '#FF9800', color: 'white', border: 'none', margin: '8px 0' }}>
                {loading ? 'Sending...' : getButtonText()}
            </button>
            {message && <p style={{ color: message.startsWith('Error') ? 'red' : 'green', fontSize: '0.9em' }}>{message}</p>}
        </div>
    );
};


// =================================================================
// MAIN COMPONENT (UserStatus) 
// =================================================================

export default function UserStatus() {
    const [isLoggedIn, setIsLoggedIn] = useState(false); 
    const [email, setEmail] = useState('influencer@test.com');
    const [password, setPassword] = useState('123456');
    const [userType, setUserType] = useState<'BRAND' | 'INFLUENCER' | 'ADMIN'>('INFLUENCER');
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const router = useRouter(); 
    const [syncKey, setSyncKey] = useState(0); 

    const checkLoginStatus = () => {
        if (typeof window !== 'undefined') {
            // Checks for the existence of the HTTP-only cookie
            return window.document.cookie.includes('token');
        }
        return false;
    };
    
    useEffect(() => {
        setIsLoggedIn(checkLoginStatus());

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('sync_status') || urlParams.get('token_set')) {
            // Success response from LinkedIn Login or Social Connect Callback
            alert(`Status: ${urlParams.get('sync_status') || 'Login Successful'}`);
            setSyncKey(prev => prev + 1); 
            setIsLoggedIn(true); 
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [router]);

    const handleAuth = async () => {
        setLoading(true);
        try {
            if (authMode === 'register') { await register(email, password, userType); alert("Registration Successful! Cookie set."); } 
            else { await login(email, password); alert("Login Successful! Cookie set."); }
            setIsLoggedIn(true);
            setSyncKey(prev => prev + 1);
        } catch (error: any) {
            alert(`Authentication Failed: ${error.message}`);
            setIsLoggedIn(false);
        } finally { setLoading(false); }
    };

    const handleLogout = async () => {
        await handleBackendLogout(); // Clears HTTP-only cookie on backend
        setIsLoggedIn(false);
        setSyncKey(0);
        router.push('/'); 
    };

    const handleSync = async (platform: PlatformKey) => {
        if (!isLoggedIn) { alert("Please login first."); return; }
        try {
            await syncSocialAccount(platform);
            alert(`${platform.charAt(0).toUpperCase() + platform.slice(1)} sync successful!`);
            setSyncKey(prev => prev + 1);
        } catch (error: any) {
            alert(`Sync Failed: ${error.message}`);
            if (error.message.includes('401')) {
                 setIsLoggedIn(false);
                 alert("Session Expired. Please login again.");
            }
        }
    };


    return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>🚀 Dhanur Frontend Tester</h2>
            <hr />

            {isLoggedIn ? (
                // --- LOGGED IN VIEW ---
                <div>
                    <h3>✅ Logged In Successfully (via HTTP-only Cookie)</h3>
                    <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px' }}>
                        Logout
                    </button>
                    <hr />

                    <h3>🔗 Connect Social Accounts</h3>
                    <p>You are logged in as <strong>{userType}</strong></p>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', margin: '20px 0' }}>
                        <button onClick={() => handleConnectMeta('instagram')} style={{ padding: '15px', background: '#E4405F', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>📸 Connect Instagram</button>
                        <button onClick={() => handleConnectMeta('facebook')} style={{ padding: '15px', background: '#1877F2', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>📘 Connect Facebook Page</button>
                        <button onClick={handleConnectLinkedIn} style={{ padding: '15px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>💼 Connect LinkedIn</button>
                        <button onClick={handleConnectYoutube} style={{ padding: '15px', background: '#FF0000', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>▶️ Connect YouTube</button>
                        <button onClick={handleConnectSnapchat} style={{ padding: '15px', background: '#FFFC00', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>👻 Connect Snapchat</button>
                        <button onClick={handleConnectTwitter} style={{ padding: '15px', background: '#1DA1F2', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>🐦 Connect Twitter (X)</button>
                    </div>

                    <hr />
                    <h3>📊 Connected Profiles</h3>
                    <div key={syncKey} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                         {ALL_PLATFORMS.map(platform => (<SocialProfileDisplay key={platform} platform={platform} />))}
                    </div>
                    
                    <hr style={{ marginTop: '20px' }}/>

                    <h4>🔄 Manual Sync</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {ALL_PLATFORMS.map(platform => (
                             <button key={`sync-${platform}`} onClick={() => handleSync(platform)} style={{ padding: '10px 15px', background: '#2196F3', color: 'white', border: 'none' }}>
                                 Sync {platform.charAt(0).toUpperCase() + platform.slice(1)}
                             </button>
                         ))}
                    </div>
                </div>
            ) : (
                // --- LOGGED OUT VIEW ---
                <div>
                    <h3>{authMode === 'login' ? 'Login' : 'Register'}</h3>
                    {/* --- 1. BASIC EMAIL/PASS LOGIN/REGISTER --- */}
                     {authMode === 'register' && (<select value={userType} onChange={(e) => setUserType(e.target.value as any)} style={{ width: '100%', padding: '10px', margin: '10px 0' }}>
                            <option value="INFLUENCER">Influencer</option>
                            <option value="BRAND">Brand</option>
                            <option value="ADMIN">Admin</option>
                        </select>)}
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', margin: '10px 0' }} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', margin: '10px 0' }} />
                    <button onClick={handleAuth} disabled={loading} style={{ width: '100%', padding: '15px', background: '#4CAF50', color: 'white', border: 'none', margin: '10px 0' }}>
                        {loading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Register')}
                    </button>
                    <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ width: '100%', padding: '10px', background: '#ddd', border: 'none' }}>
                        Switch to {authMode === 'login' ? 'Register' : 'Login'}
                    </button>

                    {/* --- 2. SOCIAL LOGIN BUTTONS --- */}
                    <hr style={{ margin: '20px 0' }}/>
                    <h4 style={{ textAlign: 'center' }}>Or Login with:</h4>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button onClick={() => handleGoogleLogin(userType)} style={{ padding: '10px 15px', background: '#DB4437', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
                            G+ Login
                        </button>
                        <button onClick={handleLinkedInLogin} style={{ padding: '10px 15px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
                            💼 LinkedIn Login
                        </button>
                    </div>

                    {/* --- 3. OTP / RESET PASSWORD UTILITIES --- */}
                    <AuthUtilitiesForm />
                </div>
            )}
        </div>
    );
}