import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  FileText, 
  ShoppingCart, 
  Bell, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Factory,
  Menu
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { notificationsApi } from '../lib/api';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projeler', icon: FolderKanban },
  { path: '/suppliers', label: 'Tedarikçiler', icon: Users },
  { path: '/quotes', label: 'Teklifler', icon: FileText },
  { path: '/orders', label: 'Siparişler', icon: ShoppingCart },
  { path: '/notifications', label: 'Bildirimler', icon: Bell },
  { path: '/settings', label: 'Ayarlar', icon: Settings },
];

export function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    loadUnreadCount();
  }, [location]);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsApi.getAll(false);
      setUnreadCount(response.data.length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside 
        className={`bg-white border-r border-border flex flex-col transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Factory className="h-8 w-8 text-orange-500" />
              <span className="font-heading font-bold text-xl text-primary">ProManufakt</span>
            </div>
          )}
          {collapsed && <Factory className="h-8 w-8 text-orange-500 mx-auto" />}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={collapsed ? 'mx-auto' : ''}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
              }
              data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.path === '/notifications' && unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs">
                  {unreadCount}
                </Badge>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              © 2025 ProManufakt
            </p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6">
          <h1 className="font-heading font-semibold text-lg text-foreground">
            {navItems.find(item => item.path === location.pathname)?.label || 'ProManufakt'}
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="relative"
              onClick={() => window.location.href = '/notifications'}
              data-testid="header-notifications-btn"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
