import React, { useEffect, useState } from 'react';
import { adminApi, Feedback } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Star, Filter } from 'lucide-react';

interface AdminFeedback extends Feedback {
  student_name?: string;
  student_email?: string;
  attachments?: string[];
}

const getRatingColor = (n: number) => {
  if (n >= 4.5) return 'text-green-600 bg-green-50';
  if (n >= 4) return 'text-emerald-600 bg-emerald-50';
  if (n >= 3.5) return 'text-lime-600 bg-lime-50';
  if (n >= 3) return 'text-yellow-600 bg-yellow-50';
  if (n >= 2.5) return 'text-orange-600 bg-orange-50';
  if (n >= 2) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
};

export default function FeedbacksPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [responseText, setResponseText] = useState('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [ratingFilter, setRatingFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getFeedbacks();
      setFeedbacks(res || []);
      setFiltered(res || []);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.message || String(err) });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let f = [...feedbacks];
    if (search) {
      const q = search.toLowerCase();
      f = f.filter((x: any) =>
        (x.subject || '').toLowerCase().includes(q) ||
        (x.message || '').toLowerCase().includes(q) ||
        (x.student_name || x.student_email || '').toLowerCase().includes(q)
      );
    }
    if (categoryFilter) f = f.filter((x: any) => x.category === categoryFilter);
    if (ratingFilter) f = f.filter((x: any) => String(x.rating) === ratingFilter);
    if (statusFilter) f = f.filter((x: any) => x.status === statusFilter);
    setFiltered(f);
  }, [search, categoryFilter, ratingFilter, statusFilter, feedbacks]);

  const openDetail = (f: any) => {
    setSelected(f);
    setResponseText(f.admin_response || '');
  };

  const submitResponse = async () => {
    if (!selected) return;
    const trimmed = (responseText || '').trim();
    if (!trimmed) {
      toast({ variant: 'destructive', title: 'Validation', description: 'Response cannot be empty.' });
      return;
    }
    try {
      await adminApi.respondFeedback(selected.id, trimmed);
      toast({ title: 'Response saved' });
      setSelected(null);
      await load();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.message || String(err) });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      // Avoid unnecessary calls if status is the same
      if (selected && selected.status === status) {
        // still refresh list to ensure UI consistency
        await load();
        return;
      }
      await adminApi.updateFeedbackStatus(id, status);
      toast({ title: 'Status updated' });
      await load();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.message || String(err) });
    }
  };

  const total = feedbacks.length;
  const counts = {
    submitted: feedbacks.filter((f: any) => f.status === 'submitted').length,
    in_review: feedbacks.filter((f: any) => f.status === 'in_review').length,
    resolved: feedbacks.filter((f: any) => f.status === 'resolved').length,
    rejected: feedbacks.filter((f: any) => f.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Feedback Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-md border p-4 bg-white h-[100px] shadow-md hover:shadow-lg transition-shadow">
          <div className="text-sm text-muted-foreground">Total Feedback</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
        <div className="rounded-md border p-4 bg-white shadow-md hover:shadow-lg transition-shadow">
          <div className="text-sm text-muted-foreground">Submitted</div>
          <div className="text-2xl font-bold">{counts.submitted}</div>
        </div>
        <div className="rounded-md border p-4 bg-white shadow-md hover:shadow-lg transition-shadow">
          <div className="text-sm text-muted-foreground">In Review</div>
          <div className="text-2xl font-bold">{counts.in_review}</div>
        </div>
        <div className="rounded-md border p-4 bg-white shadow-md hover:shadow-lg transition-shadow">
          <div className="text-sm text-muted-foreground">Resolved</div>
          <div className="text-2xl font-bold">{counts.resolved}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 md:items-end bg-white p-4 rounded-md border">
        <div className="flex-1">
          <div className='flex mb-6 text-2xl font-bold font-sans'>
            <span><Filter className="h-6 w-6" /></span>
            <span>Filters</span>
          </div>
          <Input placeholder="Search subject, message, student..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-48">
          <Select onValueChange={(v) => setCategoryFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Training">Training</SelectItem>
              <SelectItem value="Mentor">Mentor</SelectItem>
              <SelectItem value="Course Content">Course Content</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select onValueChange={(v) => setRatingFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Rating" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="4.5">4.5</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="3.5">3.5</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="2.5">2.5</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="1">1</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-md border">
        <div className="p-4 font-medium">All Feedbacks</div>
        <div className='bg-white p-4'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.subject}</TableCell>
                  <TableCell>{f.student_name || f.student_email}</TableCell>
                  <TableCell>{f.category}</TableCell>
                  <TableCell>
                    {f.rating != null ? (
                      <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-md ${getRatingColor(f.rating)}`}>
                        <Star className="h-4 w-4" />
                        <span className="text-sm font-medium">{f.rating}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{new Date(f.created_at).toLocaleString()}</TableCell>
                  <TableCell><span className="capitalize">{f.status}</span></TableCell>
                  <TableCell>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button size="sm" onClick={() => openDetail(f)}>View</Button>
                      {/* <Button
                        size="sm"
                        variant={f.status === 'in_review' ? 'default' : 'outline'}
                        onClick={() => updateStatus(f.id, 'in_review')}
                      >
                        In Review
                      </Button>
                      <Button
                        size="sm"
                        variant={f.status === 'resolved' ? 'default' : 'outline'}
                        onClick={() => updateStatus(f.id, 'resolved')}
                      >
                        Resolve
                      </Button> */}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent>
          <DialogTitle>Feedback details</DialogTitle>
          <DialogDescription>View feedback details and optionally respond or change the status.</DialogDescription>
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div><strong>Student:</strong> {selected.student_name || selected.student_email}</div>
                  <div className="text-sm text-muted-foreground">{selected.category}</div>
                </div>
                {selected.rating != null && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md ${getRatingColor(selected.rating)}`}>
                    <Star className="h-5 w-5" />
                    <div className="text-lg font-medium">{selected.rating}</div>
                  </div>
                )}
              </div>

              <div><strong>Subject:</strong> {selected.subject}</div>
              <div><strong>Message:</strong><p className="mt-1">{selected.message}</p></div>

              {selected.attachments && selected.attachments.length > 0 && (
                <div>
                  <strong>Attachments:</strong>
                  <ul className="list-disc ml-5">
                    {selected.attachments.map((a: string) => <li key={a}><a className="text-primary" href={a.startsWith('http') ? a : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${a}`} target="_blank" rel="noreferrer">{a}</a></li>)}
                  </ul>
                </div>
              )}

              <div>
                <strong>Admin Response</strong>
                <Textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} />
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Button onClick={submitResponse}>Save Response</Button>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button size="sm" variant={selected.status === 'in_review' ? 'default' : 'outline'} onClick={() => updateStatus(selected.id, 'in_review')}>In Review</Button>
                    <Button size="sm" variant={selected.status === 'resolved' ? 'default' : 'outline'} onClick={() => updateStatus(selected.id, 'resolved')}>Resolved</Button>
                    <Button size="sm" variant={selected.status === 'rejected' ? 'default' : 'outline'} onClick={() => updateStatus(selected.id, 'rejected')}>Rejected</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

