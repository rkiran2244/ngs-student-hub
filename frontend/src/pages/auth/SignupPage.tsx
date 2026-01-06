// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { Eye, EyeOff, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { useToast } from '@/hooks/use-toast';
// import { useAuth } from '@/contexts/AuthContext';
// import AuthLayout from '@/components/auth/AuthLayout';

// const signupSchema = z.object({
//   firstName: z.string().min(1, 'First name is required').max(50),
//   lastName: z.string().min(1, 'Last name is required').max(50),
//   email: z.string().email('Please enter a valid email address'),
//   contactNumber: z.string().min(10, 'Please enter a valid phone number').max(15),
//   collegeName: z.string().min(3, 'College name is required').max(100),
//   city: z.string().min(2, 'City is required').max(100),
//   pincode: z.string().min(6, 'Pincode must be 6 digits').max(6).regex(/^\d+$/, 'Pincode must contain only numbers'),
//   coursename: z.string().min(2, 'Course name is required').max(100),
//   password: z.string()
//     .min(8, 'Password must be at least 8 characters')
//     .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
//     .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
//     .regex(/[0-9]/, 'Password must contain at least one number'),
//   confirmPassword: z.string(),
// }).refine((data) => data.password === data.confirmPassword, {
//   message: "Passwords don't match",
//   path: ['confirmPassword'],
// });

// type SignupFormData = z.infer<typeof signupSchema>;

// const SignupPage: React.FC = () => {
//   const [step, setStep] = useState(1);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const { signUp } = useAuth();
//   const { toast } = useToast();
//   const navigate = useNavigate();

//   const {
//     register,
//     handleSubmit,
//     trigger,
//     formState: { errors },
//   } = useForm<SignupFormData>({
//     resolver: zodResolver(signupSchema),
//     mode: 'onBlur',
//   });

//   const step1Fields = ['firstName', 'lastName', 'email', 'contactNumber'] as const;
//   const step2Fields = ['collegeName', 'city', 'pincode', 'collegeEmail'] as const;
//   const step3Fields = ['password', 'confirmPassword'] as const;
  

//   const handleNext = async () => {
//     let fieldsToValidate: ReadonlyArray<keyof SignupFormData> = [];
//     if (step === 1) fieldsToValidate = step1Fields;
//     if (step === 2) fieldsToValidate = step2Fields;

//     const isValid = await trigger(fieldsToValidate);
//     if (isValid) {
//       setStep(step + 1);
//     }
//   };

//   const handleBack = () => {
//     setStep(step - 1);
//   };

//   const onSubmit = async (data: SignupFormData) => {
//     setIsLoading(true);
//     try {
//       const result = await signUp(data.email, data.password, {
//         full_name: `${data.firstName} ${data.lastName}`,
//         contact_number: data.contactNumber,
//         college_name: data.collegeName,
//         city: data.city,
//         pincode: data.pincode,
//         college_email: data.collegeEmail || '',
//       });

//       if (result.success) {
//         toast({
//           title: 'Registration successful!',
//           description: 'Your account is pending approval. You will be notified once approved.',
//         });
//         navigate('/auth/pending-approval');
//       } else {
//         toast({
//           title: 'Registration failed',
//           description: result.message,
//           variant: 'destructive',
//         });
//       }
//     } catch (error) {
//       toast({
//         title: 'Error',
//         description: 'An unexpected error occurred. Please try again.',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const renderStepIndicator = () => (
//     <div className="flex items-center justify-center gap-2 mb-8">
//       {[1, 2, 3].map((s) => (
//         <React.Fragment key={s}>
//           <div
//             className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${s === step
//                 ? 'bg-primary text-primary-foreground'
//                 : s < step
//                   ? 'bg-success text-success-foreground'
//                   : 'bg-muted text-muted-foreground'
//               }`}
//           >
//             {s}
//           </div>
//           {s < 3 && (
//             <div className={`w-12 h-1 rounded ${s < step ? 'bg-success' : 'bg-muted'}`} />
//           )}
//         </React.Fragment>
//       ))}
//     </div>
//   );

