export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          owner_id: string
          phone: string | null
          address: string | null
          logo_url: string | null
          bkash_number: string | null
          nagad_number: string | null
          rocket_number: string | null
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          bkash_number?: string | null
          nagad_number?: string | null
          rocket_number?: string | null
          currency?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          bkash_number?: string | null
          nagad_number?: string | null
          rocket_number?: string | null
          currency?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          business_id: string | null
          full_name: string | null
          phone: string | null
          role: 'owner' | 'staff'
          created_at: string
        }
        Insert: {
          id: string
          business_id?: string | null
          full_name?: string | null
          phone?: string | null
          role?: 'owner' | 'staff'
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string | null
          full_name?: string | null
          phone?: string | null
          role?: 'owner' | 'staff'
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          business_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          business_id: string
          category_id: string | null
          name: string
          sku: string | null
          unit: string
          buy_price: number
          sell_price: number
          stock_qty: number
          low_stock_threshold: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          category_id?: string | null
          name: string
          sku?: string | null
          unit?: string
          buy_price?: number
          sell_price?: number
          stock_qty?: number
          low_stock_threshold?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          category_id?: string | null
          name?: string
          sku?: string | null
          unit?: string
          buy_price?: number
          sell_price?: number
          stock_qty?: number
          low_stock_threshold?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          business_id: string
          name: string
          phone: string | null
          address: string | null
          email: string | null
          total_due: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          phone?: string | null
          address?: string | null
          email?: string | null
          total_due?: number
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          phone?: string | null
          address?: string | null
          email?: string | null
          total_due?: number
          created_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          business_id: string
          client_id: string | null
          invoice_id: string | null
          subtotal: number
          discount: number
          total: number
          paid_amount: number
          due_amount: number
          payment_method: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'credit' | 'bank'
          status: 'completed' | 'returned' | 'cancelled'
          note: string | null
          sold_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          client_id?: string | null
          invoice_id?: string | null
          subtotal?: number
          discount?: number
          total?: number
          paid_amount?: number
          due_amount?: number
          payment_method?: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'credit' | 'bank'
          status?: 'completed' | 'returned' | 'cancelled'
          note?: string | null
          sold_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          client_id?: string | null
          invoice_id?: string | null
          subtotal?: number
          discount?: number
          total?: number
          paid_amount?: number
          due_amount?: number
          payment_method?: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'credit' | 'bank'
          status?: 'completed' | 'returned' | 'cancelled'
          note?: string | null
          sold_by?: string | null
          created_at?: string
        }
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string | null
          product_name: string
          unit: string | null
          qty: number
          buy_price: number
          sell_price: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          product_id?: string | null
          product_name: string
          unit?: string | null
          qty: number
          buy_price: number
          sell_price: number
          total: number
          created_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          product_id?: string | null
          product_name?: string
          unit?: string | null
          qty?: number
          buy_price?: number
          sell_price?: number
          total?: number
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          business_id: string
          client_id: string | null
          sale_id: string | null
          invoice_number: string
          issue_date: string
          due_date: string | null
          subtotal: number
          discount: number
          tax: number
          total: number
          paid_amount: number
          due_amount: number
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          note: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          client_id?: string | null
          sale_id?: string | null
          invoice_number: string
          issue_date?: string
          due_date?: string | null
          subtotal?: number
          discount?: number
          tax?: number
          total?: number
          paid_amount?: number
          due_amount?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          client_id?: string | null
          sale_id?: string | null
          invoice_number?: string
          issue_date?: string
          due_date?: string | null
          subtotal?: number
          discount?: number
          tax?: number
          total?: number
          paid_amount?: number
          due_amount?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          product_id: string | null
          description: string
          unit: string | null
          qty: number
          unit_price: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          product_id?: string | null
          description: string
          unit?: string | null
          qty: number
          unit_price: number
          total: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          product_id?: string | null
          description?: string
          unit?: string | null
          qty?: number
          unit_price?: number
          total?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          business_id: string
          invoice_id: string | null
          sale_id: string | null
          client_id: string | null
          amount: number
          method: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'other'
          transaction_id: string | null
          note: string | null
          paid_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          business_id: string
          invoice_id?: string | null
          sale_id?: string | null
          client_id?: string | null
          amount: number
          method?: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'other'
          transaction_id?: string | null
          note?: string | null
          paid_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          invoice_id?: string | null
          sale_id?: string | null
          client_id?: string | null
          amount?: number
          method?: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'other'
          transaction_id?: string | null
          note?: string | null
          paid_at?: string
          created_by?: string | null
        }
      }
      purchases: {
        Row: {
          id: string
          business_id: string
          supplier_name: string | null
          total: number
          paid_amount: number
          due_amount: number
          payment_method: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'credit'
          note: string | null
          purchased_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          supplier_name?: string | null
          total?: number
          paid_amount?: number
          due_amount?: number
          payment_method?: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'credit'
          note?: string | null
          purchased_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          supplier_name?: string | null
          total?: number
          paid_amount?: number
          due_amount?: number
          payment_method?: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'credit'
          note?: string | null
          purchased_by?: string | null
          created_at?: string
        }
      }
      purchase_items: {
        Row: {
          id: string
          purchase_id: string
          product_id: string | null
          product_name: string
          qty: number
          buy_price: number
          total: number
        }
        Insert: {
          id?: string
          purchase_id: string
          product_id?: string | null
          product_name: string
          qty: number
          buy_price: number
          total: number
        }
        Update: {
          id?: string
          purchase_id?: string
          product_id?: string | null
          product_name?: string
          qty?: number
          buy_price?: number
          total?: number
        }
      }
      stock_movements: {
        Row: {
          id: string
          business_id: string
          product_id: string
          type: 'purchase' | 'sale' | 'adjustment' | 'return'
          qty_change: number
          qty_before: number
          qty_after: number
          note: string | null
          ref_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          product_id: string
          type: 'purchase' | 'sale' | 'adjustment' | 'return'
          qty_change: number
          qty_before: number
          qty_after: number
          note?: string | null
          ref_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          product_id?: string
          type?: 'purchase' | 'sale' | 'adjustment' | 'return'
          qty_change?: number
          qty_before?: number
          qty_after?: number
          note?: string | null
          ref_id?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      low_stock_products: {
        Row: {
          id: string
          business_id: string
          name: string
          sku: string | null
          unit: string
          stock_qty: number
          low_stock_threshold: number
          sell_price: number
          category_name: string | null
        }
      }
      client_invoice_summary: {
        Row: {
          client_id: string
          business_id: string
          client_name: string
          phone: string | null
          total_invoices: number
          total_billed: number
          total_paid: number
          total_due: number
        }
      }
      daily_sales_summary: {
        Row: {
          business_id: string
          sale_date: string
          total_sales: number
          total_revenue: number
          total_collected: number
          total_due: number
        }
      }
      product_profit_summary: {
        Row: {
          product_id: string
          product_name: string
          business_id: string
          total_sold: number
          total_revenue: number
          total_cost: number
          total_profit: number
        }
      }
    }
  }
}
