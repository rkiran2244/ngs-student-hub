import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, FileText, Shield, ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">StudentHub</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-5" />
        <div className="container mx-auto px-4 py-24 lg:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              Student Registration & <span className="gradient-text">Daily Work</span> Management
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Streamline your academic journey with our comprehensive platform. Track daily work, manage profiles, and stay connected with your institution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" asChild>
                <Link to="/auth/signup">
                  Register as Student
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/auth/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Everything you need</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Profile Management', desc: 'Manage your academic profile, skills, and resume' },
              { icon: FileText, title: 'Daily Uploads', desc: 'Submit and track your daily work with ease' },
              { icon: Shield, title: 'Secure Auth', desc: 'Email OTP verification and admin approval' },
              { icon: GraduationCap, title: 'Admin Dashboard', desc: 'Complete student management for admins' },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          © 2025 StudentHub. Student Registration & Daily Work Management System.
        </div>
      </footer>
    </div>
  );
};

export default Index;
