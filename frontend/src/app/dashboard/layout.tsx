'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { 
  Layers, 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user) return null; // Let redirection handle it

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  ];

  // Admin-only management page
  if (user.role === 'ADMIN') {
    navItems.push({ name: 'User Directory', href: '/dashboard/users', icon: Users });
  }

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <div style={styles.appContainer}>
      {/* ── Desktop Sidebar ── */}
      <aside style={styles.sidebar} className="glass sidebar-desktop">
        <div style={styles.sidebarHeader}>
          <Layers size={24} color="#6366f1" />
          <span style={styles.logoText}>FlowTask</span>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                style={active ? {...styles.navLink, ...styles.navLinkActive} : styles.navLink}
                className={active ? '' : 'btn-secondary'}
              >
                <Icon size={18} color={active ? '#6366f1' : 'var(--text-secondary)'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={logout} style={styles.logoutBtn} className="btn-danger">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div style={styles.mainWrapper}>
        {/* Top Navbar */}
        <header style={styles.topbar} className="glass">
          <button onClick={toggleMobile} style={styles.menuBtn} className="menu-btn-mobile">
            <Menu size={20} />
          </button>
          
          <div style={styles.breadcrumb}>
            <span style={styles.orgLabel}>{user.role} WORKSPACE</span>
          </div>

          <div style={styles.topbarActions}>
            <div style={styles.profileContainer}>
              <button onClick={() => setProfileOpen(!profileOpen)} style={styles.profileBtn}>
                <div style={styles.avatar}>
                  <UserIcon size={16} />
                </div>
                <span style={styles.profileName} className="profile-name-desktop">{user.name}</span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {profileOpen && (
                <>
                  <div style={styles.backdrop} onClick={() => setProfileOpen(false)}></div>
                  <div style={styles.dropdown} className="glass anim-scale-in">
                    <div style={styles.dropHeader}>
                      <span style={styles.dropName}>{user.name}</span>
                      <span style={styles.dropEmail}>{user.email}</span>
                      <span style={styles.roleBadge} className={`badge badge-${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </div>
                    <div style={styles.dropDivider}></div>
                    <button onClick={logout} style={styles.dropItem} className="btn-danger">
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main style={styles.contentBody}>
          {children}
        </main>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <>
          <div style={styles.drawerBackdrop} onClick={toggleMobile}></div>
          <aside style={styles.mobileDrawer} className="glass anim-slide-right">
            <div style={styles.drawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={22} color="#6366f1" />
                <span style={styles.logoText}>FlowTask</span>
              </div>
              <button onClick={toggleMobile} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            
            <nav style={styles.drawerNav}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link 
                    key={item.name} 
                    href={item.href} 
                    onClick={toggleMobile}
                    style={active ? {...styles.drawerLink, ...styles.drawerLinkActive} : styles.drawerLink}
                  >
                    <Icon size={18} color={active ? '#6366f1' : 'var(--text-secondary)'} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div style={styles.drawerFooter}>
              <button onClick={logout} style={{ width: '100%' }} className="btn-danger">
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-primary)',
  },
  sidebar: {
    width: '260px',
    display: 'none',
    flexDirection: 'column',
    height: '100%',
    borderRight: '1px solid var(--border-glass)',
    padding: '1.5rem',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    marginBottom: '2.5rem',
  },
  logoText: {
    fontSize: '1.25rem',
    fontFamily: 'var(--font-heading)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
    background: 'transparent',
  },
  navLinkActive: {
    background: 'rgba(99, 102, 241, 0.12)',
    color: 'var(--text-primary)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    fontWeight: 600,
  },
  sidebarFooter: {
    marginTop: 'auto',
  },
  logoutBtn: {
    width: '100%',
    padding: '0.75rem',
    justifyContent: 'center',
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  topbar: {
    height: '65px',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    zIndex: 10,
    backdropFilter: 'blur(10px)',
    background: 'rgba(9, 9, 11, 0.5)',
  },
  menuBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    borderRadius: '8px',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
  },
  orgLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--accent-primary)',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    letterSpacing: '0.05em',
  },
  topbarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  profileContainer: {
    position: 'relative',
  },
  profileBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    padding: '0.4rem 0.6rem',
    borderRadius: '8px',
    transition: 'background 0.2s',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
  },
  profileName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    display: 'none',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 100,
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '40px',
    width: '220px',
    borderRadius: '12px',
    padding: '1rem',
    zIndex: 101,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  dropHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  dropName: {
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  dropEmail: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    wordBreak: 'break-all',
  },
  roleBadge: {
    marginTop: '0.5rem',
    alignSelf: 'flex-start',
  },
  dropDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.06)',
  },
  dropItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  contentBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '2rem 1.5rem',
  },
  drawerBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.5)',
    zIndex: 100,
  },
  mobileDrawer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '280px',
    height: '100%',
    zIndex: 101,
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '0.25rem',
  },
  drawerNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  drawerLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  drawerLinkActive: {
    background: 'rgba(99, 102, 241, 0.12)',
    color: 'var(--text-primary)',
    borderLeft: '3px solid var(--accent-primary)',
    fontWeight: 600,
  },
  drawerFooter: {
    marginTop: 'auto',
  },
};
