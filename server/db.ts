import { and, desc, eq, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import fs from "node:fs";
import path from "node:path";
import { InsertUser, orderItems, orders, products, User, users, Product, Order, OrderItem } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { calculateOrderTotals, getUniqueProductIds } from "./storeLogic";

let _db: ReturnType<typeof drizzle> | null = null;
const RESERVATION_MINUTES = 15;

// =============================================================================
// Local Persistent Store (Used when DATABASE_URL is not configured)
// =============================================================================
const DATA_DIR = path.resolve(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

interface LocalStoreSchema {
  users: Array<User>;
  products: Array<Product>;
  orders: Array<Order>;
  orderItems: Array<OrderItem>;
}

const SEED_PRODUCTS: Array<Product> = [
  {
    id: 150006,
    name: "IBRAQ Brazilian tobacco",
    description: null,
    size: "20ml",
    audience: "men",
    price: 250,
    imageUrl: "/manus-storage/products/1789735392242_3b3e00db.jpeg",
    status: "available",
    reservationToken: null,
    reservationExpiresAt: null,
    createdAt: new Date("2026-09-18T12:43:12.000Z"),
    updatedAt: new Date("2026-09-18T12:43:12.000Z"),
  },
  {
    id: 150005,
    name: "ASAD Bouron",
    description: null,
    size: "50ml",
    audience: "men",
    price: 250,
    imageUrl: "/manus-storage/products/1789735353331_6e4df047.jpeg",
    status: "available",
    reservationToken: null,
    reservationExpiresAt: null,
    createdAt: new Date("2026-09-18T12:42:33.000Z"),
    updatedAt: new Date("2026-09-18T12:42:33.000Z"),
  },
  {
    id: 150004,
    name: "DIESEL eau de toilette",
    description: null,
    size: "50ml",
    audience: "men",
    price: 250,
    imageUrl: "/manus-storage/products/1789735310159_32c7b564.jpeg",
    status: "available",
    reservationToken: null,
    reservationExpiresAt: null,
    createdAt: new Date("2026-09-18T12:41:50.000Z"),
    updatedAt: new Date("2026-09-18T12:41:50.000Z"),
  },
  {
    id: 150003,
    name: "TOMMY NOW them",
    description: null,
    size: "50ml",
    audience: "men",
    price: 250,
    imageUrl: "/manus-storage/products/1789735225446_f6df3a39.jpeg",
    status: "available",
    reservationToken: null,
    reservationExpiresAt: null,
    createdAt: new Date("2026-09-18T12:40:25.000Z"),
    updatedAt: new Date("2026-09-18T12:40:25.000Z"),
  },
  {
    id: 150002,
    name: "JOOP eau de toilette",
    description: null,
    size: "30ml",
    audience: "men",
    price: 250,
    imageUrl: "/manus-storage/products/1789735175622_36a65c9b.jpeg",
    status: "available",
    reservationToken: null,
    reservationExpiresAt: null,
    createdAt: new Date("2026-09-18T12:39:35.000Z"),
    updatedAt: new Date("2026-09-18T12:39:35.000Z"),
  },
  {
    id: 150001,
    name: "DAVIDOFF  eau de toilette",
    description: null,
    size: "75ml",
    audience: "men",
    price: 250,
    imageUrl: "/manus-storage/products/1789735117651_785ec8ae.jpeg",
    status: "available",
    reservationToken: null,
    reservationExpiresAt: null,
    createdAt: new Date("2026-09-18T12:38:37.000Z"),
    updatedAt: new Date("2026-09-18T12:38:37.000Z"),
  },
  {
    id: 90004,
    name: "RALPH LAUREN eau de toilete",
    description: null,
    size: "50ml",
    audience: "men",
    price: 250,
    imageUrl: "/manus-storage/products/1789733240500_8a83802d.jpeg",
    status: "available",
    reservationToken: null,
    reservationExpiresAt: null,
    createdAt: new Date("2026-09-18T12:07:20.000Z"),
    updatedAt: new Date("2026-09-18T12:07:20.000Z"),
  },
  {
    id: 90002,
    name: "BURBERRY TOUCH",
    description: null,
    size: "50ml",
    audience: "men",
    price: 250,
    imageUrl: "/manus-storage/products/1789733170413_c08df51f.jpeg",
    status: "available",
    reservationToken: null,
    reservationExpiresAt: null,
    createdAt: new Date("2026-09-18T12:06:10.000Z"),
    updatedAt: new Date("2026-09-18T12:06:10.000Z"),
  },
  {
    id: 90001,
    name: "HOGO BOSS. aeu de toilette",
    description: null,
    size: "50ml",
    audience: "men",
    price: 250,
    imageUrl: "/manus-storage/products/1789733132591_a12707d5.jpeg",
    status: "available",
    reservationToken: null,
    reservationExpiresAt: null,
    createdAt: new Date("2026-09-18T12:05:32.000Z"),
    updatedAt: new Date("2026-09-18T12:05:32.000Z"),
  },
  {
    id: 60001,
    name: "DOLCE&GABBANA   eau de parfum pour homme",
    description: null,
    size: "50ml",
    audience: "men",
    price: 250,
    imageUrl: "/manus-storage/products/1789732954340_63aaa45e.jpeg",
    status: "available",
    reservationToken: null,
    reservationExpiresAt: null,
    createdAt: new Date("2026-09-18T12:02:34.000Z"),
    updatedAt: new Date("2026-09-18T12:02:34.000Z"),
  },
  {
    id: 30003,
    name: "SPICE BOMB EXTREME ",
    description: null,
    size: "50ml",
    audience: "men",
    price: 250,
    imageUrl: "/manus-storage/products/1789731505335_cec60ddd.jpeg",
    status: "available",
    reservationToken: null,
    reservationExpiresAt: null,
    createdAt: new Date("2026-09-18T11:38:25.000Z"),
    updatedAt: new Date("2026-09-18T11:57:03.000Z"),
  },
];

const SEED_USERS: Array<User> = [
  {
    id: 1,
    openId: "admin-bassant",
    name: "Bassant Saleh",
    email: "bassantsaleh2005@gmail.com",
    loginMethod: "local",
    role: "admin",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    lastSignedIn: new Date(),
  },
  {
    id: 2,
    openId: "admin-legend",
    name: "Legend Yousif",
    email: "legend.yousif2012@gmail.com",
    loginMethod: "local",
    role: "admin",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    lastSignedIn: new Date(),
  },
];

function ensureLocalStore(): LocalStoreSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_FILE)) {
    const initialData: LocalStoreSchema = {
      users: SEED_USERS,
      products: SEED_PRODUCTS,
      orders: [],
      orderItems: [],
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }

  try {
    const content = fs.readFileSync(STORE_FILE, "utf-8");
    const parsed = JSON.parse(content);
    // Revive Dates
    if (Array.isArray(parsed.products)) {
      parsed.products.forEach((p: any) => {
        if (p.reservationExpiresAt) p.reservationExpiresAt = new Date(p.reservationExpiresAt);
        if (p.createdAt) p.createdAt = new Date(p.createdAt);
        if (p.updatedAt) p.updatedAt = new Date(p.updatedAt);
      });
    }
    if (Array.isArray(parsed.orders)) {
      parsed.orders.forEach((o: any) => {
        if (o.createdAt) o.createdAt = new Date(o.createdAt);
        if (o.updatedAt) o.updatedAt = new Date(o.updatedAt);
      });
    }
    if (Array.isArray(parsed.users)) {
      parsed.users.forEach((u: any) => {
        if (u.createdAt) u.createdAt = new Date(u.createdAt);
        if (u.updatedAt) u.updatedAt = new Date(u.updatedAt);
        if (u.lastSignedIn) u.lastSignedIn = new Date(u.lastSignedIn);
      });
    }
    return parsed as LocalStoreSchema;
  } catch (err) {
    console.error("[LocalStore] Failed to parse store.json, resetting to seed data:", err);
    const initialData: LocalStoreSchema = {
      users: SEED_USERS,
      products: SEED_PRODUCTS,
      orders: [],
      orderItems: [],
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
}

function saveLocalStore(data: LocalStoreSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[LocalStore] Failed to save store.json:", err);
  }
}

function releaseExpiredReservationsInStore(store: LocalStoreSchema): boolean {
  const now = Date.now();
  let changed = false;
  for (const product of store.products) {
    if (
      product.status === "reserved" &&
      product.reservationExpiresAt &&
      new Date(product.reservationExpiresAt).getTime() <= now
    ) {
      product.status = "available";
      product.reservationToken = null;
      product.reservationExpiresAt = null;
      product.updatedAt = new Date();
      changed = true;
    }
  }
  return changed;
}

// =============================================================================
// Database Connector & Public Store API
// =============================================================================

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect to DATABASE_URL:", error);
      _db = null;
    }
  }
  return _db;
}


