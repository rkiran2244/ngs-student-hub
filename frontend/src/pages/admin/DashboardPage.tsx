import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { adminApi, User, DailyUpload } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [uploads, setUploads] = useState<(DailyUpload & { student_name: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsData, uploadsData] = await Promise.all([
          adminApi.getAllStudents(),
          adminApi.getAllUploads(),
        ]);
        setStudents(studentsData || []);
        setUploads(uploadsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setStudents([]); // Set empty arrays on error
        setUploads([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = {
    total: students.length,
    pending: students.filter(s => s.status === 'pending').length,
    active: students.filter(s => s.status === 'active').length,
    suspended: students.filter(s => s.status === 'suspended').length,
    pendingUploads: uploads.filter(u => u.status === 'pending').length,
  };

  const pendingStudents = students.filter(s => s.status === 'pending').slice(0, 3);
  const recentUploads = uploads.filter(u => u.status === 'pending').slice(0, 3);

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Manage students, verify accounts, and review submissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Students
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suspended
            </CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reviews
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pendingUploads}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Pending Items */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Student Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Pending Approvals
              </CardTitle>
              <CardDescription>Students awaiting verification</CardDescription>
            </div>
            <Link to="/admin/students">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : pendingStudents.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
                <p className="mt-2">All students verified!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                        <Users className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {student.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.email}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(student.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Upload Reviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Pending Reviews
              </CardTitle>
              <CardDescription>Uploads awaiting review</CardDescription>
            </div>
            <Link to="/admin/uploads">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : recentUploads.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
                <p className="mt-2">All uploads reviewed!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {upload.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {upload.student_name}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Link to="/admin/students">
            <Button className="w-full justify-between" variant="outline">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Students
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/admin/uploads">
            <Button className="w-full justify-between" variant="outline">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Review Uploads
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
