import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import VerifyOTPPage   from "./pages/auth/VerifyOTPPage";
import PendingApprovalPage from "./pages/auth/PendingApprovalPage";
import ForgotUsernamePage from "./pages/auth/ForgotUsernamePage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import { StudentLayout } from "./components/student/StudentLayout";
import StudentDashboardPage from "./pages/student/DashboardPage";
import ProfilePage from "./pages/student/ProfilePage";
import UploadPage from "./pages/student/UploadPage";
import HistoryPage from "./pages/student/HistoryPage";
import FeedbackPage from "./pages/student/FeedbackPage";
import FeedbackHistoryPage from "./pages/student/FeedbackHistoryPage";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/DashboardPage";
import StudentsPage from "./pages/admin/StudentsPage";
import UploadsPage from "./pages/admin/UploadsPage";
import FeedbacksPage from "./pages/admin/FeedbacksPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/verify-otp" element={<VerifyOTPPage />} />
            <Route path="/auth/pending-approval" element={<PendingApprovalPage />} />
            <Route path="/auth/forgot-username" element={<ForgotUsernamePage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/student" element={<StudentLayout />}>
              <Route path="dashboard" element={<StudentDashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="feedback/history" element={<FeedbackHistoryPage />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="uploads" element={<UploadsPage />} />
              <Route path="feedbacks" element={<FeedbacksPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