async function releaseExpiredReservations(db: ReturnType<typeof drizzle>) {
  try {
    await db
      .update(products)
      .set({
        status: "available",
        reservationToken: null,
        reservationExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(products.status, "reserved"),
          sql`${products.reservationExpiresAt} IS NOT NULL AND ${products.reservationExpiresAt} < ${new Date()}`
        )
      );
  } catch (err) {
    console.warn("[DB] releaseExpiredReservations failed (non-critical):", err);
  }
}


export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (db) {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    for (const field of textFields) {
      if (user[field] !== undefined) {
        values[field] = user[field] ?? null;
        updateSet[field] = user[field] ?? null;
      }
    }
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
    return;
  }

  // Local store fallback
  const store = ensureLocalStore();
  const existingIndex = store.users.findIndex((u) => u.openId === user.openId);
  const now = new Date();
  if (existingIndex >= 0) {
    const existing = store.users[existingIndex];
    store.users[existingIndex] = {
      ...existing,
      name: user.name !== undefined ? user.name : existing.name,
      email: user.email !== undefined ? user.email : existing.email,
      loginMethod: user.loginMethod !== undefined ? user.loginMethod : existing.loginMethod,
      role: user.role !== undefined ? user.role : existing.role,
      lastSignedIn: user.lastSignedIn || now,
      updatedAt: now,
    };
  } else {
    const newId = store.users.length ? Math.max(...store.users.map((u) => u.id)) + 1 : 1;
    store.users.push({
      id: newId,
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role: user.role ?? "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn || now,
    });
  }
  saveLocalStore(store);
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (db) {
    return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
  }

  const store = ensureLocalStore();
  return store.users.find((u) => u.openId === openId);
}

