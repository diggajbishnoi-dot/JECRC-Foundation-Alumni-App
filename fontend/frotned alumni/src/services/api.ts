// API Client for Alumni App Backend Integration

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string)?.replace(/\/$/, '') || '/api/v1';

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;

  constructor() {
    // SessionStorage is safer than localStorage because it automatically clears on tab close
    // and is isolated from persistent cross-tab disk storage.
    this.accessToken = sessionStorage.getItem('alumni_access_token') || localStorage.getItem('alumni_token') || null;
    this.refreshToken = sessionStorage.getItem('alumni_refresh_token') || null;

    // Clean up legacy localStorage token if present
    if (localStorage.getItem('alumni_token')) {
      localStorage.removeItem('alumni_token');
      if (this.accessToken) {
        sessionStorage.setItem('alumni_access_token', this.accessToken);
      }
    }
  }

  setTokens(tokens: { accessToken: string; refreshToken?: string } | null) {
    if (tokens && tokens.accessToken) {
      this.accessToken = tokens.accessToken;
      sessionStorage.setItem('alumni_access_token', tokens.accessToken);
      if (tokens.refreshToken) {
        this.refreshToken = tokens.refreshToken;
        sessionStorage.setItem('alumni_refresh_token', tokens.refreshToken);
      }
    } else {
      this.accessToken = null;
      this.refreshToken = null;
      sessionStorage.removeItem('alumni_access_token');
      sessionStorage.removeItem('alumni_refresh_token');
      localStorage.removeItem('alumni_token');
    }
  }

  setToken(token: string | null) {
    this.setTokens(token ? { accessToken: token } : null);
  }

  getToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  private inflightRequests = new Map<string, Promise<any>>();

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    const cacheKey = isGet ? `GET:${endpoint}` : null;

    if (cacheKey && this.inflightRequests.has(cacheKey)) {
      return this.inflightRequests.get(cacheKey)!;
    }

    const requestPromise = (async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized by attempting a single token refresh
      if (res.status === 401 && !isRetry && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
        const refreshed = await this.refreshSession();
        if (refreshed) {
          return await this.request<T>(endpoint, options, true);
        }
      }

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        let errorMsg = '';
        if (Array.isArray(json?.message)) {
          errorMsg = json.message.join(', ');
        } else if (typeof json?.message === 'string' && json.message.trim()) {
          errorMsg = json.message;
        } else if (typeof json?.error === 'string' && json.error.trim() && json.error !== 'Bad Request' && json.error !== 'Internal Server Error') {
          errorMsg = json.error;
        } else if (typeof json?.error === 'string') {
          errorMsg = json.error;
        } else {
          errorMsg = `HTTP ${res.status}: ${res.statusText}`;
        }
        return {
          success: false,
          error: String(errorMsg),
        };
      }

      return {
        success: true,
        data: json?.data !== undefined ? json.data : json,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed' };
    }
    })();

    if (cacheKey) {
      this.inflightRequests.set(cacheKey, requestPromise);
      requestPromise.finally(() => {
        this.inflightRequests.delete(cacheKey);
      });
    }

    return requestPromise;
  }

  async refreshSession(): Promise<boolean> {
    if (!this.refreshToken || this.isRefreshing) {
      return false;
    }
    this.isRefreshing = true;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.tokens?.accessToken) {
        this.setTokens(json.tokens);
        return true;
      } else {
        this.setTokens(null);
        return false;
      }
    } catch {
      this.setTokens(null);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  async logoutBackend() {
    if (this.accessToken) {
      await this.request('/auth/logout', { method: 'POST' }).catch(() => {});
    }
    this.setTokens(null);
  }

  // Auth endpoints
  async login(emailOrMobile: string, password: string) {
    const res = await this.request<{ user: any; tokens: { accessToken: string; refreshToken: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrMobile, password }),
    });
    if (res.success && res.data?.tokens) {
      this.setTokens(res.data.tokens);
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
    if (res.success && res.data?.tokens) {
      this.setTokens(res.data.tokens);
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

  async heartbeat() {
    return await this.request('/users/me/heartbeat', { method: 'POST' });
  }

  async getPresence(userId: string) {
    return await this.request<{ userId: string; status: 'online' | 'offline'; online: boolean; lastSeen: string }>(`/users/${userId}/presence`);
  }

  async updateProfile(data: {
    name?: string;
    bio?: string;
    city?: string;
    branch?: string;
    batch?: string;
    currentCompany?: string;
    designation?: string;
    publicKey?: string;
  }) {
    return await this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async uploadPublicKey(publicKey: string) {
    return await this.request('/users/me/public-key', {
      method: 'POST',
      body: JSON.stringify({ publicKey }),
    });
  }

  async getPublicKey(userId: string) {
    return await this.request<{ userId: string; publicKey: string }>(`/users/${userId}/public-key`);
  }

  async uploadChatAttachment(dataUrl: string, fileName?: string) {
    return await this.request<{ url: string }>('/messages/attachment', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, fileName }),
    });
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
    if (res.success && res.data?.tokens) {
      this.setTokens(res.data.tokens);
    }
    return res;
  }

  // Users & Directory
  async searchUsers(query?: string, role?: string, filters?: { branch?: string; batch?: string; company?: string; city?: string }) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (role) params.append('role', role);
    if (filters?.branch) params.append('branch', filters.branch);
    if (filters?.batch) params.append('batch', filters.batch);
    if (filters?.company) params.append('company', filters.company);
    if (filters?.city) params.append('city', filters.city);
    return await this.request(`/users/search?${params.toString()}`);
  }

  async deleteAccount() {
    return await this.request('/users/me', {
      method: 'DELETE',
    });
  }

  // Posts & Jobs
  async getPosts(type?: string) {
    const query = type ? `?type=${type}` : '';
    return await this.request(`/posts${query}`);
  }

  async createPost(data: { title: string; description: string; type: 'GENERAL' | 'JOB' | 'INTERNSHIP'; company?: string; location?: string; pay?: string; deadline?: string }) {
    return await this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async applyJob(postId: string, data: {
    fullName: string;
    email: string;
    phone?: string;
    college?: string;
    course?: string;
    branch?: string;
    graduationYear?: number;
    skills?: string[];
    experience?: string;
    coverLetter?: string;
    resumeData?: string;
    resumeFileName?: string;
  }) {
    return await this.request(`/posts/${postId}/apply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getJobApplications(postId: string) {
    return await this.request<{
      postId: string;
      postTitle: string;
      totalApplicants: number;
      applications: any[];
    }>(`/posts/${postId}/applications`);
  }

  async getJobApplicationDetail(postId: string, appId: string) {
    return await this.request(`/posts/${postId}/applications/${appId}`);
  }

  async getMyJobApplication(postId: string) {
    return await this.request<{ applied: boolean; application: any }>(`/posts/${postId}/my-application`);
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

  async deleteDiscussion(threadId: string) {
    return await this.request(`/discussions/${threadId}`, {
      method: 'DELETE',
    });
  }

  async deleteReply(threadId: string, replyId: string) {
    return await this.request(`/discussions/${threadId}/replies/${replyId}`, {
      method: 'DELETE',
    });
  }

  // Connections
  async getConnections() {
    return await this.request('/connections');
  }

  async getPendingRequests() {
    return await this.request('/connections/pending');
  }

  async getSentRequests() {
    return await this.request('/connections/sent');
  }

  async requestConnection(receiverId: string) {
    return await this.request('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    });
  }

  async acceptConnection(connectionId: string) {
    return await this.request(`/connections/${connectionId}/accept`, {
      method: 'PATCH',
    });
  }

  async rejectConnection(connectionId: string) {
    return await this.request(`/connections/${connectionId}/reject`, {
      method: 'PATCH',
    });
  }

  async removeConnection(connectionId: string) {
    return await this.request(`/connections/${connectionId}`, {
      method: 'DELETE',
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

  // Messages & Real-time Chat
  async sendMessage(receiverId: string, encryptedContent: string, nonce?: string) {
    return await this.request('/messages', {
      method: 'POST',
      body: JSON.stringify({
        receiverId,
        encryptedContent,
        nonce: nonce || btoa(Date.now().toString()),
      }),
    });
  }

  async getMessages(userId: string) {
    return await this.request<{ items: any[]; meta: any }>(`/messages/${userId}`);
  }

  async markMessagesRead(userId: string) {
    return await this.request(`/messages/${userId}/read`, {
      method: 'PATCH',
    });
  }

  // In-app Notifications
  async getNotifications(page = 1, limit = 20) {
    return await this.request<{
      items: Array<{
        id: string;
        userId: string;
        type: string;
        payload: any;
        isRead: boolean;
        createdAt: string;
      }>;
      unreadCount: number;
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>(`/notifications?page=${page}&limit=${limit}`);
  }

  async markNotificationRead(notificationId: string) {
    return await this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return await this.request('/notifications/read-all', {
      method: 'PATCH',
    });
  }
}

export const api = new ApiService();
