import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, MessageSquare, Star, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { studentApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
  category: z.string().min(1, 'Category is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  rating: z.number({ invalid_type_error: 'Rating is required' }).min(1, 'Rating is required').max(5),
});

type FormData = z.infer<typeof schema>;

export default function FeedbackPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const allowedRatings = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1];
  const getRatingColor = (n: number) => {
    if (n >= 4.5) return 'text-green-600';
    if (n >= 4) return 'text-emerald-600';
    if (n >= 3.5) return 'text-lime-600';
    if (n >= 3) return 'text-yellow-600';
    if (n >= 2.5) return 'text-orange-600';
    if (n >= 2) return 'text-amber-600';
    return 'text-red-600';
  };

  // Render a star glyph with partial fill (0-100)
  const PartialStar = ({ value, className = '' }: { value: number; className?: string }) => {
    const fillPercent = value % 1 === 0.5 ? 50 : 100;
    const colorClass = getRatingColor(value);
    return (
      <span className={`relative inline-block ${className}`} style={{ lineHeight: 1 }}>
        <span className="block text-xl text-muted-foreground">★</span>
        <span className="absolute left-0 top-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
          <span className={`block text-xl ${colorClass}`}>★</span>
        </span>
      </span>
    );
  };

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const all = await studentApi.getFeedbacks();
      setFeedbacks(all);
    } catch (err: any) {
      console.error('Failed to load feedbacks', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Not authenticated')) {
        // clear tokens and force login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        toast({ variant: 'destructive', title: 'Not authenticated', description: 'Please sign in to view feedbacks.' });
        navigate('/auth/login');
        return;
      }
      toast({ variant: 'destructive', title: 'Failed to load feedbacks', description: msg || 'Unexpected error' });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      load();
    } else {
      // clear any local feedbacks when not authenticated
      setFeedbacks([]);
    }
  }, [isAuthenticated]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files;
    if (!fl) return;
    const arr = Array.from(fl).slice(0, 3); // limit to 3 files
    setFiles(arr);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Construct a strongly typed payload to satisfy the API signature
      const payload: {
        category: string;
        subject: string;
        message: string;
        rating?: number;
        files?: File[];
      } = {
        category: data.category,
        subject: data.subject,
        message: data.message,
        rating: data.rating,
        files: files.length > 0 ? files : undefined,
      };

      const res = await studentApi.submitFeedback(payload);
      toast({ title: 'Feedback submitted', description: res.message });
      setFiles([]);
      const fileInput = document.getElementById('feedback-files') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      await load();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Not authenticated')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        toast({ variant: 'destructive', title: 'Not authenticated', description: 'Please sign in to submit feedback.' });
        navigate('/auth/login');
        return;
      }
      toast({ variant: 'destructive', title: 'Error', description: msg || String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Submit Feedback</h1>
        <p className="mt-1 text-muted-foreground">Share feedback about training, mentors or the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback
          </CardTitle>
          <CardDescription>Categories: Training, Mentor, Course Content, Other. Attach files if needed (max 3).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className='w-full sm:w-[400px]'>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select onValueChange={(v) => setValue('category', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Mentor">Mentor</SelectItem>
                <SelectItem value="Course Content">Course Content</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <Input {...register('subject')} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <Textarea {...register('message')} rows={5} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rating <span className="text-destructive">*</span></label>
            {/* hidden registered field to keep react-hook-form aware of rating value */}
            <input type="hidden" {...register('rating', { valueAsNumber: true })} />
            <div className="flex items-center gap-1 flex-wrap">
              {allowedRatings.map((n) => {
                const selected = selectedRating === n;
                const colorClass = getRatingColor(n);
                return (
                  <button
                    key={String(n)}
                    type="button"
                    onClick={() => { setValue('rating', n, { shouldValidate: true }); setSelectedRating(n); }}
                    className={`flex items-center gap-1 px-[12px] py-[2px] rounded-full border ${selected ? `${colorClass} ring-2 ring-offset-1 border-grey-500` : 'bg-white hover:bg-secondary hover:border-2 hover:border-grey-900'}`}
                    aria-pressed={selected}
                    aria-label={`Rating ${n}`}
                  >
                    <PartialStar value={n} />
                    <span className={`text-lg font-medium ${selected ? 'text-current' : 'text-muted-foreground'}`}>{n}</span>
                  </button>
                );
              })} 
            </div>
            {errors.rating && (
              <p role="alert" className="mt-2 text-sm text-destructive">{errors.rating.message as string}</p>
            )}
          </div>

          {/* <div>
            <label className="block text-sm font-medium mb-1">Attachments (optional, max 3)</label>

            <div className={"relative rounded-lg border-2 border-dashed p-6 text-center"}>
              <div className="flex items-center justify-center space-x-3">
                <Upload className="h-6 w-6 text-primary" />
                <span className="text-sm text-muted-foreground">Drag & drop files here or</span>
                <label>
                  <Button type="button" variant="outline" asChild>
                    <span>
                      Choose Files
                      <input id="feedback-files" type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={onFileChange} />
                    </span>
                  </Button>
                </label>
              </div>
              {files.length > 0 && <p className="mt-3 text-sm">Selected: {files.map((f)=>f.name).join(', ')}</p>}
            </div>
          </div> */}

          <div className="flex justify-end">
            <Button type="button" className="w-full sm:w-auto" variant="gradient" size="lg" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || selectedRating === null}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Only one feedback per day is allowed.</b></li>
              <li>Keep feedback concise and respectful — include the category and subject for clarity.</li>
              <li>You may attach up to <strong>3 files</strong> (pdf, doc, png, jpg) to support your feedback.</li>
              <li>Rating is <strong>required</strong> and supports half-star values (e.g., 4.5).</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