export async function listAvailableProducts(): Promise<Product[]> {
  const db = await getDb();
  if (db) {
    await releaseExpiredReservations(db);
    return db
      .select()
      .from(products)
      .where(eq(products.status, "available"))
      .orderBy(desc(products.createdAt));
  }

  const store = ensureLocalStore();
  const changed = releaseExpiredReservationsInStore(store);
  if (changed) saveLocalStore(store);

  return store.products
    .filter((p) => p.status === "available")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listAllProducts(): Promise<Product[]> {
  const db = await getDb();
  if (db) {
    await releaseExpiredReservations(db);
    return db.select().from(products).orderBy(desc(products.createdAt));
  }

  const store = ensureLocalStore();
  const changed = releaseExpiredReservationsInStore(store);
  if (changed) saveLocalStore(store);

  return [...store.products].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function reserveProduct(productId: number) {
  const db = await getDb();
  if (db) {
    await releaseExpiredReservations(db);
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);
    const result = await db
      .update(products)
      .set({
        status: "reserved",
        reservationToken: token,
        reservationExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, productId), eq(products.status, "available")));
    const affectedRows = Number(
      (result as any).affectedRows ?? (result as any)[0]?.affectedRows ?? 0
    );
    if (affectedRows !== 1) throw new Error("PRODUCT_UNAVAILABLE");
    const product = (
      await db.select().from(products).where(eq(products.id, productId)).limit(1)
    )[0];
    if (!product) throw new Error("PRODUCT_UNAVAILABLE");
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      size: product.size,
      reservationToken: token,
      reservationExpiresAt: expiresAt,
    };
  }

  // Local store fallback
  const store = ensureLocalStore();
  releaseExpiredReservationsInStore(store);

  const product = store.products.find((p) => p.id === productId);
  if (!product || product.status !== "available") {
    throw new Error("PRODUCT_UNAVAILABLE");
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);
  product.status = "reserved";
  product.reservationToken = token;
  product.reservationExpiresAt = expiresAt;
  product.updatedAt = new Date();

  saveLocalStore(store);

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    size: product.size,
    reservationToken: token,
    reservationExpiresAt: expiresAt,
  };
}

export async function releaseReservation(productId: number, reservationToken: string) {
  const db = await getDb();
  if (db) {
    await db
      .update(products)
      .set({
        status: "available",
        reservationToken: null,
        reservationExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(products.id, productId),
          eq(products.status, "reserved"),
          eq(products.reservationToken, reservationToken)
        )
      );
    return;
  }

  const store = ensureLocalStore();
  const product = store.products.find(
    (p) => p.id === productId && p.status === "reserved" && p.reservationToken === reservationToken
  );
  if (product) {
    product.status = "available";
    product.reservationToken = null;
    product.reservationExpiresAt = null;
    product.updatedAt = new Date();
    saveLocalStore(store);
  }
}

