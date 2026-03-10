import type { ApiResponse, PaginatedResponse, User, Tokens, Destination, Post, Comment, Report, GuideProfile } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE_URL}${url}`, { ...options, headers });
}

export async function apiFetchFormData(
  url: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  delete headers['Content-Type'];

  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    method: options.method || 'POST',
    body: formData,
    headers,
  });
}

// ── Flat response types ───────────────────────────────────────────────────────

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
  email?: string;
  role?: string;
  user?: User;
  tokens?: Tokens;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  user?: User;
  tokens?: Tokens;
  requiresProfileCompletion?: boolean;
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User; tokens: Tokens }>> => {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  register: async (data: {
    fullName: string;
    email: string;
    password: string;
    role: string;
  }): Promise<RegisterResponse> => {
    const response = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  verifyOtp: async (
    userId: string,
    otp: string,
    refreshToken?: string
  ): Promise<VerifyOtpResponse> => {
    const response = await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        otp,
        ...(refreshToken ? { refresh: refreshToken } : {}),
      }),
    });
    return response.json();
  },

  forgotPassword: async (
    email: string
  ): Promise<{ detail?: string }> => {
    const response = await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  verifyResetOtp: async (
    email: string,
    otp: string
  ): Promise<{ detail?: string; resetToken?: string }> => {
    const response = await apiFetch('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    return response.json();
  },

  resetPassword: async (
    email: string,
    resetToken: string,
    newPassword: string,
    confirmPassword:string,
  ): Promise<{ detail?: string }> => {
    const response = await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, resetToken, newPassword , confirmPassword}),
    });
    return response.json();
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiFetch('/auth/profile');
    return response.json();
  },

  updateProfile: async (data: {
    fullName?: string;
    phoneNumber?: string;
    photo?: File;
  }): Promise<ApiResponse<User>> => {
    if (data.photo) {
      const formData = new FormData();
      formData.append('photo', data.photo);
      if (data.fullName)    formData.append('fullName',    data.fullName);
      if (data.phoneNumber) formData.append('phoneNumber', data.phoneNumber);
      const response = await apiFetchFormData('/auth/profile', formData, { method: 'PATCH' });
      return response.json();
    }
    const { photo: _, ...rest } = data;
    const response = await apiFetch('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(rest),
    });
    return response.json();
  },
};

// ── Guide API ─────────────────────────────────────────────────────────────────

export const guideApi = {
  createProfile: async (data: {
    licenseNumber: string;
    licenseIssuedBy: string;
    bio: string;
  }): Promise<ApiResponse<GuideProfile>> => {
    const response = await apiFetch('/guides/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updateProfile: async (
    id: string,
    data: Partial<GuideProfile>
  ): Promise<ApiResponse<GuideProfile>> => {
    const response = await apiFetch(`/guides/profile/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getProfile: async (id: string): Promise<ApiResponse<GuideProfile>> => {
    const response = await apiFetch(`/guides/profile/${id}`);
    return response.json();
  },
};

// ── Destinations API ──────────────────────────────────────────────────────────

export const destinationsApi = {
  getAll: async (): Promise<ApiResponse<Destination[]>> => {
    const response = await apiFetch('/v1/destinations');
    return response.json();
  },

  getById: async (id: string): Promise<ApiResponse<Destination>> => {
    const response = await apiFetch(`/v1/destinations/${id}`);
    return response.json();
  },

  search: async (query: string): Promise<ApiResponse<Destination[]>> => {
    const response = await apiFetch(`/v1/destinations?search=${encodeURIComponent(query)}`);
    return response.json();
  },
};

// ── Posts API ─────────────────────────────────────────────────────────────────

