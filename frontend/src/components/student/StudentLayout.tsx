import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { StudentSidebar } from './StudentSidebar';
import { Loader2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StudentLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <span className="text-lg font-bold text-foreground">Student Portal</span>
      </header>
      
      <main className="lg:pl-64">
        <div className="container py-8 pt-24 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