export async function createProduct(input: {
  name: string;
  description?: string;
  size?: string;
  price: number;
  imageUrl?: string;
  audience?: "men" | "women";
}) {
  const db = await getDb();
  if (db) {
    const result = await db.insert(products).values({
      name: input.name,
      description: input.description || null,
      size: input.size || null,
      price: input.price,
      imageUrl: input.imageUrl || null,
      audience: input.audience || "men",
      status: "available",
    });
    return Number((result as any).insertId ?? (result as any)[0]?.insertId);
  }

  const store = ensureLocalStore();
  const newId = store.products.length ? Math.max(...store.products.map((p) => p.id)) + 1 : 1;
  const now = new Date();
  const newProduct: Product = {
    id: newId,
    name: input.name,
    description: input.description || null,
    size: input.size || null,
    audience: input.audience || "men",
    price: input.price,
    imageUrl: input.imageUrl || null,
    status: "available",
    reservationToken: null,
    reservationExpiresAt: null,
    createdAt: now,
    updatedAt: now,
  };
  store.products.unshift(newProduct);
  saveLocalStore(store);
  return newId;
}

export async function updateProduct(input: {
  id: number;
  name?: string;
  description?: string;
  size?: string;
  price?: number;
  imageUrl?: string;
  audience?: "men" | "women";
  status?: "available" | "reserved" | "sold";
}) {
  const db = await getDb();
  if (db) {
    const { id, ...changes } = input;
    await db.update(products).set(changes).where(eq(products.id, id));
    return;
  }

  const store = ensureLocalStore();
  const product = store.products.find((p) => p.id === input.id);
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  if (input.name !== undefined) product.name = input.name;
  if (input.description !== undefined) product.description = input.description;
  if (input.size !== undefined) product.size = input.size;
  if (input.price !== undefined) product.price = input.price;
  if (input.imageUrl !== undefined) product.imageUrl = input.imageUrl;
  if (input.audience !== undefined) product.audience = input.audience;
  if (input.status !== undefined) product.status = input.status;
  product.updatedAt = new Date();

  saveLocalStore(store);
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (db) {
    await db.delete(products).where(eq(products.id, id));
    return;
  }

  const store = ensureLocalStore();
  store.products = store.products.filter((p) => p.id !== id);
  saveLocalStore(store);
}

