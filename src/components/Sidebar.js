'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/projects', icon: '📁', label: 'Projects' },
    { href: '/tasks', icon: '✅', label: 'Tasks' },
  ];

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">T</div>
          <h2>TaskFlow</h2>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="icon">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-info">
              <div className="sidebar-user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="sidebar-user-name">{user.name}</div>
                <div className="sidebar-user-role">{user.role}</div>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm w-full" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
