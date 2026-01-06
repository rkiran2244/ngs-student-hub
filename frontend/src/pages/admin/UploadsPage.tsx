import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
  Search, 
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { adminApi, DailyUpload } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type UploadWithStudent = DailyUpload & { student_name: string };

export default function UploadsPage() {
  const { toast } = useToast();
  const [uploads, setUploads] = useState<UploadWithStudent[]>([]);
  const [filteredUploads, setFilteredUploads] = useState<UploadWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<UploadWithStudent | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getAllUploads();
      setUploads(data || []);
      setFilteredUploads(data || []);
    } catch (error) {
      console.error('Failed to fetch uploads:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load uploads';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      setUploads([]);
      setFilteredUploads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...uploads];

    if (searchQuery) {
      filtered = filtered.filter((upload) =>
        upload.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        upload.student_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((upload) => upload.status === statusFilter);
    }

    setFilteredUploads(filtered);
  }, [uploads, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Approved</Badge>;
      case 'reviewed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Reviewed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleReviewClick = (upload: UploadWithStudent) => {
    setSelectedUpload(upload);
    setAdminNotes(upload.admin_feedback || '');
    setReviewDialogOpen(true);
  };

  const handleUpdateStatus = async (status: 'reviewed' | 'approved' | 'rejected') => {
    if (!selectedUpload) return;
    
    setIsProcessing(true);
    try {
      await adminApi.updateUploadStatus(selectedUpload.id, status, adminNotes);
      toast({
        title: 'Status updated!',
        description: `Upload marked as ${status}.`,
      });
      setReviewDialogOpen(false);
      setUploads(uploads.map(u => 
        u.id === selectedUpload.id 
          ? { ...u, status, admin_feedback: adminNotes }
          : u
      ));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update status',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (upload: UploadWithStudent) => {
    toast({
      title: 'Download started',
      description: `Downloading ${upload.file_name}...`,
    });
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Reviews</h1>
        <p className="mt-1 text-muted-foreground">
          Review and manage student work submissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{uploads.length}</div>
            <p className="text-sm text-muted-foreground">Total Uploads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {uploads.filter((u) => u.status === 'pending').length}
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {uploads.filter((u) => u.status === 'reviewed').length}
            </div>
            <p className="text-sm text-muted-foreground">Reviewed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {uploads.filter((u) => u.status === 'approved').length}
            </div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by file name or student..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            {filteredUploads.length} of {uploads.length} uploads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUploads.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-foreground">
                No uploads found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {uploads.length === 0 ? 'No uploads have been submitted yet.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{upload.file_name}</p>
                            {upload.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {upload.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{upload.student_name}</TableCell>
                      <TableCell>{formatFileSize(upload.file_size)}</TableCell>
                      <TableCell>
                        {upload.upload_date ? format(new Date(upload.upload_date), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(upload.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(upload)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewClick(upload)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              {selectedUpload?.file_name} by {selectedUpload?.student_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border p-4 w-[670px]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium  w-[480px]">{selectedUpload?.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUpload && formatFileSize(selectedUpload.file_size)} • 
                    Uploaded {selectedUpload?.upload_date && format(new Date(selectedUpload.upload_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              {selectedUpload?.description && (
                <p className="mt-3 text-sm text-muted-foreground">
                  <strong>Description:</strong> {selectedUpload.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Admin Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add feedback or notes for the student..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button 
              variant="outline" 
              onClick={() => setReviewDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto border-red-500 text-red-600 hover:bg-red-50"
              onClick={() => handleUpdateStatus('rejected')}
              disabled={isProcessing}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Reject
            </Button>
            <Button
              variant="outline"
              onClick={() => handleUpdateStatus('reviewed')}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              <Eye className="mr-1 h-4 w-4" />
              Mark Reviewed
            </Button>
            <Button
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              onClick={() => handleUpdateStatus('approved')}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1 h-4 w-4" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
