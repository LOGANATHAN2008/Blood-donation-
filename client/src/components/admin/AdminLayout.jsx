import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, AlertOctagon, Heart, Droplets, 
  Building2, Pill, Megaphone, Settings, Activity, Menu, X, LogOut
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

const ADMIN_LINKS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/queue', icon: AlertOctagon, label: 'Moderation Queue' },
  { to: '/admin/reports', icon: AlertOctagon, label: 'Reports' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/requests', icon: Heart, label: 'Blood Requests' },
  { to: '/admin/donors', icon: Droplets, label: 'Donors' },
  { to: '/admin/hospitals', icon: Building2, label: 'Hospitals' },
  { to: '/admin/medicines', icon: Pill, label: 'Medicines' },
  { to: '/admin/camps', icon: Megaphone, label: 'Camps & Stories' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/settings', icon: Settings, label: 'Settings & Content' },
  { to: '/admin/health', icon: Activity, label: 'System Health' },
  { to: '/admin/audit', icon: Activity, label: 'Audit Log' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
        flex flex-col z-50 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <Link to="/admin" className="text-xl font-black text-brand-600 dark:text-brand-500 flex items-center gap-2">
            <ShieldIcon /> Admin Panel
          </Link>
          <button className="lg:hidden text-gray-500" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {ADMIN_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-brand-500 uppercase font-black truncate">{user?.role}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full px-3 py-2 rounded-lg font-medium transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-500" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">Life Connect Workspace</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/" className="text-sm text-brand-600 font-medium hover:underline">Exit to Main Site</Link>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

    </div>
  );
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
