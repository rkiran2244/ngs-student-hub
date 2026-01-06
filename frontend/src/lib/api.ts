// API Types

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function requireAuthHeaders() {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

// Legacy auth API (now implemented via backend)
export const authApi = {
  forgotUsername: async (email: string) => {
    const res = await fetch(`${API_URL}/auth/forgot-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  forgotPassword: async (email: string) => {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    return res.json();
  },

  verifyOtp: async (email: string, otp: string) => {
    // stubbed for now
    return { success: true, message: 'Email verified successfully.' };
  },

  changePassword: async (newPassword: string) => {
    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ newPassword }),
    });
    if (res.status === 401) throw new Error('Not authenticated');
    return res.json();
  },

  resendOtp: async (email: string) => {
    // stubbed
    return { success: true, message: 'Verification email resent.' };
  },
};

export interface User {
  id: string;
  user_id: string;
  username: string | null;
  email: string;
  full_name: string;
  contact_number: string | null;
  college_name: string | null;
  college_id: string | null;
  college_email: string | null;
  city?: string | null;
  pincode?: string | null;
  avatar_url?: string | null;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
}

export interface DailyUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  upload_date: string | null;
  description: string | null;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  admin_feedback: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string | null;
}

export interface Feedback {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  message: string;
  rating?: number;
  status: 'pending' | 'responded' | 'resolved';
  admin_response?: string;
  created_at: string;
  updated_at: string;
}

// Admin API
export const adminApi = {
  getAllStudents: async (): Promise<User[]> => {
    const res = await fetch(`${API_URL}/admin/students`, { headers: { ...getAuthHeaders() } });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'Failed to fetch students');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  deleteStudent: async (profileId: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/admin/students/${profileId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to delete student');
    }
    return data;
  },

  approveStudent: async (profileId: string, username: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/admin/students/${profileId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to approve student');
    return data;
  },

  suspendStudent: async (profileId: string) => {
    const res = await fetch(`${API_URL}/admin/students/${profileId}/suspend`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to suspend student');
    return data;
  },

  activateStudent: async (profileId: string) => {
    const res = await fetch(`${API_URL}/admin/students/${profileId}/activate`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to activate student');
    return data;
  },

  getStudentUploads: async (userId: string): Promise<DailyUpload[]> => {
    const res = await fetch(`${API_URL}/admin/uploads`, { headers: { ...getAuthHeaders() } });
    if (!res.ok) throw new Error('Failed to fetch uploads');
    const all = await res.json();
    return (all || []).filter((u: DailyUpload) => u.user_id === userId);
  },

  updateUploadStatus: async (uploadId: string, status: 'reviewed' | 'approved' | 'rejected', feedback?: string) => {
    const res = await fetch(`${API_URL}/admin/uploads/${uploadId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status, feedback }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to update upload status');
    return data;
  },

  getAllUploads: async () => {
    const res = await fetch(`${API_URL}/admin/uploads`, { headers: { ...getAuthHeaders() } });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'Failed to fetch uploads');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  // Admin feedback APIs
  getFeedbacks: async (params?: { category?: string; rating?: number; status?: string; start?: string; end?: string }) => {
    const query = params
      ? '?' + Object.entries(params).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
      : '';
    const res = await fetch(`${API_URL}/admin/feedback${query}`, { headers: { ...getAuthHeaders() } });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'Failed to fetch feedbacks');
    }
    return res.json();
  },

  getFeedback: async (id: string) => {
    const res = await fetch(`${API_URL}/admin/feedback/${id}`, { headers: { ...getAuthHeaders() } });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'Failed to fetch feedback details');
    }
    return res.json();
  },

  respondFeedback: async (id: string, response: string, status?: string) => {
    const res = await fetch(`${API_URL}/admin/feedback/${id}/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ response, status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to update feedback');
    return data;
  },

  updateFeedbackStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_URL}/admin/feedback/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to update feedback status');
    return data;
  },
};

// Student API
export const studentApi = {
  getUploads: async (): Promise<DailyUpload[]> => {
    const res = await fetch(`${API_URL}/student/uploads`, { headers: { ...getAuthHeaders() } });
    if (res.status === 401) throw new Error('Not authenticated');
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'Failed to fetch uploads');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  uploadFile: async (file: File, description?: string): Promise<{ success: boolean; message: string; upload?: DailyUpload; filename?: string; mimetype?: string; file_url?: string; fileUrl?: string }> => {
    const form = new FormData();
    form.append('file', file);
    if (description) form.append('description', description);

    const res = await fetch(`${API_URL}/student/uploads`, {
      method: 'POST',
      headers: { ...requireAuthHeaders() },
      body: form,
    });

    if (res.status === 401) throw new Error('Not authenticated');
    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error('Invalid response from server');
    }
    if (!res.ok) {
      // Log server response for easier debugging in DevTools
      console.error('File upload failed', res.status, data);
      // Include debug fields from backend (if present) in the thrown error message
      const debugKeys = ['filename', 'mimetype', 'magic_hex', 'allowed_extensions'];
      const debugParts = debugKeys
        .map((k) => (data && (data as Record<string, unknown>)[k] ? `${k}: ${String((data as Record<string, unknown>)[k])}` : null))
        .filter(Boolean);
      const debug = debugParts.length ? ` — ${debugParts.join(', ')}` : '';
      throw new Error((data?.message || 'Failed to upload file') + debug);
    }
    return data;
  },

  getProfile: async (): Promise<User> => {
    const res = await fetch(`${API_URL}/student/profile`, { headers: { ...requireAuthHeaders() } });
    if (res.status === 401) throw new Error('Not authenticated');
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  // Feedback API
  submitFeedback: async (payload: {
    category: string;
    subject: string;
    message: string;
    rating?: number;
    files?: File[];
  }): Promise<{ success: boolean; message: string; feedback_id?: string }> => {
    // If files present, use multipart/form-data
    if (payload.files && payload.files.length > 0) {
      const form = new FormData();
      form.append('category', payload.category);
      form.append('subject', payload.subject);
      form.append('message', payload.message);
      if (typeof payload.rating !== 'undefined') form.append('rating', String(payload.rating));
      payload.files.forEach((f) => form.append('files', f));

      const res = await fetch(`${API_URL}/student/feedback`, {
        method: 'POST',
        headers: { ...requireAuthHeaders() },
        body: form,
      });
      if (res.status === 401) throw new Error('Not authenticated');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to submit feedback');
      return data;
    }

    const res = await fetch(`${API_URL}/student/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...requireAuthHeaders() },
      body: JSON.stringify({ category: payload.category, subject: payload.subject, message: payload.message, rating: payload.rating }),
    });
    if (res.status === 401) throw new Error('Not authenticated');
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to submit feedback');
    return data;
  },

  getFeedbacks: async (): Promise<Feedback[]> => {
    const res = await fetch(`${API_URL}/student/feedback`, { headers: { ...requireAuthHeaders() } });
    if (res.status === 401) throw new Error('Not authenticated');
    if (!res.ok) throw new Error('Failed to fetch feedbacks');
    return res.json();
  },

  updateProfile: async (data: {
    fullName?: string;
    email?: string;
    contactNumber?: string;
    collegeName?: string;
    collegeId?: string;
    collegeEmail?: string;
    avatarUrl?: string;
    avatar_url?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/student/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...requireAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (res.status === 401) throw new Error('Not authenticated');
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },
};