//   return (
//     <AuthLayout
//       title="Create an account"
//       subtitle={
//         step === 1 ? "Let's start with your personal details" :
//           step === 2 ? "Tell us about your college" :
//             "Create a secure password"
//       }
//     >
//       {renderStepIndicator()}

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
//         {step === 1 && (
//           <div className="space-y-4 animate-fade-in">
//             <div className="space-y-2">
//               <Label htmlFor="firstName">First Name</Label>
//               <Input
//                 id="firstName"
//                 placeholder="Enter your First Name"
//                 {...register('firstName')}
//                 className={errors.firstName ? 'border-destructive' : ''}
//               />
//               {errors.firstName && (
//                 <p className="text-xs text-destructive">{errors.firstName.message}</p>
//               )}
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="lastName">Last name</Label>
//               <Input
//                 id="lastName"
//                 placeholder="Enter your Last Name"
//                 {...register('lastName')}
//                 className={errors.lastName ? 'border-destructive' : ''}
//               />
//               {errors.lastName && (
//                 <p className="text-xs text-destructive">{errors.lastName.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="email">Email Address</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="john.doe@example.com"
//                 {...register('email')}
//                 className={errors.email ? 'border-destructive' : ''}
//               />
//               {errors.email && (
//                 <p className="text-xs text-destructive">{errors.email.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="contactNumber">Contact Number</Label>
//               <Input
//                 id="contactNumber"
//                 type="tel"
//                 placeholder="+91 9876543210"
//                 maxLength={10}
//                 minLength={10}
//                 {...register('contactNumber')}
//                 className={errors.contactNumber ? 'border-destructive' : ''}
//               />
//               {errors.contactNumber && (
//                 <p className="text-xs text-destructive">{errors.contactNumber.message}</p>
//               )}
//             </div>
//           </div>
//         )}

//         {step === 2 && (
//           <div className="space-y-4 animate-fade-in">
//             <div className="space-y-2">
//               <Label htmlFor="coursename">Course Name</Label>
//               <Input
//                 id="coursename"
//                 type="text"
//                 placeholder="Enter your Course Name"
//                 {...register('coursename')}
//                 className={errors.coursename ? 'border-destructive' : ''}
//               />
//               {errors.coursename && (
//                 <p className="text-xs text-destructive">{errors.coursename.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="collegeName">College Name</Label>
//               <Input
//                 id="collegeName"
//                 placeholder="ABC Engineering College"
//                 {...register('collegeName')}
//                 className={errors.collegeName ? 'border-destructive' : ''}
//               />
//               {errors.collegeName && (
//                 <p className="text-xs text-destructive">{errors.collegeName.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="collegeaddress">Course Name</Label>
//               <Input
//                 id="coursename"
//                 type="text"
//                 placeholder="Enter your Course Name"
//                 {...register('coursename')}
//                 className={errors.coursename ? 'border-destructive' : ''}
//               />
//               {errors.coursename && (
//                 <p className="text-xs text-destructive">{errors.coursename.message}</p>
//               )}
//             </div>

//             {/* <div className="space-y-2">
//               <Label htmlFor="collegeId">College ID / Roll Number</Label>
//               <Input
//                 id="collegeId"
//                 placeholder="2025CS001"
//                 {...register('collegeId')}
//                 className={errors.collegeId ? 'border-destructive' : ''}
//               />
//               {errors.collegeId && (
//                 <p className="text-xs text-destructive">{errors.collegeId.message}</p>
//               )}
//             </div> */}



//             <div className="space-y-2 flex flex-row w-full">
//               <div className='w-1/2 mr-3 pt-2'>
//                 <Label htmlFor="city">City</Label>
//                 <Input
//                   id="city"
//                   type='text'
//                   minLength={2}
//                   placeholder="Enter your City"
//                   {...register('city')}
//                   className={errors.city ? 'border-destructive' : ''}
//                 />
//                 {errors.city && (
//                   <p className="text-xs text-destructive">{errors.city.message}</p>
//                 )}
//               </div>

//               <div className='w-1/2'>
//                 <Label htmlFor="pincode">Pincode</Label>
//                 <Input
//                   id="pincode"
//                   type='tel'
//                   maxLength={6}
//                   minLength={6}
//                   placeholder="Enter the pincode"
//                   {...register('pincode')}
//                   className={errors.pincode ? 'border-destructive' : ''}
//                 />
//                 {errors.pincode && (
//                   <p className="text-xs text-destructive">{errors.pincode.message}</p>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}
//         { step === 3 && (
//           <div className="space-y-4 animate-fade-in">
//             <div className="space-y-2">
//             </div>
//           </div>
//         )}

