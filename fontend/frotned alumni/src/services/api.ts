// API Client for Alumni App Backend Integration

const API_BASE = (import.meta.env.VITE_API_URL as string)?.replace(/\/$/, '') || '/api/v1';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('alumni_token') || null;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('alumni_token', token);
    } else {
      localStorage.removeItem('alumni_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          error: json?.error || json?.message || `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      return {
        success: true,
        data: json?.data !== undefined ? json.data : json,
      };
    } catch (err: any) {
      console.warn(`[API] Failed request to ${endpoint}:`, err.message);
      return { success: false, error: err.message || 'Network connection failed' };
    }
  }

  // Auth endpoints
  async login(emailOrMobile: string, password: string) {
    const res = await this.request<{ user: any; tokens: { accessToken: string; refreshToken: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrMobile, password }),
    });
    if (res.success && res.data?.tokens?.accessToken) {
      this.setToken(res.data.tokens.accessToken);
    }
    return res;
  }

  async register(data: {
    name: string;
    email?: string;
    mobile?: string;
    password: string;
    role: 'STUDENT' | 'ALUMNI';
    branch: string;
    batch?: string;
    currentCompany?: string;
    designation?: string;
    currentYear?: number;
    expectedPassoutYear?: number;
    alumniBranch?: string;
    passoutYear?: number;
  }) {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyOtp(emailOrMobile: string, otp: string) {
    const res = await this.request<{ user: any; tokens: { accessToken: string; refreshToken: string } }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ emailOrMobile, otp }),
    });
    if (res.success && res.data?.tokens?.accessToken) {
      this.setToken(res.data.tokens.accessToken);
    }
    return res;
  }

  async resendOtp(emailOrMobile: string) {
    return await this.request<{ previewOtpForDev?: string }>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ emailOrMobile }),
    });
  }

  async getMe() {
    return await this.request('/users/me');
  }

  // Claim profile endpoints
  async claimLookup(identifier: string, role?: string) {
    return await this.request<{
      found: boolean;
      message?: string;
      user?: {
        id: string;
        name: string;
        email: string;
        maskedEmail: string;
        role: 'ALUMNI' | 'STUDENT';
        branch: string;
        batch: string;
        company?: string;
        city?: string;
        isClaimed: boolean;
      };
    }>('/auth/claim-lookup', {
      method: 'POST',
      body: JSON.stringify({ identifier, role }),
    });
  }

  async claimSendOtp(userId: string) {
    return await this.request('/auth/claim-send-otp', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async claimActivate(data: {
    userId: string;
    otp: string;
    newPassword: string;
    headline?: string;
    company?: string;
    city?: string;
  }) {
    const res = await this.request<{
      user: any;
      tokens: { accessToken: string; refreshToken: string };
      message: string;
    }>('/auth/claim-activate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data?.tokens?.accessToken) {
      this.setToken(res.data.tokens.accessToken);
    }
    return res;
  }

  // Users & Directory
  async searchUsers(query?: string, role?: string) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (role) params.append('role', role);
    return await this.request(`/users/search?${params.toString()}`);
  }

  // Posts & Jobs
  async getPosts(type?: string) {
    const query = type ? `?type=${type}` : '';
    return await this.request(`/posts${query}`);
  }

  async createPost(data: { title: string; description: string; type: 'GENERAL' | 'JOB' | 'INTERNSHIP'; company?: string; location?: string }) {
    return await this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Discussions
  async getDiscussions() {
    return await this.request('/discussions');
  }

  async createDiscussion(data: { title: string; description: string; category: string; groupId?: string }) {
    return await this.request('/discussions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async upvoteDiscussion(threadId: string) {
    return await this.request(`/discussions/${threadId}/upvote`, {
      method: 'POST',
    });
  }

  async replyDiscussion(threadId: string, content: string) {
    return await this.request(`/discussions/${threadId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Connections
  async getConnections() {
    return await this.request('/connections');
  }

  async requestConnection(receiverId: string) {
    return await this.request(`/connections/request/${receiverId}`, {
      method: 'POST',
    });
  }

  async respondConnection(connectionId: string, status: 'ACCEPTED' | 'REJECTED') {
    return await this.request(`/connections/${connectionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Mentorship
  async getMentors() {
    return await this.request('/mentorship/mentors');
  }

  async requestMentorship(mentorId: string, message?: string) {
    return await this.request('/mentorship/request', {
      method: 'POST',
      body: JSON.stringify({ mentorId, message: message || 'Requesting mentorship guidance' }),
    });
  }

  // Groups
  async getGroups() {
    return await this.request('/groups');
  }

  async joinGroup(groupId: string) {
    return await this.request(`/groups/${groupId}/join`, {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
