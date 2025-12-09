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
        
        // 🛑 CRITICAL CHECK: Stop if user is not logged in.
        if (!authToken) {
            console.error('Authentication Token is missing. User is not logged in.');
            alert("Login required to link social accounts (JWT missing).");
            router.push('/');
            return;
        }
        
        // --- 3. Extract Platform and Redirect to Backend with Encoded Token ---
        const path = window.location.pathname; 
        const platform = path.split('/').pop() || 'instagram';

        // 🚀 FIX: Encode the token for safe transmission
        const encodedToken = encodeURIComponent(authToken); 

        // Use the Backend API URL (localhost:5000)
        const API_BASE = process.env.NEXT_PUBLIC_API_URL; 
        
        // ⚠️ FINAL URL: Sending code, state, AND JWT to the backend for verification
        const backendUrl = `${API_BASE}/api/social/callback/${platform}?code=${code}&state=${state}&token=${encodedToken}`;
        
        console.log(`Forwarding to Backend (localhost:5000) with JWT: ${backendUrl}`);

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