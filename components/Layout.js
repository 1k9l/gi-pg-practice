// File: components/Layout.js

import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div>
      {/* The shared navbar */}
      <div className="navbar">
        <h1>Ordinal API Tester</h1>
        <div className="links">
          <Link href="/">Home</Link>
          <Link href="/connect" style={{ marginLeft: '1rem' }}>Connect</Link>
          <Link href="/maze" style={{ marginLeft: '1rem' }}>Maze</Link>
        </div>
      </div>

      {/* Page-specific content */}
      {children}
    </div>
  );
}
