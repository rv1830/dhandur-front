// pages/social/callback/[[...platform]].tsx (or SocialCallbackPage.tsx)

'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getToken } from '../../../lib/auth'; // JWT utility

export default function SocialCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    useEffect(() => {
        console.log('--- SocialCallbackPage: Running on Frontend ---');

        if (error || !code) {
            console.error('OAuth Failed:', error || 'Code missing');
            alert(`OAuth Failed: ${error || 'Code missing'}`);
            router.push('/');
            return;
        }

        // --- 1. CSRF State Verification ---
        const storedState = localStorage.getItem('oauth_state');
        if (state && storedState !== state) {
            console.error('CSRF State Mismatch!');
            alert('State mismatch – possible CSRF attack.');
            router.push('/');
            return;
        }
        localStorage.removeItem('oauth_state');

        // --- 2. Get JWT Token (CRITICAL STEP) ---
        const authToken = getToken(); 
        
        if (!authToken) {
            console.error('Authentication Token is missing. User is not logged in.');
            alert("Login required to link social accounts (JWT missing).");
            router.push('/');
            return;
        }
        
        // --- 3. Extract Platform and PKCE Verifier ---
        const path = window.location.pathname; 
        const platform = path.split('/').pop() || 'instagram';

        let codeVerifier = '';
        let verifierStorageKey = '';

        if (platform === 'snapchat') {
            verifierStorageKey = 'snapchat_code_verifier';
        } else if (platform === 'twitter') {
            verifierStorageKey = 'twitter_code_verifier';
        }

        if (verifierStorageKey) {
            const storedVerifier = localStorage.getItem(verifierStorageKey);
            if (storedVerifier) {
                codeVerifier = storedVerifier;
                localStorage.removeItem(verifierStorageKey); // Clean up
            } else {
                console.error(`PKCE Verifier for ${platform} missing!`);
                alert(`Login failed: PKCE Verifier missing for ${platform}.`);
                router.push('/');
                return;
            }
        }
        
        // 4. Forwarding to Backend
        const encodedToken = encodeURIComponent(authToken); 
        const API_BASE = process.env.NEXT_PUBLIC_API_URL; 
        
        let backendUrl = `${API_BASE}/api/social/callback/${platform}?code=${code}&state=${state}&token=${encodedToken}`;
        
        // 🛑 PKCE Append
        if (codeVerifier) {
            backendUrl += `&code_verifier=${codeVerifier}`;
        }
        
        console.log(`Forwarding to Backend (localhost:5000) with PKCE: ${backendUrl}`);

        // Guaranteed redirect to the backend API endpoint
        window.location.replace(backendUrl); 
        
    }, [code, state, error, router]);

    return (
        <div style={{ textAlign: 'center', padding: '100px' }}>
            <h2>Processing OAuth Callback...</h2>
            <p>Please wait while we securely connect your account.</p>
        </div>
    );
}