export const postsApi = {
  getAll: async (page = 1): Promise<ApiResponse<PaginatedResponse<Post>>> => {
    const response = await apiFetch(`/v1/posts/?page=${page}`);
    return response.json();
  },

  create: async (data: { textContent: string; image?: File }): Promise<ApiResponse<Post>> => {
    if (data.image) {
      const formData = new FormData();
      formData.append('textContent', data.textContent);
      formData.append('image', data.image);
      const response = await apiFetchFormData('/v1/posts/', formData);
      return response.json();
    }
    const response = await apiFetch('/v1/posts/', {
      method: 'POST',
      body: JSON.stringify({ textContent: data.textContent }),
    });
    return response.json();
  },

  bookmark: async (
    id: string
  ): Promise<ApiResponse<{ bookmarked: boolean; count: number }>> => {
    const response = await apiFetch(`/v1/posts/${id}/bookmark/`, { method: 'POST' });
    return response.json();
  },

  share: async (
    id: string,
    platform: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiFetch(`/v1/posts/${id}/share/`, {
      method: 'POST',
      body: JSON.stringify({ platform }),
    });
    return response.json();
  },

  getComments: async (id: string): Promise<ApiResponse<Comment[]>> => {
    const response = await apiFetch(`/v1/posts/${id}/comments/`);
    return response.json();
  },

  createComment: async (
    id: string,
    data: { textContent: string; parent?: string; image?: File }
  ): Promise<ApiResponse<Comment>> => {
    if (data.image) {
      const formData = new FormData();
      formData.append('textContent', data.textContent);
      formData.append('image', data.image);
      if (data.parent) formData.append('parent', data.parent);
      const response = await apiFetchFormData(`/v1/posts/${id}/comments/`, formData);
      return response.json();
    }
    const response = await apiFetch(`/v1/posts/${id}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ textContent: data.textContent, parent: data.parent }),
    });
    return response.json();
  },
};

// ── Reports API ───────────────────────────────────────────────────────────────

export const reportsApi = {
  getAll: async (): Promise<ApiResponse<Report[]>> => {
    const response = await apiFetch('/v1/reports');
    return response.json();
  },

  create: async (data: {
    destinationId: string;
    type: string;
    title: string;
    description: string;
    crowdLevel?: string;
    tags: string[];
    images: File[];
  }): Promise<ApiResponse<Report>> => {
    const formData = new FormData();
    formData.append('destinationId', data.destinationId);
    formData.append('type',          data.type);
    formData.append('title',         data.title);
    formData.append('description',   data.description);
    if (data.crowdLevel) formData.append('crowdLevel', data.crowdLevel);
    formData.append('tags', JSON.stringify(data.tags));
    data.images.forEach((image, i) => formData.append(`image_${i}`, image));
    const response = await apiFetchFormData('/v1/reports', formData);
    return response.json();
  },
};

// ── Admin API ─────────────────────────────────────────────────────────────────

export const adminApi = {
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await apiFetch('/admin/users/');
    return response.json();
  },

  updateUser: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiFetch(`/admin/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiFetch(`/admin/users/${id}/`, { method: 'DELETE' });
    return response.json();
  },

  getGuides: async (): Promise<ApiResponse<(User & { guideProfile: GuideProfile })[]>> => {
    const response = await apiFetch('/admin/guides/');
    return response.json();
  },

  updateGuide: async (
    id: string,
    data: Partial<GuideProfile>
  ): Promise<ApiResponse<GuideProfile>> => {
    const response = await apiFetch(`/admin/guides/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getPosts: async (): Promise<ApiResponse<Post[]>> => {
    const response = await apiFetch('/admin/posts/');
    return response.json();
  },

  deletePost: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiFetch(`/admin/posts/${id}/`, { method: 'DELETE' });
    return response.json();
  },

  getReports: async (): Promise<ApiResponse<Report[]>> => {
    const response = await apiFetch('/admin/reports/');
    return response.json();
  },

  updateReport: async (
    id: string,
    data: Partial<Report>
  ): Promise<ApiResponse<Report>> => {
    const response = await apiFetch(`/admin/reports/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getDestinations: async (): Promise<ApiResponse<Destination[]>> => {
    const response = await apiFetch('/admin/destinations/');
    return response.json();
  },

  createDestination: async (
    data: Partial<Destination>
  ): Promise<ApiResponse<Destination>> => {
    const response = await apiFetch('/admin/destinations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updateDestination: async (
    id: string,
    data: Partial<Destination>
  ): Promise<ApiResponse<Destination>> => {
    const response = await apiFetch(`/admin/destinations/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteDestination: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiFetch(`/admin/destinations/${id}/`, { method: 'DELETE' });
    return response.json();
  },

  getDashboardStats: async (): Promise<ApiResponse<{
    totalUsers: number;
    totalGuides: number;
    totalTourists: number;
    pendingVerifications: number;
    totalPosts: number;
    totalReports: number;
    totalDestinations: number;
  }>> => {
    const response = await apiFetch('/admin/dashboard/');
    return response.json();
  },
};