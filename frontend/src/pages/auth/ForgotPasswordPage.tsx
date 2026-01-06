import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';
import AuthLayout from '@/components/auth/AuthLayout';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const handleEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      const result = await authApi.forgotPassword(data.email);
      if (result.success) {
        setEmail(data.email);
        setStep('otp');
        toast({
          title: 'OTP sent',
          description: 'Check your email for the password reset code.',
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

  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit OTP.',
        variant: 'destructive',
      });
      return;
    }
    setStep('reset');
  };

  const handleResetSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      const result = await authApi.resetPassword(email, otp, data.password);
      if (result.success) {
        toast({
          title: 'Password reset successful',
          description: 'You can now login with your new password.',
        });
        navigate('/auth/login');
      } else {
        toast({
          title: 'Reset failed',
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

  if (step === 'email') {
    return (
      <AuthLayout title="Reset password" subtitle="Enter your email to receive a reset code">
        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              {...emailForm.register('email')}
              className={emailForm.formState.errors.email ? 'border-destructive' : ''}
            />
            {emailForm.formState.errors.email && (
              <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send reset code'
            )}
          </Button>

          <Button variant="ghost" asChild className="w-full">
            <Link to="/auth/login">
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </Button>
        </form>
      </AuthLayout>
    );
  }

  if (step === 'otp') {
    return (
      <AuthLayout title="Enter verification code" subtitle="We've sent a 6-digit code to your email">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Code sent to <strong className="text-foreground">{email}</strong>
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

        <Button onClick={handleOtpVerify} className="w-full" size="lg" disabled={otp.length !== 6}>
          Verify code
        </Button>

        {/* <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Demo:</strong> Use OTP <code className="bg-muted px-1.5 py-0.5 rounded">123456</code>
          </p>
        </div> */}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create new password" subtitle="Enter a strong password for your account">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-success" />
        </div>
      </div>

      <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              {...resetForm.register('password')}
              className={resetForm.formState.errors.password ? 'border-destructive pr-10' : 'pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {resetForm.formState.errors.password && (
            <p className="text-xs text-destructive">{resetForm.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              {...resetForm.register('confirmPassword')}
              className={resetForm.formState.errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {resetForm.formState.errors.confirmPassword && (
            <p className="text-xs text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Resetting...
            </>
          ) : (
            'Reset password'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
