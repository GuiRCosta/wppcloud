import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        })

        const { accessToken, refreshToken: newRefreshToken } = response.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    organizationName?: string
  }) => api.post('/auth/register', data),
  
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  
  logout: () => api.post('/auth/logout'),
  
  me: () => api.get('/auth/me'),
}

// Users API
export const usersApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/users', { params }),
  
  getById: (id: string) => api.get(`/users/${id}`),
  
  getAgents: () => api.get('/users/agents'),
  
  updateMe: (data: Record<string, any>) =>
    api.patch('/users/me', data),
  
  updateStatus: (status: string) =>
    api.patch('/users/me/status', { onlineStatus: status }),
}

// Conversations API
export const conversationsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/conversations', { params }),
  
  getById: (id: string) => api.get(`/conversations/${id}`),
  
  getStats: () => api.get('/conversations/stats'),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/conversations/${id}/status`, { status }),
  
  assign: (id: string, assignedToId: string | null) =>
    api.patch(`/conversations/${id}/assign`, { assignedToId }),
  
  markAsRead: (id: string) =>
    api.patch(`/conversations/${id}/read`),
  
  addTag: (id: string, tagId: string) =>
    api.post(`/conversations/${id}/tags`, { tagId }),
  
  removeTag: (id: string, tagId: string) =>
    api.delete(`/conversations/${id}/tags/${tagId}`),
  
  addNote: (id: string, content: string) =>
    api.post(`/conversations/${id}/notes`, { content }),
}

// Messages API
export const messagesApi = {
  getByConversation: (conversationId: string, params?: Record<string, any>) =>
    api.get(`/conversations/${conversationId}/messages`, { params }),
  
  send: (conversationId: string, data: { type: string; content: Record<string, any> }) =>
    api.post(`/conversations/${conversationId}/messages`, data),

  sendMedia: (
    conversationId: string, 
    file: File, 
    type: string, 
    caption?: string,
    onProgress?: (progress: number) => void
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    if (caption) formData.append('caption', caption)

    return api.post(`/conversations/${conversationId}/messages/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  },
}

// Media API
export const mediaApi = {
  getUrl: (mediaId: string) => 
    `${API_URL.replace('/api/v1', '')}/api/v1/media/${mediaId}`,
  
  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)

    return api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  },
}

export default api

