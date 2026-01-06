import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Clock, 
  CheckCircle2,
  User,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { studentApi, DailyUpload } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<DailyUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const data = await studentApi.getUploads();
        setUploads(data || []);
      } catch (error) {
        console.error('Failed to fetch uploads:', error);
        setUploads([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchUploads();
  }, []);

  const stats = {
    total: uploads.length,
    pending: uploads.filter(u => u.status === 'pending').length,
    approved: uploads.filter(u => u.status === 'approved').length,
    reviewed: uploads.filter(u => u.status === 'reviewed').length,
  };

  const recentUploads = uploads.slice(0, 3);

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.profile?.full_name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's an overview of your daily work submissions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="h-14 w-14 rounded-full overflow-hidden bg-primary/10">
              {user?.profile?.avatar_url ? (
                <img
                  src={
                    user.profile.avatar_url.startsWith('data:')
                      ? user.profile.avatar_url
                      : user.profile.avatar_url.startsWith('http')
                      ? user.profile.avatar_url
                      : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${user.profile.avatar_url}`
                  }
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-primary m-3" />
              )}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-muted-foreground">{user?.profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.profile?.username ? `@${user.profile.username}` : user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Uploads
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
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
              Reviewed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.reviewed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Uploads */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to do</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/student/upload">
              <Button className="w-full justify-between mb-4" variant="outline">
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Daily Work
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/student/profile">
              <Button className="w-full justify-between mb-4" variant="outline">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Update Profile
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/student/history">
              <Button className="w-full justify-between" variant="outline">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  View All Uploads
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>Your latest work submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : recentUploads.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No uploads yet. Start by uploading your daily work!
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
                        <p className="text-sm font-medium text-foreground w-9">
                          {upload.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {upload.upload_date ? new Date(upload.upload_date).toLocaleDateString() : 'N/A'}
                        </p>
                        <div className="mt-1">{getStatusBadge(upload.status)}</div>
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
