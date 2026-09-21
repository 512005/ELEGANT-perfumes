// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import path5 from "node:path";
import fs4 from "node:fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import fs from "node:fs";
import path from "node:path";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  size: varchar("size", { length: 64 }),
  audience: mysqlEnum("audience", ["men", "women"]).default("men").notNull(),
  price: int("price").notNull(),
  imageUrl: text("imageUrl"),
  status: mysqlEnum("status", ["available", "reserved", "sold"]).default("available").notNull(),
  reservationToken: varchar("reservationToken", { length: 96 }),
  reservationExpiresAt: timestamp("reservationExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 48 }).notNull().unique(),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  governorate: varchar("governorate", { length: 100 }).notNull(),
  area: varchar("area", { length: 100 }).notNull(),
  address: text("address").notNull(),
  notes: text("notes"),
  subtotal: int("subtotal").notNull(),
  shippingFee: int("shippingFee").default(0).notNull(),
  total: int("total").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash_on_delivery"]).default("cash_on_delivery").notNull(),
  status: mysqlEnum("status", ["new", "confirmed", "processing", "shipped", "delivered", "cancelled"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 180 }).notNull(),
  productPrice: int("productPrice").notNull(),
  imageUrl: text("imageUrl")
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/storeLogic.ts
function getUniqueProductIds(productIds) {
  return Array.from(new Set(productIds));
}
function calculateOrderTotals(prices, shippingFee) {
  const subtotal = prices.reduce((sum, price) => sum + price, 0);
  return { subtotal, shippingFee, total: subtotal + shippingFee };
}

// server/db.ts
var _db = null;
var RESERVATION_MINUTES = 15;
var DATA_DIR = path.resolve(process.cwd(), "data");
var STORE_FILE = path.join(DATA_DIR, "store.json");
var SEED_PRODUCTS = [
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
    createdAt: /* @__PURE__ */ new Date("2026-09-18T12:43:12.000Z"),
    updatedAt: /* @__PURE__ */ new Date("2026-09-18T12:43:12.000Z")
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
    createdAt: /* @__PURE__ */ new Date("2026-09-18T12:42:33.000Z"),
    updatedAt: /* @__PURE__ */ new Date("2026-09-18T12:42:33.000Z")
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
    createdAt: /* @__PURE__ */ new Date("2026-09-18T12:41:50.000Z"),
    updatedAt: /* @__PURE__ */ new Date("2026-09-18T12:41:50.000Z")
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
    createdAt: /* @__PURE__ */ new Date("2026-09-18T12:40:25.000Z"),
    updatedAt: /* @__PURE__ */ new Date("2026-09-18T12:40:25.000Z")
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
    createdAt: /* @__PURE__ */ new Date("2026-09-18T12:39:35.000Z"),
    updatedAt: /* @__PURE__ */ new Date("2026-09-18T12:39:35.000Z")
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
    createdAt: /* @__PURE__ */ new Date("2026-09-18T12:38:37.000Z"),
    updatedAt: /* @__PURE__ */ new Date("2026-09-18T12:38:37.000Z")
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
    createdAt: /* @__PURE__ */ new Date("2026-09-18T12:07:20.000Z"),
    updatedAt: /* @__PURE__ */ new Date("2026-09-18T12:07:20.000Z")
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
    createdAt: /* @__PURE__ */ new Date("2026-09-18T12:06:10.000Z"),
    updatedAt: /* @__PURE__ */ new Date("2026-09-18T12:06:10.000Z")
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
    createdAt: /* @__PURE__ */ new Date("2026-09-18T12:05:32.000Z"),
    updatedAt: /* @__PURE__ */ new Date("2026-09-18T12:05:32.000Z")
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
    createdAt: /* @__PURE__ */ new Date("2026-09-18T12:02:34.000Z"),
    updatedAt: /* @__PURE__ */ new Date("2026-09-18T12:02:34.000Z")
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
    createdAt: /* @__PURE__ */ new Date("2026-09-18T11:38:25.000Z"),
    updatedAt: /* @__PURE__ */ new Date("2026-09-18T11:57:03.000Z")
  }
];
var SEED_USERS = [
  {
    id: 1,
    openId: "admin-bassant",
    name: "Bassant Saleh",
    email: "bassantsaleh2005@gmail.com",
    loginMethod: "local",
    role: "admin",
    createdAt: /* @__PURE__ */ new Date("2026-01-01T00:00:00Z"),
    updatedAt: /* @__PURE__ */ new Date("2026-01-01T00:00:00Z"),
    lastSignedIn: /* @__PURE__ */ new Date()
  },
  {
    id: 2,
    openId: "admin-legend",
    name: "Legend Yousif",
    email: "legend.yousif2012@gmail.com",
    loginMethod: "local",
    role: "admin",
    createdAt: /* @__PURE__ */ new Date("2026-01-01T00:00:00Z"),
    updatedAt: /* @__PURE__ */ new Date("2026-01-01T00:00:00Z"),
    lastSignedIn: /* @__PURE__ */ new Date()
  }
];
function ensureLocalStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    const initialData = {
      users: SEED_USERS,
      products: SEED_PRODUCTS,
      orders: [],
      orderItems: []
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
  try {
    const content = fs.readFileSync(STORE_FILE, "utf-8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.products)) {
      parsed.products.forEach((p) => {
        if (p.reservationExpiresAt) p.reservationExpiresAt = new Date(p.reservationExpiresAt);
        if (p.createdAt) p.createdAt = new Date(p.createdAt);
        if (p.updatedAt) p.updatedAt = new Date(p.updatedAt);
      });
    }
    if (Array.isArray(parsed.orders)) {
      parsed.orders.forEach((o) => {
        if (o.createdAt) o.createdAt = new Date(o.createdAt);
        if (o.updatedAt) o.updatedAt = new Date(o.updatedAt);
      });
    }
    if (Array.isArray(parsed.users)) {
      parsed.users.forEach((u) => {
        if (u.createdAt) u.createdAt = new Date(u.createdAt);
        if (u.updatedAt) u.updatedAt = new Date(u.updatedAt);
        if (u.lastSignedIn) u.lastSignedIn = new Date(u.lastSignedIn);
      });
    }
    return parsed;
  } catch (err) {
    console.error("[LocalStore] Failed to parse store.json, resetting to seed data:", err);
    const initialData = {
      users: SEED_USERS,
      products: SEED_PRODUCTS,
      orders: [],
      orderItems: []
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
}
function saveLocalStore(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[LocalStore] Failed to save store.json:", err);
  }
}
function releaseExpiredReservationsInStore(store) {
  const now = Date.now();
  let changed = false;
  for (const product of store.products) {
    if (product.status === "reserved" && product.reservationExpiresAt && new Date(product.reservationExpiresAt).getTime() <= now) {
      product.status = "available";
      product.reservationToken = null;
      product.reservationExpiresAt = null;
      product.updatedAt = /* @__PURE__ */ new Date();
      changed = true;
    }
  }
  return changed;
}
async function getDb() {
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
async function releaseExpiredReservations(db) {
  try {
    await db.update(products).set({
      status: "available",
      reservationToken: null,
      reservationExpiresAt: null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and(
        eq(products.status, "reserved"),
        sql`${products.reservationExpiresAt} IS NOT NULL AND ${products.reservationExpiresAt} < ${/* @__PURE__ */ new Date()}`
      )
    );
  } catch (err) {
    console.warn("[DB] releaseExpiredReservations failed (non-critical):", err);
  }
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (db) {
    const values = { openId: user.openId };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    for (const field of textFields) {
      if (user[field] !== void 0) {
        values[field] = user[field] ?? null;
        updateSet[field] = user[field] ?? null;
      }
    }
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
    return;
  }
  const store = ensureLocalStore();
  const existingIndex = store.users.findIndex((u) => u.openId === user.openId);
  const now = /* @__PURE__ */ new Date();
  if (existingIndex >= 0) {
    const existing = store.users[existingIndex];
    store.users[existingIndex] = {
      ...existing,
      name: user.name !== void 0 ? user.name : existing.name,
      email: user.email !== void 0 ? user.email : existing.email,
      loginMethod: user.loginMethod !== void 0 ? user.loginMethod : existing.loginMethod,
      role: user.role !== void 0 ? user.role : existing.role,
      lastSignedIn: user.lastSignedIn || now,
      updatedAt: now
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
      lastSignedIn: user.lastSignedIn || now
    });
  }
  saveLocalStore(store);
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (db) {
    return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
  }
  const store = ensureLocalStore();
  return store.users.find((u) => u.openId === openId);
}
async function listAvailableProducts() {
  const db = await getDb();
  if (db) {
    await releaseExpiredReservations(db);
    return db.select().from(products).where(eq(products.status, "available")).orderBy(desc(products.createdAt));
  }
  const store = ensureLocalStore();
  const changed = releaseExpiredReservationsInStore(store);
  if (changed) saveLocalStore(store);
  return store.products.filter((p) => p.status === "available").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
async function listAllProducts() {
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
async function reserveProduct(productId) {
  const db = await getDb();
  if (db) {
    await releaseExpiredReservations(db);
    const token2 = crypto.randomUUID();
    const expiresAt2 = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1e3);
    const result = await db.update(products).set({
      status: "reserved",
      reservationToken: token2,
      reservationExpiresAt: expiresAt2,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(products.id, productId), eq(products.status, "available")));
    const affectedRows = Number(
      result.affectedRows ?? result[0]?.affectedRows ?? 0
    );
    if (affectedRows !== 1) throw new Error("PRODUCT_UNAVAILABLE");
    const product2 = (await db.select().from(products).where(eq(products.id, productId)).limit(1))[0];
    if (!product2) throw new Error("PRODUCT_UNAVAILABLE");
    return {
      id: product2.id,
      name: product2.name,
      price: product2.price,
      imageUrl: product2.imageUrl,
      size: product2.size,
      reservationToken: token2,
      reservationExpiresAt: expiresAt2
    };
  }
  const store = ensureLocalStore();
  releaseExpiredReservationsInStore(store);
  const product = store.products.find((p) => p.id === productId);
  if (!product || product.status !== "available") {
    throw new Error("PRODUCT_UNAVAILABLE");
  }
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1e3);
  product.status = "reserved";
  product.reservationToken = token;
  product.reservationExpiresAt = expiresAt;
  product.updatedAt = /* @__PURE__ */ new Date();
  saveLocalStore(store);
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    size: product.size,
    reservationToken: token,
    reservationExpiresAt: expiresAt
  };
}
async function releaseReservation(productId, reservationToken) {
  const db = await getDb();
  if (db) {
    await db.update(products).set({
      status: "available",
      reservationToken: null,
      reservationExpiresAt: null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
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
    product.updatedAt = /* @__PURE__ */ new Date();
    saveLocalStore(store);
  }
}
async function createProduct(input) {
  const db = await getDb();
  if (db) {
    const result = await db.insert(products).values({
      name: input.name,
      description: input.description || null,
      size: input.size || null,
      price: input.price,
      imageUrl: input.imageUrl || null,
      audience: input.audience || "men",
      status: "available"
    });
    return Number(result.insertId ?? result[0]?.insertId);
  }
  const store = ensureLocalStore();
  const newId = store.products.length ? Math.max(...store.products.map((p) => p.id)) + 1 : 1;
  const now = /* @__PURE__ */ new Date();
  const newProduct = {
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
    updatedAt: now
  };
  store.products.unshift(newProduct);
  saveLocalStore(store);
  return newId;
}
async function updateProduct(input) {
  const db = await getDb();
  if (db) {
    const { id, ...changes } = input;
    await db.update(products).set(changes).where(eq(products.id, id));
    return;
  }
  const store = ensureLocalStore();
  const product = store.products.find((p) => p.id === input.id);
  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  if (input.name !== void 0) product.name = input.name;
  if (input.description !== void 0) product.description = input.description;
  if (input.size !== void 0) product.size = input.size;
  if (input.price !== void 0) product.price = input.price;
  if (input.imageUrl !== void 0) product.imageUrl = input.imageUrl;
  if (input.audience !== void 0) product.audience = input.audience;
  if (input.status !== void 0) product.status = input.status;
  product.updatedAt = /* @__PURE__ */ new Date();
  saveLocalStore(store);
}
async function deleteProduct(id) {
  const db = await getDb();
  if (db) {
    await db.delete(products).where(eq(products.id, id));
    return;
  }
  const store = ensureLocalStore();
  store.products = store.products.filter((p) => p.id !== id);
  saveLocalStore(store);
}
async function createOrder(input) {
  const uniqueProductIds = getUniqueProductIds(input.items.map((item) => item.productId));
  if (uniqueProductIds.length !== input.items.length) throw new Error("DUPLICATE_PRODUCT");
  const db = await getDb();
  if (db) {
    return db.transaction(async (tx) => {
      const claimed2 = [];
      for (const item of input.items) {
        const product = (await tx.select().from(products).where(
          and(
            eq(products.id, item.productId),
            eq(products.status, "reserved"),
            eq(products.reservationToken, item.reservationToken)
          )
        ).limit(1))[0];
        if (!product || !product.reservationExpiresAt || product.reservationExpiresAt.getTime() <= Date.now()) {
          throw new Error("PRODUCT_UNAVAILABLE");
        }
        const claimResult = await tx.update(products).set({ status: "sold", reservationToken: null, reservationExpiresAt: null, updatedAt: /* @__PURE__ */ new Date() }).where(
          and(
            eq(products.id, item.productId),
            eq(products.status, "reserved"),
            eq(products.reservationToken, item.reservationToken)
          )
        );
        const affectedRows = Number(
          claimResult.affectedRows ?? claimResult[0]?.affectedRows ?? 0
        );
        if (affectedRows !== 1) throw new Error("PRODUCT_UNAVAILABLE");
        claimed2.push({
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl
        });
      }
      const { subtotal: subtotal2, total: total2 } = calculateOrderTotals(
        claimed2.map((p) => p.price),
        input.shippingFee
      );
      const orderNumber2 = `PF-${Date.now().toString(36).toUpperCase()}-${Math.floor(
        100 + Math.random() * 900
      )}`;
      const orderResult = await tx.insert(orders).values({
        orderNumber: orderNumber2,
        customerName: input.customerName,
        phone: input.phone,
        governorate: input.governorate,
        area: input.area,
        address: input.address,
        notes: input.notes || null,
        subtotal: subtotal2,
        shippingFee: input.shippingFee,
        total: total2,
        paymentMethod: "cash_on_delivery",
        status: "new"
      });
      const orderId = Number(
        orderResult.insertId ?? orderResult[0]?.insertId
      );
      await tx.insert(orderItems).values(
        claimed2.map((product) => ({
          orderId,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          imageUrl: product.imageUrl
        }))
      );
      return {
        orderId,
        orderNumber: orderNumber2,
        subtotal: subtotal2,
        shippingFee: input.shippingFee,
        total: total2,
        items: claimed2
      };
    });
  }
  const store = ensureLocalStore();
  const claimed = [];
  const now = Date.now();
  for (const item of input.items) {
    const product = store.products.find(
      (p) => p.id === item.productId && p.status === "reserved" && p.reservationToken === item.reservationToken
    );
    if (!product || !product.reservationExpiresAt || new Date(product.reservationExpiresAt).getTime() <= now) {
      throw new Error("PRODUCT_UNAVAILABLE");
    }
    product.status = "sold";
    product.reservationToken = null;
    product.reservationExpiresAt = null;
    product.updatedAt = /* @__PURE__ */ new Date();
    claimed.push({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl
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
  const orderDate = /* @__PURE__ */ new Date();
  const newOrder = {
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
    updatedAt: orderDate
  };
  store.orders.unshift(newOrder);
  for (const product of claimed) {
    const newItemId = store.orderItems.length ? Math.max(...store.orderItems.map((oi) => oi.id)) + 1 : 1;
    store.orderItems.push({
      id: newItemId,
      orderId: newOrderId,
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      imageUrl: product.imageUrl
    });
  }
  saveLocalStore(store);
  return {
    orderId: newOrderId,
    orderNumber,
    subtotal,
    shippingFee: input.shippingFee,
    total,
    items: claimed
  };
}
async function listOrders() {
  const db = await getDb();
  if (db) {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }
  const store = ensureLocalStore();
  return [...store.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
async function updateOrderStatus(id, status) {
  const db = await getDb();
  if (db) {
    await db.transaction(async (tx) => {
      const current = (await tx.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
      if (!current) throw new Error("ORDER_NOT_FOUND");
      await tx.update(orders).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(orders.id, id));
      const items2 = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
      if (status === "delivered") {
        for (const item of items2) {
          await tx.update(products).set({ status: "sold", updatedAt: /* @__PURE__ */ new Date() }).where(eq(products.id, item.productId));
        }
      } else if (status === "cancelled") {
        for (const item of items2) {
          await tx.update(products).set({
            status: "available",
            reservationToken: null,
            reservationExpiresAt: null,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(
            and(eq(products.id, item.productId), eq(products.status, "reserved"))
          );
        }
      }
    });
    return;
  }
  const store = ensureLocalStore();
  const order = store.orders.find((o) => o.id === id);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  order.status = status;
  order.updatedAt = /* @__PURE__ */ new Date();
  const items = store.orderItems.filter((oi) => oi.orderId === id);
  if (status === "delivered") {
    for (const item of items) {
      const p = store.products.find((prod) => prod.id === item.productId);
      if (p) {
        p.status = "sold";
        p.updatedAt = /* @__PURE__ */ new Date();
      }
    }
  } else if (status === "cancelled") {
    for (const item of items) {
      const p = store.products.find((prod) => prod.id === item.productId);
      if (p) {
        p.status = "available";
        p.reservationToken = null;
        p.reservationExpiresAt = null;
        p.updatedAt = /* @__PURE__ */ new Date();
      }
    }
  }
  saveLocalStore(store);
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret || "novalre_secret_jwt_key_2026_default";
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a user openId
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: options.appId || ENV.appId || "novalre-store",
        name: options.name || "Admin"
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        if (ENV.oAuthServerUrl) {
          const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
          await upsertUser({
            openId: userInfo.openId,
            name: userInfo.name || null,
            email: userInfo.email ?? null,
            loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
            lastSignedIn: signedInAt
          });
          user = await getUserByOpenId(userInfo.openId);
        } else {
          await upsertUser({
            openId: session.openId,
            name: session.name || "Store Admin",
            email: session.openId.includes("@") ? session.openId : "bassantsaleh2005@gmail.com",
            role: "admin",
            loginMethod: "local",
            lastSignedIn: signedInAt
          });
          user = await getUserByOpenId(session.openId);
        }
      } catch (error) {
        console.warn("[Auth] Failed to sync user from OAuth, using session fallback:", error);
        await upsertUser({
          openId: session.openId,
          name: session.name || "Store Admin",
          email: session.openId.includes("@") ? session.openId : "bassantsaleh2005@gmail.com",
          role: "admin",
          loginMethod: "local",
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(session.openId);
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    console.log(`[Notification to Owner] ${title}: ${content}`);
    return true;
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/storage.ts
import fs2 from "node:fs";
import path2 from "node:path";
var UPLOADS_DIR = path2.resolve(process.cwd(), "uploads");
function ensureUploadsDir() {
  if (!fs2.existsSync(UPLOADS_DIR)) {
    fs2.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const key = appendHashSuffix(normalizeKey(relKey));
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    try {
      const forgeUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
      const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
      presignUrl.searchParams.set("path", key);
      const presignResp = await fetch(presignUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (presignResp.ok) {
        const { url: s3Url } = await presignResp.json();
        if (s3Url) {
          const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
          const uploadResp = await fetch(s3Url, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: blob
          });
          if (uploadResp.ok) {
            return { key, url: `/manus-storage/${key}` };
          }
        }
      }
    } catch (err) {
      console.warn("[Storage] Cloud presign failed, falling back to local storage:", err);
    }
  }
  ensureUploadsDir();
  const safeFilename = key.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path2.join(UPLOADS_DIR, safeFilename);
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.isBuffer(data) ? data : Buffer.from(data);
  await fs2.promises.writeFile(filePath, buffer);
  return { key: safeFilename, url: `/uploads/${safeFilename}` };
}

// server/routers.ts
var ADMIN_EMAILS = /* @__PURE__ */ new Set(["bassantsaleh2005@gmail.com", "legend.yousif2012@gmail.com"]);
var adminOnly = protectedProcedure.use(({ ctx, next }) => {
  const email = ctx.user.email?.trim().toLowerCase();
  const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isAdmin = ctx.user.role === "admin" || Boolean(email) && ADMIN_EMAILS.has(email) || Boolean(configuredAdminEmail) && email === configuredAdminEmail;
  if (!isAdmin) throw new TRPCError3({ code: "FORBIDDEN", message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0645\u0637\u0644\u0648\u0628\u0629" });
  return next();
});
var productInput = z2.object({
  name: z2.string().min(2).max(180),
  description: z2.string().max(5e3).optional(),
  size: z2.string().max(64).optional(),
  audience: z2.enum(["men", "women"]).default("men"),
  price: z2.number().int().min(1).max(1e8),
  imageUrl: z2.string().max(2e3).optional()
});
var createProductInput = productInput.extend({
  imageData: z2.string().max(8e6).optional(),
  imageContentType: z2.string().max(80).optional()
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure.input(
      z2.object({
        email: z2.string().email("\u0635\u064A\u063A\u0629 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629"),
        password: z2.string().min(1, "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u0637\u0644\u0648\u0628\u0629")
      })
    ).mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const isValidAdmin = ADMIN_EMAILS.has(email) || Boolean(configuredAdminEmail) && email === configuredAdminEmail;
      if (!isValidAdmin) {
        throw new TRPCError3({
          code: "UNAUTHORIZED",
          message: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0645\u0633\u062C\u0644 \u0643\u0645\u0633\u0624\u0648\u0644 \u0644\u0644\u0645\u062A\u062C\u0631."
        });
      }
      const expectedPassword = process.env.ADMIN_PASSWORD || "novalre2026";
      if (input.password !== expectedPassword) {
        throw new TRPCError3({
          code: "UNAUTHORIZED",
          message: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629."
        });
      }
      const openId = `admin-${email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "")}`;
      const name = email.includes("bassant") ? "Bassant Saleh" : "Store Admin";
      await upsertUser({
        openId,
        email,
        name,
        role: "admin",
        loginMethod: "local",
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      const user = await getUserByOpenId(openId);
      return { success: true, user, token: sessionToken };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  products: router({
    list: publicProcedure.query(() => listAvailableProducts()),
    listAll: adminOnly.query(() => listAllProducts()),
    reserve: publicProcedure.input(z2.object({ productId: z2.number().int().positive() })).mutation(async ({ input }) => {
      try {
        const reservation = await reserveProduct(input.productId);
        await notifyOwner({
          title: `\u062D\u062C\u0632 \u062C\u062F\u064A\u062F: ${reservation.name}`,
          content: `\u062A\u0645 \u062D\u062C\u0632 ${reservation.name} \u0645\u0624\u0642\u062A\u064B\u0627 \u0644\u0645\u062F\u0629 15 \u062F\u0642\u064A\u0642\u0629. \u0627\u0644\u062D\u062C\u0632 \u0633\u064A\u062A\u0645 \u062A\u062B\u0628\u064A\u062A\u0647 \u0646\u0647\u0627\u0626\u064A\u064B\u0627 \u0639\u0646\u062F \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0637\u0644\u0628.`
        });
        return reservation;
      } catch (error) {
        const message = error instanceof Error ? error.message : "RESERVATION_FAILED";
        if (message === "PRODUCT_UNAVAILABLE") throw new TRPCError3({ code: "CONFLICT", message: "\u0627\u0644\u0628\u0631\u0641\u0627\u0646 \u062F\u0647 \u0627\u062A\u062D\u062C\u0632 \u0628\u0627\u0644\u0641\u0639\u0644 \u0623\u0648 \u0644\u0645 \u064A\u0639\u062F \u0645\u062A\u0627\u062D\u064B\u0627." });
        throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u062D\u0635\u0644\u062A \u0645\u0634\u0643\u0644\u0629 \u0623\u062B\u0646\u0627\u0621 \u062D\u062C\u0632 \u0627\u0644\u0628\u0631\u0641\u0627\u0646." });
      }
    }),
    release: publicProcedure.input(z2.object({ productId: z2.number().int().positive(), reservationToken: z2.string().min(10).max(96) })).mutation(({ input }) => releaseReservation(input.productId, input.reservationToken)),
    create: adminOnly.input(createProductInput).mutation(async ({ input }) => {
      let imageUrl = input.imageUrl;
      if (input.imageData) {
        const match = input.imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) throw new TRPCError3({ code: "BAD_REQUEST", message: "\u0635\u064A\u063A\u0629 \u0627\u0644\u0635\u0648\u0631\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629." });
        const contentType = input.imageContentType || match[1];
        if (!contentType.startsWith("image/")) throw new TRPCError3({ code: "BAD_REQUEST", message: "\u0627\u062E\u062A\u0627\u0631\u064A \u0645\u0644\u0641 \u0635\u0648\u0631\u0629 \u0641\u0642\u0637." });
        const extension = contentType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "jpg";
        const uploaded = await storagePut(`products/${Date.now()}.${extension}`, Buffer.from(match[2], "base64"), contentType);
        imageUrl = uploaded.url;
      }
      return createProduct({ ...input, imageUrl });
    }),
    update: adminOnly.input(productInput.partial().extend({
      id: z2.number().int().positive(),
      status: z2.enum(["available", "reserved", "sold"]).optional()
    })).mutation(({ input }) => updateProduct(input)),
    remove: adminOnly.input(z2.object({ id: z2.number().int().positive() })).mutation(({ input }) => deleteProduct(input.id))
  }),
  orders: router({
    create: publicProcedure.input(z2.object({
      customerName: z2.string().min(2).max(160),
      phone: z2.string().min(6).max(32),
      governorate: z2.string().min(2).max(100),
      area: z2.string().min(2).max(100),
      address: z2.string().min(5).max(1e3),
      notes: z2.string().max(1e3).optional(),
      shippingFee: z2.number().int().min(0).max(1e5),
      items: z2.array(z2.object({ productId: z2.number().int().positive(), reservationToken: z2.string().min(10).max(96) })).min(1).max(20)
    })).mutation(async ({ input }) => {
      try {
        const result = await createOrder(input);
        await notifyOwner({
          title: `\u0637\u0644\u0628 \u0645\u0624\u0643\u062F: ${result.orderNumber}`,
          content: `\u0627\u0644\u0639\u0645\u064A\u0644\u0629: ${input.customerName}
\u0627\u0644\u0647\u0627\u062A\u0641: ${input.phone}
\u0627\u0644\u0639\u0646\u0648\u0627\u0646: ${input.governorate}\u060C ${input.area}\u060C ${input.address}
\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A: ${result.total} \u062C\u0646\u064A\u0647
\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062F\u0641\u0639: \u0643\u0627\u0634 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645
\u0627\u0644\u0637\u0644\u0628: ${input.items.map((item) => `#${item.productId}`).join(", ")}`
        });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "ORDER_FAILED";
        if (message === "PRODUCT_UNAVAILABLE") throw new TRPCError3({ code: "CONFLICT", message: "\u0623\u062D\u062F \u0627\u0644\u0628\u0631\u0641\u0627\u0646\u0627\u062A \u0644\u0645 \u064A\u0639\u062F \u0645\u062A\u0627\u062D\u064B\u0627. \u0627\u0631\u062C\u0639\u064A \u0644\u0644\u0633\u0644\u0629 \u0648\u062D\u0627\u0648\u0644\u064A \u0645\u0631\u0629 \u0623\u062E\u0631\u0649." });
        if (message === "DUPLICATE_PRODUCT") throw new TRPCError3({ code: "BAD_REQUEST", message: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0636\u0627\u0641\u0629 \u0646\u0641\u0633 \u0627\u0644\u0628\u0631\u0641\u0627\u0646 \u0645\u0631\u062A\u064A\u0646." });
        throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u062D\u0635\u0644\u062A \u0645\u0634\u0643\u0644\u0629 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0637\u0644\u0628." });
      }
    }),
    list: adminOnly.query(() => listOrders()),
    updateStatus: adminOnly.input(z2.object({
      id: z2.number().int().positive(),
      status: z2.enum(["new", "confirmed", "processing", "shipped", "delivered", "cancelled"])
    })).mutation(({ input }) => updateOrderStatus(input.id, input.status))
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs3 from "fs";
import { nanoid } from "nanoid";
import path4 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path3 from "node:path";
import { defineConfig } from "vite";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path3.resolve(import.meta.dirname),
  root: path3.resolve(import.meta.dirname, "client"),
  publicDir: path3.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path4.resolve(import.meta.dirname, "../..", "dist", "public") : path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
process.env.NODE_ENV = process.env.NODE_ENV || "development";
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  const uploadsDir = path5.resolve(process.cwd(), "uploads");
  if (!fs4.existsSync(uploadsDir)) {
    fs4.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express2.static(uploadsDir));
  const publicStorageDir = path5.resolve(process.cwd(), "client", "public", "manus-storage");
  if (fs4.existsSync(publicStorageDir)) {
    app.use("/manus-storage", express2.static(publicStorageDir));
  }
  const distStorageDir = path5.resolve(process.cwd(), "dist", "public", "manus-storage");
  if (fs4.existsSync(distStorageDir)) {
    app.use("/manus-storage", express2.static(distStorageDir));
  }
  app.use("/manus-storage", express2.static(uploadsDir));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
