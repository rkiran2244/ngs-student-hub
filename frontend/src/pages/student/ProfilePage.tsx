import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap,
  Briefcase,
  Heart,
  FolderOpen,
  FileText,
  Camera,
  Lock,
  Save,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { authApi, studentApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  // contactNumber can be empty or at least 10 digits
  contactNumber: z.union([z.string().min(10, 'Invalid contact number'), z.literal('')]),
  // Make college name optional to avoid blocking save for users without college info
  collegeName: z.union([z.string().min(1, 'College name is required'), z.literal('')]),
  collegeId: z.string().optional(),
  collegeEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  courseName: z.string().optional(),
  courseMode: z.enum(['online','offline']).optional(),
  courseDuration: z.enum(['long','short']).optional(),
});

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      contactNumber: '',
      collegeName: '',
      collegeId: '',
      collegeEmail: '',
      courseName: '',
      courseMode: undefined,
      courseDuration: undefined,
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (user) {
      // Use profile fields when present, otherwise fall back to top-level user fields (e.g., email)
      profileForm.reset({
        fullName: user.profile?.full_name || '',
        email: user.profile?.email || user.email || '',
        contactNumber: user.profile?.contact_number || '',
        collegeName: user.profile?.college_name || '',
        collegeId: user.profile?.college_id || '',
        collegeEmail: user.profile?.college_email || '',
        courseName: user.profile?.course_name || '',
        courseMode: user.profile?.course_mode || undefined,
        courseDuration: user.profile?.course_duration || undefined,
      });
      setProfilePhoto(user.profile?.avatar_url || null);
      setIsLoading(false);
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    // Ensure user is authenticated
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast({ variant: 'destructive', title: 'Not authenticated', description: 'Please sign in to save changes.' });
      navigate('/auth/login');
      return;
    }

    setIsSaving(true);
    try {
      let avatarUrl: string | undefined;

      // If a new photo has been selected, upload it first
      if (selectedFile) {
        const uploadRes = await studentApi.uploadFile(selectedFile);
        if (!uploadRes || !uploadRes.success) {
          // include server-provided filename/mimetype if available to make debugging easier
          const meta = uploadRes ? ` (${uploadRes.filename || ''}${uploadRes.filename && uploadRes.mimetype ? ', ' : ''}${uploadRes.mimetype || ''})` : '';
          throw new Error((uploadRes?.message || 'Failed to upload photo') + meta);
        }
        avatarUrl = uploadRes.upload?.file_url || uploadRes.upload?.fileUrl || uploadRes.file_url || uploadRes.fileUrl;
      }

      const payload: any = {
        fullName: data.fullName,
        email: data.email,
        contactNumber: data.contactNumber,
        collegeName: data.collegeName,
        collegeId: data.collegeId,
        collegeEmail: data.collegeEmail,
        courseName: data.courseName,
        courseMode: data.courseMode,
        courseDuration: data.courseDuration,
      };
      if (avatarUrl) payload.avatarUrl = avatarUrl;

      await studentApi.updateProfile(payload);

      await refreshProfile();
      toast({
        title: 'Profile updated!',
        description: 'Your profile has been saved successfully.',
      });

      // reset selected file after successful upload
      setSelectedFile(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Profile update error:', msg);
      if (msg.includes('Not authenticated')) {
        toast({ variant: 'destructive', title: 'Not authenticated', description: 'Please sign in again.' });
        // clear tokens and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/auth/login');
        return;
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: msg || 'Failed to update profile',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      const res = await authApi.changePassword(data.newPassword);
      if (!res || !res.success) throw new Error(res?.message || 'Failed to change password');

      toast({
        title: 'Password changed!',
        description: 'Your password has been updated successfully.',
      });
      passwordForm.reset();
      setPasswordDialogOpen(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: msg || 'Failed to change password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Profile photo must be less than 2MB',
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your personal information and settings
          </p>
        </div>
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Lock className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter a new password for your account
              </DialogDescription>
            </DialogHeader>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isChangingPassword}>
                  {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Profile Photo Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Photo
          </CardTitle>
          <CardDescription>Upload a professional photo for your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                {profilePhoto ? (
                  <img
                    src={
                      profilePhoto.startsWith('data:')
                        ? profilePhoto
                        : profilePhoto.startsWith('http')
                        ? profilePhoto
                        : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${profilePhoto}`
                    }
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {user?.profile?.full_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.profile?.username ? `@${user.profile.username}` : user?.email}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG or GIF. Max 2MB.
              </p>
              {selectedFile && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Selected: <span className="font-medium">{selectedFile.name}</span> ({selectedFile.type || 'unknown'})
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit, (errors) => {
            const firstKey = Object.keys(errors)[0];
            const first = firstKey ? (errors as any)[firstKey] : null;
            toast({
              variant: 'destructive',
              title: 'Validation error',
              description: first?.message || 'Please fix the form errors before saving.',
            });
          })}>
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="college">College Info</TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Your basic contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* College Tab */}
            <TabsContent value="college">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    College Details
                  </CardTitle>
                  <CardDescription>Your educational institution information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="collegeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>College Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={profileForm.control}
                      name="collegeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>College ID / Roll Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="collegeEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>College Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <CardContent className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="courseName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="courseMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Mode</FormLabel>
                            <FormControl>
                              <select {...field} className="w-full border rounded px-3 py-2">
                                <option value="">Select mode</option>
                                <option value="online">Online</option>
                                <option value="offline">Offline</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="courseDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Duration</FormLabel>
                            <FormControl>
                              <select {...field} className="w-full border rounded px-3 py-2">
                                <option value="">Select duration</option>
                                <option value="long">Long Term</option>
                                <option value="short">Short Term</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
