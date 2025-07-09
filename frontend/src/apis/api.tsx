// Combined api.tsx and Dashboard client routes into a unified API client

import axios, { AxiosError, AxiosResponse, AxiosRequestConfig, AxiosProgressEvent } from 'axios';

const baseURL = 'http://localhost:8000';

// Axios client with interceptors
const apiClient = axios.create({
  baseURL,
  timeout: 3000000,
  withCredentials: true, // Required for cookie-based authentication
});

apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user_data');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// Types
export interface Config extends AxiosRequestConfig {
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  headers?: Record<string, string>;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: UserResponse;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface FileUploadResponse {
  data: {
    message: string;
    filename: string;
    status: string;
  };
}

export interface UserQuery {
  query: string;
}

export interface ComprehensiveQuery {
  query: string;
  use_pdf_context?: boolean;
  generate_comprehensive?: boolean;
  max_tokens?: number;
}

export interface QueryResponse {
  response: string;
  formatted_response: {
    main_answer: string;
    full_response: string;
    paragraphs: string[];
    bullet_points: string[];
    numbered_points: string[];
    word_count: number;
    has_structure: boolean;
  };
  relevant_docs: string[];
  total_sources: number;
  user: string;
}

export interface ComprehensiveQueryResponse {
  query: string;
  comprehensive_answer: string;
  pdf_context_used: boolean;
  pdf_sources: Array<{ content: string; metadata: any }>;
  response_time: number;
  timestamp: number;
  combined_insights?: {
    query_analysis: { main_topic: string; question_type: string };
    pdf_insights: { context_available: boolean; context_length: number; key_points: string[] };
    ai_insights: { response_length: number; main_sections: string[] };
    combined_confidence: string;
  };
}

// Utility functions
const handleApiError = (error: any): ApiError => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data) {
      const errorData = error.response.data;
      return {
        detail: errorData.detail || errorData.message || 'An error occurred',
        status_code: error.response.status,
      };
    }
    if (error.request) {
      return { detail: 'Network error - please check your connection', status_code: 0 };
    }
  }
  return { detail: error.message || 'An unexpected error occurred' };
};

export const register = async (userData: UserCreate): Promise<UserResponse> => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

export const login = async (credentials: UserLogin): Promise<LoginResponse> => {
  const response = await apiClient.post('/auth/login', credentials);
  localStorage.setItem('user_data', JSON.stringify(response.data.user));
  return response.data;
};

export const logout = async (): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.warn('Logout API call failed:', error);
    return { message: 'Logged out locally' };
  } finally {
    localStorage.removeItem('user_data');
  }
};

export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await apiClient.get('/auth/profile');
  return response.data;
};

export const uploadDocument = async (file: File, config?: Config): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/upload-file', formData, {
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...config?.headers,
    },
  });
  return { data: response.data };
};

export const removeFile = async (filename: string) => {
  const response = await apiClient.delete(`/remove-file/${encodeURIComponent(filename)}`);
  return response.data;
};

export const downloadFile = async (filename: string): Promise<Blob> => {
  const response = await apiClient.get(`/download-file/${encodeURIComponent(filename)}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const listFiles = async () => {
  const response = await apiClient.get('/list-files');
  return response.data;
};

export const getAnswer = async (inputQuery: string): Promise<QueryResponse> => {
  const inputData: UserQuery = { query: inputQuery };
  const response = await apiClient.post('/comprehensive-query', inputData);
  return response.data;
};

export const getComprehensiveAnswer = async (
  query: string,
  options?: { use_pdf_context?: boolean; generate_comprehensive?: boolean; max_tokens?: number }
): Promise<ComprehensiveQueryResponse> => {
  const inputData: ComprehensiveQuery = {
    query,
    use_pdf_context: options?.use_pdf_context ?? true,
    generate_comprehensive: options?.generate_comprehensive ?? true,
    max_tokens: options?.max_tokens ?? 1000,
  };
  const response = await apiClient.post('/comprehensive-query', inputData);
  return response.data;
};

export const downloadConversations = async (user_id?: number, limit?: number): Promise<Blob> => {
  const params = new URLSearchParams();
  if (user_id) params.append('user_id', user_id.toString());
  if (limit) params.append('limit', limit.toString());
  const response = await apiClient.get(`/download-conversations?${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const getHealthCheck = async () => {
  const response = await axios.get(`${baseURL}/health`);
  return response.data;
};

export const getPublicInfo = async () => {
  const response = await axios.get(`${baseURL}/public/info`);
  return response.data;
};

export const isAuthenticated = (): boolean => {
  return getStoredUser() !== null;
};

export const getStoredUser = (): UserResponse | null => {
  try {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch {
    localStorage.removeItem('user_data');
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('user_data');
};

export const useAuth = () => {
  const user = getStoredUser();
  const authenticated = isAuthenticated();
  return {
    user,
    authenticated,
    login,
    logout,
    register,
    getCurrentUser,
  };
};

export default apiClient;
