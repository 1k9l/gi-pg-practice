// File: components/Layout.js

import Link from 'next/link';
import '../styles/globals.css'; // so the .navbar etc. classes are available

export default function Layout({ children }) {
  return (
    <div>
      {/* The shared navbar */}
      <div className="navbar">
        <h1>Ordinal API Tester</h1>
        <div className="links">
          <Link href="/">Home</Link>
          <Link href="/connect" style={{ marginLeft: '1rem' }}>Connect</Link>
        </div>
      </div>

      {/* The page-specific content */}
      {children}
    </div>
  );
}
