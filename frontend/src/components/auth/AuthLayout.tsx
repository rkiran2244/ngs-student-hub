import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-white">StudentHub</span>
          </Link>
          
          <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight mb-6">
            Manage Your Academic Journey
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-md">
            Track your daily work, manage your profile, and stay connected with your institution - all in one place.
          </p>
          
          <div className="mt-16 grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-white">500+</div>
              <div className="text-sm text-white/70 mt-1">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-white">50+</div>
              <div className="text-sm text-white/70 mt-1">Colleges</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-white">10K+</div>
              <div className="text-sm text-white/70 mt-1">Submissions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-12 xl:px-20 bg-background">
        <div className="lg:hidden mb-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl hero-gradient flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">StudentHub</span>
          </Link>
        </div>
        
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-foreground">{title}</h2>
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