export async function createOrder(input: {
  customerName: string;
  phone: string;
  governorate: string;
  area: string;
  address: string;
  notes?: string;
  shippingFee: number;
  items: Array<{ productId: number; reservationToken: string }>;
}) {
  const uniqueProductIds = getUniqueProductIds(input.items.map((item) => item.productId));
  if (uniqueProductIds.length !== input.items.length) throw new Error("DUPLICATE_PRODUCT");

  const db = await getDb();
  if (db) {
    return db.transaction(async (tx) => {
      const claimed: Array<{ id: number; name: string; price: number; imageUrl: string | null }> =
        [];
      for (const item of input.items) {
        const product = (
          await tx
            .select()
            .from(products)
            .where(
              and(
                eq(products.id, item.productId),
                eq(products.status, "reserved"),
                eq(products.reservationToken, item.reservationToken)
              )
            )
            .limit(1)
        )[0];
        if (
          !product ||
          !product.reservationExpiresAt ||
          product.reservationExpiresAt.getTime() <= Date.now()
        ) {
          throw new Error("PRODUCT_UNAVAILABLE");
        }
        const claimResult = await tx
          .update(products)
          .set({ reservationToken: null, reservationExpiresAt: null, updatedAt: new Date() })
          .where(
            and(
              eq(products.id, item.productId),
              eq(products.status, "reserved"),
              eq(products.reservationToken, item.reservationToken)
            )
          );
        const affectedRows = Number(
          (claimResult as any).affectedRows ?? (claimResult as any)[0]?.affectedRows ?? 0
        );
        if (affectedRows !== 1) throw new Error("PRODUCT_UNAVAILABLE");
        claimed.push({
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
        });
      }
      const { subtotal, total } = calculateOrderTotals(
        claimed.map((p) => p.price),
        input.shippingFee
      );
      const orderNumber = `PF-${Date.now().toString(36).toUpperCase()}-${Math.floor(
        100 + Math.random() * 900
      )}`;
      const orderResult = await tx.insert(orders).values({
        orderNumber,
        customerName: input.customerName,
        phone: input.phone,
        governorate: input.governorate,
        area: input.area,
        address: input.address,
        notes: input.notes || null,
        subtotal,
        shippingFee: input.shippingFee,
        total,
        paymentMethod: "cash_on_delivery",
        status: "new",
      });
      const orderId = Number(
        (orderResult as any).insertId ?? (orderResult as any)[0]?.insertId
      );
      await tx.insert(orderItems).values(
        claimed.map((product) => ({
          orderId,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          imageUrl: product.imageUrl,
        }))
      );
      return {
        orderId,
        orderNumber,
        subtotal,
        shippingFee: input.shippingFee,
        total,
        items: claimed,
      };
    });
  }

  // Local store fallback
  const store = ensureLocalStore();
  const claimed: Array<{ id: number; name: string; price: number; imageUrl: string | null }> = [];
  const now = Date.now();

  for (const item of input.items) {
    const product = store.products.find(
      (p) =>
        p.id === item.productId &&
        p.status === "reserved" &&
        p.reservationToken === item.reservationToken
    );
    if (!product || !product.reservationExpiresAt || new Date(product.reservationExpiresAt).getTime() <= now) {
      throw new Error("PRODUCT_UNAVAILABLE");
    }

    product.reservationToken = null;
    product.reservationExpiresAt = null;
    product.updatedAt = new Date();

    claimed.push({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
  }

  const { subtotal, total } = calculateOrderTotals(
    claimed.map((p) => p.price),
    input.shippingFee
  );
  const orderNumber = `PF-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    100 + Math.random() * 900
  )}`;
  const newOrderId = store.orders.length ? Math.max(...store.orders.map((o) => o.id)) + 1 : 1;
  const orderDate = new Date();

  const newOrder: Order = {
    id: newOrderId,
    orderNumber,
    customerName: input.customerName,
    phone: input.phone,
    governorate: input.governorate,
    area: input.area,
    address: input.address,
    notes: input.notes || null,
    subtotal,
    shippingFee: input.shippingFee,
    total,
    paymentMethod: "cash_on_delivery",
    status: "new",
    createdAt: orderDate,
    updatedAt: orderDate,
  };

  store.orders.unshift(newOrder);

  for (const product of claimed) {
    const newItemId = store.orderItems.length
      ? Math.max(...store.orderItems.map((oi) => oi.id)) + 1
      : 1;
    store.orderItems.push({
      id: newItemId,
      orderId: newOrderId,
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      imageUrl: product.imageUrl,
    });
  }

  saveLocalStore(store);

  return {
    orderId: newOrderId,
    orderNumber,
    subtotal,
    shippingFee: input.shippingFee,
    total,
    items: claimed,
  };
}

export async function listOrders(): Promise<Order[]> {
  const db = await getDb();
  if (db) {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  const store = ensureLocalStore();
  return [...store.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateOrderStatus(
  id: number,
  status: "new" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
) {
  const db = await getDb();
  if (db) {
    await db.transaction(async (tx) => {
      const current = (await tx.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
      if (!current) throw new Error("ORDER_NOT_FOUND");
      await tx.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id));
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
      if (status === "delivered") {
        for (const item of items) {
          await tx
            .update(products)
            .set({ status: "sold", updatedAt: new Date() })
            .where(eq(products.id, item.productId));
        }
      } else if (status === "cancelled") {
        for (const item of items) {
          await tx
            .update(products)
            .set({
              status: "available",
              reservationToken: null,
              reservationExpiresAt: null,
              updatedAt: new Date(),
            })
            .where(
              and(eq(products.id, item.productId), eq(products.status, "reserved"))
            );
        }
      }
    });
    return;
  }

  // Local store fallback
  const store = ensureLocalStore();
  const order = store.orders.find((o) => o.id === id);
  if (!order) throw new Error("ORDER_NOT_FOUND");

  order.status = status;
  order.updatedAt = new Date();

  const items = store.orderItems.filter((oi) => oi.orderId === id);
  if (status === "delivered") {
    for (const item of items) {
      const p = store.products.find((prod) => prod.id === item.productId);
      if (p) {
        p.status = "sold";
        p.updatedAt = new Date();
      }
    }
  } else if (status === "cancelled") {
    for (const item of items) {
      const p = store.products.find((prod) => prod.id === item.productId);
      if (p) {
        p.status = "available";
        p.reservationToken = null;
        p.reservationExpiresAt = null;
        p.updatedAt = new Date();
      }
    }
  }

  saveLocalStore(store);
}

