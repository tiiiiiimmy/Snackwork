// User types
export interface User {
  id: string;
  username: string;
  email: string;
  level: number;
  experiencePoints: number;
  createdAt: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
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

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

// Snack types
export interface Snack {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: Category | string; // Category object or name from API
  imageUrl?: string;
  location: Location; // Coordinates object
  shopName?: string; // Shop/store name
  shopAddress?: string; // Shop address
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

export interface CreateSnackRequest {
  name: string;
  description?: string;
  categoryId: string;
  imageUrl?: string;
  location: Location;
  shopName?: string;
  shopAddress?: string;
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