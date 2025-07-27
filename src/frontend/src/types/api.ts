// User types
export interface User {
  id: string;
  username: string;
  email: string;
  level: number;
  experiencePoints: number;
  location?: Location;
  instagramHandle?: string;
  bio?: string;
  avatarEmoji: string;
  createdAt: string;
  statistics?: {
    totalSnacks: number;
    totalReviews: number;
    averageRatingGiven: number;
  };
  badges?: Badge[];
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  username?: string;
  instagramHandle?: string;
  bio?: string;
  avatarEmoji?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
}

// Location types
export interface Location {
  lat: number;
  lng: number;
}

// Store types
export interface Store {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  snackCount?: number;
}

export interface CreateStoreRequest {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export interface StoresResponse {
  stores: Store[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

// Snack types
export interface Snack {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category: string; // Category name from API
  hasImage: boolean;
  store: Store;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
  reviews?: Review[];
}

export interface CreateSnackRequest {
  name: string;
  description?: string;
  categoryId: string;
  storeId: string;
}

export interface UpdateSnackRequest {
  name: string;
  description?: string;
  categoryId: string;
  storeId: string;
}

export interface UploadImageRequest {
  snackId: string;
  image: File;
}

// Review types
export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

export interface CreateReviewRequest {
  snackId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating: number;
  comment?: string;
}

// Badge types
export interface Badge {
  name: string;
  description: string;
  icon: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}