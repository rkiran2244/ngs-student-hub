import { useEffect, useState, useCallback } from 'react';

import { format } from 'date-fns';
import { 
  Users, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  Eye,
  Loader2,
  Mail,
  MoreHorizontal
} from 'lucide-react';
import { adminApi, User } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function StudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // View student details
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedStudentView, setSelectedStudentView] = useState<User | null>(null);
  const [studentUploads, setStudentUploads] = useState<any[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getAllStudents();
      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load students';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    let filtered = [...students];

    if (searchQuery) {
      filtered = filtered.filter((student) =>
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.username?.toLowerCase().includes(searchQuery.toLowerCase())||
        student.college_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((student) => student.status === statusFilter);
    }

    setFilteredStudents(filtered);
  }, [students, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Suspended</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
    }
  };

  const generateUsername = () => {
    const prefix = 'ngs';
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(100 + Math.random() * 900);
    return `${prefix}${year}${random}`;
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleApproveClick = (student: User) => {
    setSelectedStudent(student);
    setGeneratedUsername(generateUsername());
    setApproveDialogOpen(true);
  };

  const loadStudentUploads = async (userId: string) => {
    setUploadsLoading(true);
    try {
      const uploads = await adminApi.getStudentUploads(userId);
      setStudentUploads(uploads || []);
    } catch (error) {
      console.error('Failed to fetch student uploads:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load student uploads' });
      setStudentUploads([]);
    } finally {
      setUploadsLoading(false);
    }
  };

  const handleViewClick = async (student: User) => {
    setSelectedStudentView(student);
    setViewDialogOpen(true);
    // fetch uploads for this student
    if (student.user_id) {
      await loadStudentUploads(student.user_id);
    }
  };

  // Delete student
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (student: User) => {
    setDeleteTarget(student);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await adminApi.deleteStudent(deleteTarget.id);
      if (res.success) {
        toast({ title: 'Student deleted', description: `${deleteTarget.full_name} was removed.` });
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
        await fetchStudents();
      } else {
        throw new Error(res.message || 'Failed to delete student');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete student';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedStudent || !generatedUsername.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await adminApi.approveStudent(selectedStudent.id, generatedUsername.trim());
      if (result.success) {
        toast({
          title: 'Student approved!',
          description: `Username ${generatedUsername} has been assigned and an email has been sent to the student.`,
        });
        setApproveDialogOpen(false);
        // Refresh the student list to get updated data
        await fetchStudents();
      } else {
        throw new Error(result.message || 'Failed to approve student');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve student. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuspend = async (student: User) => {
    setIsProcessing(true);
    try {
      const result = await adminApi.suspendStudent(student.id);
      if (result.success) {
        toast({
          title: 'Student suspended',
          description: `${student.full_name} has been suspended.`,
        });
        // Refresh the student list to get updated data
        await fetchStudents();
      } else {
        throw new Error(result.message || 'Failed to suspend student');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to suspend student. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivate = async (student: User) => {
    setIsProcessing(true);
    try {
      const result = await adminApi.activateStudent(student.id);
      if (result.success) {
        toast({
          title: 'Student activated',
          description: `${student.full_name} has been activated.`,
        });
        // Refresh the student list to get updated data
        await fetchStudents();
      } else {
        throw new Error(result.message || 'Failed to activate student');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate student. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
        <p className="mt-1 text-muted-foreground">
          View, verify, and manage student accounts
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {students.filter((s) => s.status === 'pending').length}
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {students.filter((s) => s.status === 'active').length}
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {students.filter((s) => s.status === 'suspended').length}
            </div>
            <p className="text-sm text-muted-foreground">Suspended</p>
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
                placeholder="Search by name, email,username, or college name..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            {filteredStudents.length} of {students.length} students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-foreground">
                No students found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {students.length === 0 ? 'No students have registered yet.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {student.avatar_url ? (
                              <AvatarImage
                                src={
                                  student.avatar_url.startsWith('http')
                                    ? student.avatar_url
                                    : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${student.avatar_url}`
                                }
                                alt={student.full_name}
                              />
                            ) : null}
                            <AvatarFallback>{getInitials(student.full_name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {student.full_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {student.username || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {student.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {student.college_name || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(student.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                          {student.status === 'pending' && (
                            <Button
                              size="sm"
                              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveClick(student)}
                              disabled={isProcessing}
                            >
                              <UserCheck className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                          )}
                          {student.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                              onClick={() => handleSuspend(student)}
                              disabled={isProcessing}
                            >
                              <UserX className="mr-1 h-4 w-4" />
                              Suspend
                            </Button>
                          )}
                          {student.status === 'suspended' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => handleActivate(student)}
                              disabled={isProcessing}
                            >
                              <UserCheck className="mr-1 h-4 w-4" />
                              Activate
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => handleViewClick(student)}>
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* More actions */}
                          {/* <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => handleViewClick(student)}>View</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => handleApproveClick(student)} disabled={student.status !== 'pending'}>Approve</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleSuspend(student)} disabled={student.status !== 'active'}>Suspend</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleActivate(student)} disabled={student.status !== 'suspended'}>Activate</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteClick(student)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu> */}
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

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Student</DialogTitle>
              <DialogDescription>
                Assign a username to {selectedStudent?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Generated Username</Label>
                <Input
                  id="username"
                  value={generatedUsername}
                  onChange={(e) => setGeneratedUsername(e.target.value)}
                  placeholder="e.g., ngs25110"
                />
                <p className="text-xs text-muted-foreground">
                  This username will be assigned to the student
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGeneratedUsername(generateUsername())}
              >
                Regenerate
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={isProcessing || !generatedUsername}
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Approve & Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* View Student Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Full profile and uploads for {selectedStudentView?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 py-4">
            <div>
              <p className="text-sm text-muted-foreground">Full name</p>
              <div className="font-medium">{selectedStudentView?.full_name}</div>

              <p className="mt-3 text-sm text-muted-foreground">Email</p>
              <div className="font-medium">{selectedStudentView?.email}</div>

              <p className="mt-3 text-sm text-muted-foreground">Username</p>
              <div className="font-medium">{selectedStudentView?.username || '-'}</div>

              <p className="mt-3 text-sm text-muted-foreground">Contact Number</p>
              <div className="font-medium">{selectedStudentView?.contact_number || '-'}</div>

              <p className="mt-3 text-sm text-muted-foreground">College</p>
              <div className="font-medium">{selectedStudentView?.college_name || '-'}</div>

              <p className="mt-3 text-sm text-muted-foreground">City</p>
              <div className="font-medium">{selectedStudentView?.city || '-'}</div>

              <p className="mt-3 text-sm text-muted-foreground">Pincode</p>
              <div className="font-medium">{selectedStudentView?.pincode || '-'}</div>

              <p className="mt-3 text-sm text-muted-foreground">Status</p>
              <div className="font-medium">{selectedStudentView?.status}</div>
            </div>

            <div>
              <h3 className="text-sm font-medium">Uploads</h3>
              {uploadsLoading ? (
                <div className="py-6 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : studentUploads.length === 0 ? (
                <div className="py-6 text-sm text-muted-foreground">No uploads found for this student.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentUploads.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.file_name}</TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">{u.status}</Badge>
                          </TableCell>
                          <TableCell>{u.upload_date ? format(new Date(u.upload_date), 'MMM dd, yyyy') : '-'}</TableCell>
                          <TableCell className="text-right">
                            <a
                              className="text-sm text-primary hover:underline"
                              href={u.file_url && u.file_url.startsWith('http') ? u.file_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${u.file_url}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {deleteTarget?.full_name}? This action will remove their account and all uploads.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}>
              Cancel
            </Button>
            <Button className="text-white bg-red-600 hover:bg-red-700" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
