export type UserRole = 'super_admin' | 'owner' | 'waiter' | 'kitchen';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  gst_number?: string;
  tax_percent: number;
  service_charge_percent: number;
  currency: string;
  bank_details?: {
    bank_name: string;
    account_number: string;
    ifsc: string;
    account_holder: string;
  };
  merchant_qr_url?: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_veg: boolean;
  is_available: boolean;
  tags?: string[];
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string;
  waiter_id?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  subtotal: number;
  tax: number;
  service_charge: number;
  total: number;
  payment_status: 'unpaid' | 'paid';
  created_at: string;
}
