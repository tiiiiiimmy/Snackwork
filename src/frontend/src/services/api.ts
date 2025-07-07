import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  User,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  Category,
  Snack,
  CreateSnackRequest,
  Review,
  CreateReviewRequest,
  UpdateReviewRequest,
  ApiError,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiService {
  private api: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      withCredentials: true, // Include cookies for refresh tokens
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && originalRequest && !originalRequest.url?.includes('/refresh')) {
          try {
            await this.refreshToken();
            return this.api(originalRequest);
          } catch (refreshError) {
            this.logout();
            throw refreshError;
          }
        }
        
        throw error;
      }
    );
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  clearAccessToken() {
    this.accessToken = null;
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    this.setAccessToken(response.data.accessToken);
    return response.data;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', data);
    this.setAccessToken(response.data.accessToken);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } finally {
      this.clearAccessToken();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/refresh');
    this.setAccessToken(response.data.accessToken);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/auth/profile');
    return response.data;
  }

  // Categories endpoints
  async getCategories(): Promise<Category[]> {
    const response = await this.api.get<Category[]>('/categories');
    return response.data;
  }

  async getCategory(id: string): Promise<Category> {
    const response = await this.api.get<Category>(`/categories/${id}`);
    return response.data;
  }

  async createCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const response = await this.api.post<Category>('/categories', category);
    return response.data;
  }

  // Snacks endpoints
  async getSnacks(lat: number, lng: number, radius: number = 1000): Promise<Snack[]> {
    const response = await this.api.get<Snack[]>('/snacks', {
      params: { lat, lng, radius },
    });
    return response.data;
  }

  async getSnack(id: string): Promise<Snack> {
    const response = await this.api.get<Snack>(`/snacks/${id}`);
    return response.data;
  }

  async createSnack(data: CreateSnackRequest): Promise<Snack> {
    const response = await this.api.post<Snack>('/snacks', data);
    return response.data;
  }

  // Reviews endpoints
  async createReview(data: CreateReviewRequest): Promise<Review> {
    const response = await this.api.post<Review>('/reviews', data);
    return response.data;
  }

  async getReview(id: string): Promise<Review> {
    const response = await this.api.get<Review>(`/reviews/${id}`);
    return response.data;
  }

  async updateReview(id: string, data: UpdateReviewRequest): Promise<Review> {
    const response = await this.api.put<Review>(`/reviews/${id}`, data);
    return response.data;
  }

  async getSnackReviews(snackId: string): Promise<Review[]> {
    const response = await this.api.get<Review[]>(`/reviews/snack/${snackId}`);
    return response.data;
  }

  // Users endpoints
  async getUser(id: string): Promise<User> {
    const response = await this.api.get<User>(`/users/${id}`);
    return response.data;
  }

  async getUserSnacks(id: string): Promise<Snack[]> {
    const response = await this.api.get<Snack[]>(`/users/${id}/snacks`);
    return response.data;
  }

  async getUserReviews(id: string): Promise<Review[]> {
    const response = await this.api.get<Review[]>(`/users/${id}/reviews`);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Error handling helper
  handleApiError(error: AxiosError): ApiError {
    if (error.response) {
      return {
        message: (error.response.data as any)?.message || 'An error occurred',
        status: error.response.status,
        errors: (error.response.data as any)?.errors,
      };
    } else if (error.request) {
      return {
        message: 'Network error - please check your connection',
        status: 0,
      };
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
        status: 0,
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;