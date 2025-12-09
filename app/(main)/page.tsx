// app/(main)/page.tsx
import UserStatus from '../components/UserStatus';

// Server Component
export default function HomePage() {
    return (
        // Wrapper for centering the content
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f4f4f4' 
        }}>
            <main>
                <UserStatus />
            </main>
        </div>
    );
}