//         {step === 4 && (
//           <div className="space-y-4 animate-fade-in">
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <div className="relative">
//                 <Input
//                   id="password"
//                   type={showPassword ? 'text' : 'password'}
//                   placeholder="Create a strong password"
//                   {...register('password')}
//                   className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
//                 >
//                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                 </button>
//               </div>
//               {errors.password && (
//                 <p className="text-xs text-destructive">{errors.password.message}</p>
//               )}
//               <p className="text-xs text-muted-foreground">
//                 At least 8 characters with uppercase, lowercase, and number
//               </p>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="confirmPassword">Confirm Password</Label>
//               <div className="relative">
//                 <Input
//                   id="confirmPassword"
//                   type={showConfirmPassword ? 'text' : 'password'}
//                   placeholder="Re-enter your password"
//                   {...register('confirmPassword')}
//                   className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
//                 >
//                   {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                 </button>
//               </div>
//               {errors.confirmPassword && (
//                 <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
//               )}
//             </div>
//           </div>
//         )}
        

//         <div className="flex gap-3 pt-2">
//           {step > 1 && (
//             <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
//               <ChevronLeft className="w-4 h-4" />
//               Back
//             </Button>
//           )}
//           {
//             step === 3 && (<Button type="button" variant="outline" onClick={handleBack} className="flex-1" disabled>
//               <ChevronLeft className="w-4 h-4" />
//               Back
//             </Button>
//           )
//           }

//           {step < 3 ? (
//             <Button type="button" onClick={handleNext} className="flex-1">
//               Next
//               <ChevronRight className="w-4 h-4" />
//             </Button>
//           ) : (
//             <Button type="submit" className="flex-1" disabled={isLoading}>
//               {isLoading ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   Creating account...
//                 </>
//               ) : (
//                 'Create account'
//               )}
//             </Button>
//           )}
//         </div>

//         <p className="text-center text-sm text-muted-foreground">
//           Already have an account?{' '}
//           <Link to="/auth/login" className="text-primary font-medium hover:text-primary/80">
//             Sign in
//           </Link>
//         </p>
//       </form>
//     </AuthLayout>
//   );
// };

// export default SignupPage;


import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/auth/AuthLayout';

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Please enter a valid email address'),
  contactNumber: z.string().min(10, 'Please enter a valid phone number').max(15),
  collegeName: z.string().min(3, 'College name is required').max(100),
  collegeaddress: z.string().min(3, 'College address is required').max(200),
  collegeEmail: z.string().email('Invalid college email').optional().or(z.literal('')),
  city: z.string().min(2, 'City is required').max(100),
  pincode: z.string().length(6, 'Pincode must be 6 digits').regex(/^\d+$/, 'Pincode must contain only numbers'),
  courseName: z.string().min(2, 'Course name is required').max(100),
  courseMode: z.enum(['online', 'offline'], 'Course mode is required'),
  courseDuration: z.enum(['long', 'short'], 'Course duration is required'),
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

type SignupFormData = z.infer<typeof signupSchema>;

const SignupPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  });

  const step1Fields = ['firstName', 'lastName', 'email', 'contactNumber'] as const;
  const step2Fields = ['collegeName', 'collegeaddress', 'city', 'pincode', 'collegeEmail'] as const;
  const step3Fields = ['courseName', 'courseMode', 'courseDuration'] as const;

  const step4Fields = ['password', 'confirmPassword'] as const;
  

  const handleNext = async () => {
    let fieldsToValidate: ReadonlyArray<keyof SignupFormData> = [];
    if (step === 1) fieldsToValidate = step1Fields;
    if (step === 2) fieldsToValidate = step2Fields;
    if (step === 3) fieldsToValidate = step3Fields;

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const result = await signUp(data.email, data.password, {
        full_name: `${data.firstName} ${data.lastName}`,
        contact_number: data.contactNumber,
        college_name: data.collegeName,
        collegeaddress: data.collegeaddress,
        city: data.city,
        pincode: data.pincode,
        college_email: data.collegeEmail || '',
        course_name: data.courseName,
        course_mode: data.courseMode,
        course_duration: data.courseDuration,
      });

      if (result.success) {
        toast({
          title: 'Registration successful!',
          description: 'Your account is pending approval. You will be notified once approved.',
        });
        navigate('/auth/pending-approval');
      } else {
        toast({
          title: 'Registration failed',
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

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3,4].map((s) => (
        <React.Fragment key={s}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${s === step
                ? 'bg-primary text-primary-foreground'
                : s < step
                  ? 'bg-success text-success-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
          >
            {s}
          </div>
          {s < 4 && (
            <div className={`w-12 h-1 rounded ${s < step ? 'bg-success' : 'bg-muted'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <AuthLayout
      title="Create an account"
      subtitle={
        step === 1 ? "Let's start with your personal details" :
          step === 2 ? "Tell us about your college" :
            "Create a secure password"
      }
    >
      {renderStepIndicator()}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="Enter your First Name"
                {...register('firstName')}
                className={errors.firstName ? 'border-destructive' : ''}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="Enter your Last Name"
                {...register('lastName')}
                className={errors.lastName ? 'border-destructive' : ''}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter the Email Address"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
            
              <Input
                id="contactNumber"
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                minLength={10}
                {...register('contactNumber')}
                className={errors.contactNumber ? 'border-destructive' : ''}
              />
              {errors.contactNumber && (
                <p className="text-xs text-destructive">{errors.contactNumber.message}</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">

            <div className="space-y-2">
              <Label htmlFor="collegeName">College Name</Label>
              <Input
                id="collegeName"
                placeholder="ABC Engineering College"
                {...register('collegeName')}
                className={errors.collegeName ? 'border-destructive' : ''}
              />
              {errors.collegeName && (
                <p className="text-xs text-destructive">{errors.collegeName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="collegeaddress">College Address</Label>
              <Input
                id="collegeaddress"
                type="text"
                placeholder="Enter your College Address"
                {...register('collegeaddress')}
                className={errors.collegeaddress ? 'border-destructive' : ''}
              />
              {errors.collegeaddress && (
                <p className="text-xs text-destructive">{errors.collegeaddress.message}</p>
              )}
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="collegeId">College ID / Roll Number</Label>
              <Input
                id="collegeId"
                placeholder="2025CS001"
                {...register('collegeId')}
                className={errors.collegeId ? 'border-destructive' : ''}
              />
              {errors.collegeId && (
                <p className="text-xs text-destructive">{errors.collegeId.message}</p>
              )}
            </div> */}

            <div className="space-y-2 flex flex-col sm:flex-row w-full">
              <div className='sm:w-1/2 w-full sm:mr-3 pt-2'>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type='text'
                  minLength={2}
                  placeholder="Enter your City"
                  {...register('city')}
                  className={errors.city ? 'border-destructive' : ''}
                />
                {errors.city && (
                  <p className="text-xs text-destructive">{errors.city.message}</p>
                )}
              </div>

              <div className='sm:w-1/2 w-full'>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  type='tel'
                  maxLength={6}
                  minLength={6}
                  placeholder="Enter the pincode"
                  {...register('pincode')}
                  className={errors.pincode ? 'border-destructive' : ''}
                />
                {errors.pincode && (
                  <p className="text-xs text-destructive">{errors.pincode.message}</p>
                )}
              </div>
            </div>
          </div>
        )}
        { step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="courseName">Course Name</Label>
              <Input
                id="courseName"
                type="text"
                placeholder="Enter your Course Name"
                {...register('courseName')}
                className={errors.courseName ? 'border-destructive' : ''}
              />
              {errors.courseName && (
                <p className="text-xs text-destructive">{errors.courseName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseMode">Course mode</Label>
                <select
                  id="courseMode"
                  {...register('courseMode')}
                  className={`w-full border rounded px-3 py-2 ${errors.courseMode ? 'border-destructive' : ''}`}
                >
                  <option value="">Select mode</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
                {errors.courseMode && (
                  <p className="text-xs text-destructive">{String(errors.courseMode.message)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="courseDuration">Course duration</Label>
                <select
                  id="courseDuration"
                  {...register('courseDuration')}
                  className={`w-full border rounded px-3 py-2 ${errors.courseDuration ? 'border-destructive' : ''}`}
                >
                  <option value="">Select duration</option>
                  <option value="long">Long Term</option>
                  <option value="short">Short Term</option>
                </select>
                {errors.courseDuration && (
                  <p className="text-xs text-destructive">{String(errors.courseDuration.message)}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  {...register('password')}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                At least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        )}
        

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handleBack} className="w-full sm:flex-1">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button type="button" onClick={handleNext} className="w-full sm:flex-1">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button type="submit" className="w-full sm:flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary font-medium hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignupPage;
