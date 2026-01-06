import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/auth/AuthLayout';

const PendingApprovalPage: React.FC = () => {
  return (
    <AuthLayout 
      title="Account Pending Approval" 
      subtitle="Your registration is being reviewed"
    >
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center">
            <Clock className="w-10 h-10 text-warning" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Thank you for registering!
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your account has been created and is currently pending approval from an administrator. 
            You will receive an email notification once your account has been approved.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
          <h4 className="font-medium text-foreground text-sm">What happens next?</h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <span>An admin will review your application</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <span>You'll be assigned a unique username</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <span>You'll receive an email with your login credentials</span>
            </li>
          </ul>
        </div>

        <div className="pt-4">
          <Link to="/auth/login">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default PendingApprovalPage;
