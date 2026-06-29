const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Product {
  id?: string;
  name: string;
  brand: string;
  photoUrl: string;
  mfgDate: string;
  expDate: string;
  arrivingDate: string;
  quantity: number;
  price: number;
}

export interface Sale {
  billId: string;
  productId: string;
  quantitySold: number;
  saleDate: string;
  totalAmount: number;
}

export interface Offer {
  offerId?: string;
  productId: string;
  offerType: string;
  discount: number;
  active: boolean;
  startDate: string;
  endDate: string;
  usageCount?: number;
  revenue?: number;
}

export interface Notification {
  notificationId: string;
  type: string;
  message: string;
  productId: string;
  timestamp: string;
  readStatus: boolean;
}

export interface CheckoutItem {
  productId: string;
  quantity: number;
  offerId: string;
}

export interface CheckoutRequest {
  customerMobile: string;
  customerName?: string;
  redeemPoints?: boolean;
  items: CheckoutItem[];
}

export interface CustomerResponse {
  mobile: string;
  name: string;
  points: number;
  exists: boolean;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  originalLineTotal: number;
  discountApplied: number;
  finalLineTotal: number;
}

export interface CheckoutResponse {
  billId: string;
  customerMobile: string;
  customerName?: string;
  pointsEarned?: number;
  totalPoints?: number;
  saleDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  finalAmount: number;
}

export interface DashboardStats {
  totalProducts: number;
  expiredProducts: number;
  expiringSoonProducts: number;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  topSellers: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
  slowMovers: Array<{
    productId: string;
    productName: string;
    brand: string;
    quantityInStock: number;
    quantitySold: number;
  }>;
  dailyTrend: Array<{
    date: string;
    revenue: number;
  }>;
  weeklyTrend: Array<{
    week: string;
    revenue: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    revenue: number;
  }>;
  inventoryBreakdown: {
    safe: number;
    nearExpiry: number;
    expired: number;
  };
}

let activeBaseUrl = BASE_URL;

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${activeBaseUrl}${endpoint}`;
  
  let businessOwner = '';
  try {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user && user.businessName) {
          businessOwner = user.businessName;
        }
      }
    }
  } catch (e) {
    console.warn('Could not read auth_user from localStorage', e);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (businessOwner) {
    headers['X-Business-Owner'] = businessOwner;
  }

  const response = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const api = {
  // Config & Health
  setBaseUrl: (url: string) => {
    activeBaseUrl = url;
  },
  getBaseUrl: () => activeBaseUrl,
  checkHealth: () => request<{ status: string }>('/health'),
  getImageUrl: (photoUrl: string) => {
    if (!photoUrl) return '';
    return photoUrl.startsWith('/') ? `${activeBaseUrl}${photoUrl}` : photoUrl;
  },

  // Auth
  login: (username: string, password: string) => request<any>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  register: (businessName: string, username: string, password: string) => request<any>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ businessName, username, password }),
  }),

  // Products
  getProducts: () => request<Product[]>('/api/products'),
  getProductById: (id: string) => request<Product>(`/api/products/${id}`),
  createProduct: (product: Product) => request<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  }),
  updateProduct: (id: string, product: Product) => request<Product>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  }),
  deleteProduct: (id: string) => request<void>(`/api/products/${id}`, {
    method: 'DELETE',
  }),
  getProductStats: () => request<DashboardStats>('/api/products/stats'),
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    let businessOwner = '';
    try {
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          if (user && user.businessName) {
            businessOwner = user.businessName;
          }
        }
      }
    } catch (e) {}

    const headers: Record<string, string> = {};
    if (businessOwner) {
      headers['X-Business-Owner'] = businessOwner;
    }

    const response = await fetch(`${activeBaseUrl}/api/products/upload-image`, {
      method: 'POST',
      body: formData,
      headers,
    });
    if (!response.ok) {
      throw new Error('Image upload failed');
    }
    const data = await response.json();
    return data.url;
  },

  // POS Billing
  checkout: (req: CheckoutRequest) => request<CheckoutResponse>('/api/pos/checkout', {
    method: 'POST',
    body: JSON.stringify(req),
  }),
  getCustomer: (mobile: string) => request<CustomerResponse>(`/api/pos/customer/${mobile}`),
  getBills: () => request<CheckoutResponse[]>('/api/pos/bills'),

  // Offers
  getOffers: () => request<Offer[]>('/api/offers'),
  createOffer: (offer: Offer) => request<Offer>('/api/offers', {
    method: 'POST',
    body: JSON.stringify(offer),
  }),
  updateOffer: (id: string, offer: Offer) => request<Offer>(`/api/offers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(offer),
  }),
  deleteOffer: (id: string) => request<void>(`/api/offers/${id}`, {
    method: 'DELETE',
  }),
  toggleOffer: (id: string) => request<Offer>(`/api/offers/${id}/toggle`, {
    method: 'POST',
  }),

  // Analytics
  getAnalytics: () => request<AnalyticsData>('/api/analytics/dashboard'),

  // Notifications
  getNotifications: () => request<Notification[]>('/api/notifications'),
  markNotificationAsRead: (id: string) => request<void>(`/api/notifications/${id}/read`, {
    method: 'POST',
  }),
  getUnreadNotificationsCount: () => request<{ count: number }>('/api/notifications/unread-count'),
};
