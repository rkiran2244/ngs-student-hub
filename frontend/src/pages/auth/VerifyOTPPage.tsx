import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';
import AuthLayout from '@/components/auth/AuthLayout';

const VerifyOTPPage: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'your email';

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit OTP.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.verifyOtp(email, otp);
      if (result.success) {
        toast({
          title: 'Email verified!',
          description: 'Your account is pending admin approval. You will receive an email with your username once approved.',
        });
        navigate('/auth/pending-approval');
      } else {
        toast({
          title: 'Verification failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const result = await authApi.resendOtp(email);
      if (result.success) {
        toast({
          title: 'OTP resent',
          description: 'A new OTP has been sent to your email.',
        });
        setCountdown(60);
        setOtp('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout title="Verify your email" subtitle="We've sent a 6-digit code to your email">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Enter the code sent to <strong className="text-foreground">{email}</strong>
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="space-y-4">
        <Button
          onClick={handleVerify}
          className="w-full"
          size="lg"
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify email'
          )}
        </Button>

        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in <strong>{countdown}s</strong>
            </p>
          ) : (
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={isResending}
              className="text-primary"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Resend code
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground text-center">
          <strong>Demo:</strong> Use OTP <code className="bg-muted px-1.5 py-0.5 rounded">123456</code> to verify
        </p>
      </div>
    </AuthLayout>
  );
};

export default VerifyOTPPage;
