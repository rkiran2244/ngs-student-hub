import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  FileText,
  Calendar,
  Loader2,
  Download,
  Filter,
  Search,
  Star,
} from 'lucide-react';
import { studentApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function FeedbackHistoryPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await studentApi.getFeedbacks();
        setFeedbacks(data || []);
        setFiltered(data || []);
      } catch (e) {
        console.error('Failed to fetch feedbacks', e);
        setFeedbacks([]);
        setFiltered([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    let out = [...feedbacks];
    if (searchQuery) {
      out = out.filter((f) => (
        (f.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.message || '').toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
    if (statusFilter !== 'all') {
      out = out.filter((f) => f.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      out = out.filter((f) => f.category === categoryFilter);
    }
    setFiltered(out);
  }, [feedbacks, searchQuery, statusFilter, categoryFilter]);

  const stats = {
    total: feedbacks.length,
    submitted: feedbacks.filter((f) => f.status === 'submitted').length,
    resolved: feedbacks.filter((f) => f.status === 'resolved').length,
    today: feedbacks.filter((f) => {
      if (!f.created_at) return false;
      const d = new Date(f.created_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Resolved</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">In Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Submitted</Badge>;
    }
  };

  const openAttachment = (a: string) => {
    const url = a.startsWith('http') ? a : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${a}`;
    window.open(url, '_blank');
  };

  const getRatingColor = (n: number) => {
    if (n >= 4.5) return 'text-green-600 bg-green-50';
    if (n >= 4) return 'text-emerald-600 bg-emerald-50';
    if (n >= 3.5) return 'text-lime-600 bg-lime-50';
    if (n >= 3) return 'text-yellow-600 bg-yellow-50';
    if (n >= 2.5) return 'text-orange-600 bg-orange-50';
    if (n >= 2) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Feedback History</h1>
        <p className="mt-1 text-muted-foreground">View your submitted feedback and admin responses</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Feedback</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.submitted}</div>
            <p className="text-sm text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
            <p className="text-sm text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by subject or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Mentor">Mentor</SelectItem>
                <SelectItem value="Course Content">Course Content</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
          <CardDescription>{filtered.length} of {feedbacks.length} feedbacks</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-foreground">No feedbacks found</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feedbacks.length === 0 ? 'Submit feedback to get started' : 'Try adjusting filters'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='[150px]'>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Rating</TableHead>
                    {/* <TableHead>Attachments</TableHead> */}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className='[150px]'>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{f.subject}</div>
                            <div className="text-sm text-muted-foreground">{f.message?.slice(0, 100)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{f.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {f.created_at ? format(new Date(f.created_at), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{f.rating ? (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md ${getRatingColor(f.rating)}`}>
                          <span className="relative inline-block" style={{ lineHeight: 1 }}>
                            <span className="block text-xl text-muted-foreground">★</span>
                            <span className="absolute left-0 top-0 overflow-hidden" style={{ width: `${(f.rating % 1 === 0.5) ? 50 : 100}%` }}>
                              <span className={`block text-xl ${getRatingColor(f.rating)}`}>★</span>
                            </span>
                          </span>
                          <span className="text-base font-medium">{f.rating}</span>
                        </div>
                      ) : '-'}
                      </TableCell>
                      {/* <TableCell>
                        <div className="flex gap-2">
                          {(f.attachments || []).map((a: string) => (
                            <Button key={a} variant="ghost" size="sm" onClick={() => openAttachment(a)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          ))}
                          {(!f.attachments || (f.attachments || []).length === 0) && <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell> */}
                      <TableCell>{getStatusBadge(f.status)}</TableCell>
                      <TableCell className="text-right">
                        {f.admin_response ? <div className="text-sm text-muted-foreground">Response: {f.admin_response}</div> : <div className="text-sm text-muted-foreground">-</div>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
