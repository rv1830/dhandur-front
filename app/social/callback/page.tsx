'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SocialCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    useEffect(() => {
        if (error) {
            alert(`OAuth Error: ${error}`);
            router.push('/');
            return;
        }

        if (!code) {
            alert('Authorization code missing.');
            router.push('/');
            return;
        }

        // Optional: Verify state
        const storedState = localStorage.getItem('oauth_state');
        if (state && storedState !== state) {
            alert('State mismatch – possible CSRF attack.');
            router.push('/');
            return;
        }
        localStorage.removeItem('oauth_state');

        // Extract platform from the current URL path
        const path = window.location.pathname; // e.g., /social/callback/instagram
        const platform = path.split('/').pop() || 'instagram';

        // Redirect browser to backend callback
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/social/callback/${platform}?code=${code}`;
        window.location.href = backendUrl;

    }, [code, state, error, router]);

    return (
        <div style={{ textAlign: 'center', padding: '100px' }}>
            <h2>Processing OAuth Callback...</h2>
            <p>Please wait while we connect your account.</p>
        </div>
    );
}