import Dexie, { Table } from 'dexie';

// Tipos de datos
export interface Category {
  id?: number;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: 'pending' | 'synced' | 'conflict';
}

export interface Product {
  id?: number;
  name: string;
  price: number;
  categoryId: number;
  description?: string;
  image?: string;
  isActive: boolean;
  stock?: number;
  unit?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: 'pending' | 'synced' | 'conflict';
}

export interface PosTable {
  id?: number;
  number: string;
  name: string;
  capacity: number;
  salonId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  currentOrderId?: number;
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: 'pending' | 'synced' | 'conflict';
}

export interface Salon {
  id?: number;
  name: string;
  description?: string;
  isActive: boolean;
  backgroundImage?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: 'pending' | 'synced' | 'conflict';
}

export interface Order {
  id?: number;
  tableId?: number;
  customerName?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  waiterName?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  syncStatus?: 'pending' | 'synced' | 'conflict';
}

export interface OrderItem {
  id?: number;
  orderId?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
}

export interface Customer {
  id?: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  cardCode: string;
  balance: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: 'pending' | 'synced' | 'conflict';
}

export interface Configuration {
  id?: number;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'payment' | 'printer' | 'tax' | 'sync';
  description?: string;
  updatedAt: Date;
  syncStatus?: 'pending' | 'synced' | 'conflict';
}

export interface SyncLog {
  id?: number;
  table: string;
  recordId: number;
  action: 'create' | 'update' | 'delete';
  data: any;
  status: 'pending' | 'success' | 'error';
  error?: string;
  attempts: number;
  createdAt: Date;
  lastAttempt?: Date;
}

export interface NamedAccount {
  id?: number;
  name: string;
  salonId: number;
  status: 'active' | 'paid' | 'cancelled';
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  syncStatus?: 'pending' | 'synced' | 'conflict';
}

// Base de datos
export class KimiPOSDatabase extends Dexie {
  categories!: Table<Category>;
  products!: Table<Product>;
  posTables!: Table<PosTable>;
  salons!: Table<Salon>;
  orders!: Table<Order>;
  orderItems!: Table<OrderItem>;
  customers!: Table<Customer>;
  configuration!: Table<Configuration>;
  syncLogs!: Table<SyncLog>;
  namedAccounts!: Table<NamedAccount>;

  constructor() {
    super('KimiPOSDatabase');
    
    this.version(1).stores({
      categories: '++id, name, order, isActive, syncStatus',
      products: '++id, name, categoryId, isActive, price, syncStatus',
      posTables: '++id, number, salonId, status, currentOrderId, syncStatus',
      salons: '++id, name, isActive, syncStatus',
      orders: '++id, tableId, status, createdAt, syncStatus',
      orderItems: '++id, orderId, productId, status',
      customers: '++id, name, email, phone, syncStatus',
      configuration: '++id, key, category, syncStatus',
      syncLogs: '++id, table, recordId, status, createdAt'
    });

    this.version(2).stores({
      namedAccounts: '++id, name, salonId, status, syncStatus'
    });

    this.version(3).stores({
      customers: '++id, name, lastName, email, phone, cardCode, syncStatus'
    });

    // Hooks para auto-timestamps y sync tracking
    this.categories.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      obj.syncStatus = 'pending';
    });

    this.categories.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
      modifications.syncStatus = 'pending';
    });

    this.products.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      obj.syncStatus = 'pending';
    });

    this.products.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
      modifications.syncStatus = 'pending';
    });

    this.posTables.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      obj.syncStatus = 'pending';
    });

    this.posTables.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
      modifications.syncStatus = 'pending';
    });

    this.salons.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      obj.syncStatus = 'pending';
    });

    this.salons.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
      modifications.syncStatus = 'pending';
    });

    this.customers.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      obj.syncStatus = 'pending';
    });

    this.customers.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
      modifications.syncStatus = 'pending';
    });

    this.orders.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      obj.syncStatus = 'pending';
    });

    this.orders.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
      modifications.syncStatus = 'pending';
    });

    this.customers.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      obj.syncStatus = 'pending';
    });

    this.customers.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
      modifications.syncStatus = 'pending';
    });

    this.configuration.hook('creating', function (primKey, obj, trans) {
      obj.updatedAt = new Date();
      obj.syncStatus = 'pending';
    });

    this.configuration.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
      modifications.syncStatus = 'pending';
    });

    this.syncLogs.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
    });

    this.namedAccounts.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      obj.syncStatus = 'pending';
    });

    this.namedAccounts.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date();
      modifications.syncStatus = 'pending';
    });
  }

  // Métodos de utilidad para sincronización
  async addSyncLog(table: string, recordId: number, action: 'create' | 'update' | 'delete', data: any) {
    return await this.syncLogs.add({
      table,
      recordId,
      action,
      data,
      status: 'pending',
      attempts: 0,
      createdAt: new Date()
    });
  }

  async getPendingSyncLogs() {
    return await this.syncLogs.where('status').equals('pending').toArray();
  }

  async markSyncSuccess(logId: number) {
    return await this.syncLogs.update(logId, { 
      status: 'success', 
      lastAttempt: new Date() 
    });
  }

  async markSyncError(logId: number, error: string) {
    const log = await this.syncLogs.get(logId);
    if (log) {
      return await this.syncLogs.update(logId, { 
        status: 'error', 
        error,
        attempts: log.attempts + 1,
        lastAttempt: new Date() 
      });
    }
  }
}

export const db = new KimiPOSDatabase();

