// app/(main)/layout.tsx
import React from 'react';

// Server Component
export default function MainLayout({ children }: { children: React.ReactNode }) {
  // Is layout ko tum header, footer ya koi common navigation ke liye use kar sakte ho.
  return (
    <div className="main-content-wrapper">
      {/* <h1>Dhanur App Header (Optional)</h1> */}
      {children}
    </div>
  );
}