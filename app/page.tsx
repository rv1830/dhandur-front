// app/page.tsx
// Yeh ek Server Component hai jo sirf Client Component (UserStatus) ko render karega.

import UserStatus from './components/UserStatus';

// Basic styling ke liye ek div mein wrap kar dete hain
export default function HomePage() {
    return (
        <div 
            style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#f4f4f4' // For better contrast
            }}
        >
            <main>
                <UserStatus />
            </main>
        </div>
    );
}

// NOTE:
// Agar tumne 'dhanur' project mein Tailwind CSS use kiya hai, 
// toh tum (main)/page.tsx mein UserStatus ko import kar sakte ho.
// Main simple inline styles de raha hoon agar tumne default CSS use kiya hai.