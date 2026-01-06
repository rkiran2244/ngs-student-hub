import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Upload, 
  History, 
  LogOut,
  GraduationCap,
  X,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/profile', icon: User, label: 'My Profile' },
  { to: '/student/upload', icon: Upload, label: 'Upload Work' },
  { to: '/student/history', icon: History, label: 'Upload History' },
  { to: '/student/feedback', icon: MessageSquare, label: 'Feedback' },
  { to: '/student/feedback/history', icon: History, label: 'Feedback History' },
];

interface StudentSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function StudentSidebar({ isOpen = true, onClose }: StudentSidebarProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card transition-transform duration-300",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-border px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Student Portal</span>
            </div>
            {onClose && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* User Info */}
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              {/* Avatar or fallback icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 overflow-hidden">
                {user?.profile?.avatar_url ? (
                  <img
                    src={
                      user.profile.avatar_url.startsWith('data:')
                        ? user.profile.avatar_url
                        : user.profile.avatar_url.startsWith('http')
                        ? user.profile.avatar_url
                        : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${user.profile.avatar_url}`
                    }
                    alt={user.profile.full_name || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.profile?.full_name || 'Student'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.profile?.username ? `@${user.profile.username}` : user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/student/feedback'}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="border-t border-border p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
