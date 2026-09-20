import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";

const ADMIN_EMAILS = new Set(["bassantsaleh2005@gmail.com", "legend.yousif2012@gmail.com"]);

const adminOnly = protectedProcedure.use(({ ctx, next }) => {
  const email = ctx.user.email?.trim().toLowerCase();
  const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isAdmin =
    ctx.user.role === "admin" ||
    (Boolean(email) && ADMIN_EMAILS.has(email!)) ||
    (Boolean(configuredAdminEmail) && email === configuredAdminEmail);

  if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح: صلاحيات المسؤول مطلوبة" });
  return next();
});

const productInput = z.object({
  name: z.string().min(2).max(180),
  description: z.string().max(5000).optional(),
  size: z.string().max(64).optional(),
  audience: z.enum(["men", "women"]).default("men"),
  price: z.number().int().min(1).max(100000000),
  imageUrl: z.string().max(2000).optional(),
});

const createProductInput = productInput.extend({
  imageData: z.string().max(8000000).optional(),
  imageContentType: z.string().max(80).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email("صيغة البريد الإلكتروني غير صحيحة"),
          password: z.string().min(1, "كلمة المرور مطلوبة"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const isValidAdmin =
          ADMIN_EMAILS.has(email) ||
          (Boolean(configuredAdminEmail) && email === configuredAdminEmail);

        if (!isValidAdmin) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "البريد الإلكتروني غير مسجل كمسؤول للمتجر.",
          });
        }

        const expectedPassword = process.env.ADMIN_PASSWORD || "novalre2026";
        if (input.password !== expectedPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "كلمة المرور غير صحيحة.",
          });
        }

        const openId = `admin-${email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "")}`;
        const name = email.includes("bassant") ? "Bassant Saleh" : "Store Admin";

        await db.upsertUser({
          openId,
          email,
          name,
          role: "admin",
          loginMethod: "local",
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(openId, {
          name,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        const user = await db.getUserByOpenId(openId);
        return { success: true, user, token: sessionToken };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  products: router({
    list: publicProcedure.query(() => db.listAvailableProducts()),
    listAll: adminOnly.query(() => db.listAllProducts()),
    reserve: publicProcedure.input(z.object({ productId: z.number().int().positive() })).mutation(async ({ input }) => {
      try {
        const reservation = await db.reserveProduct(input.productId);
        await notifyOwner({
          title: `حجز جديد: ${reservation.name}`,
          content: `تم حجز ${reservation.name} مؤقتًا لمدة 15 دقيقة. الحجز سيتم تثبيته نهائيًا عند تأكيد الطلب.`,
        });
        return reservation;
      } catch (error) {
        const message = error instanceof Error ? error.message : "RESERVATION_FAILED";
        if (message === "PRODUCT_UNAVAILABLE") throw new TRPCError({ code: "CONFLICT", message: "البرفان ده اتحجز بالفعل أو لم يعد متاحًا." });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "حصلت مشكلة أثناء حجز البرفان." });
      }
    }),
    release: publicProcedure.input(z.object({ productId: z.number().int().positive(), reservationToken: z.string().min(10).max(96) })).mutation(({ input }) => db.releaseReservation(input.productId, input.reservationToken)),
    create: adminOnly.input(createProductInput).mutation(async ({ input }) => {
      let imageUrl = input.imageUrl;
      if (input.imageData) {
        const match = input.imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "صيغة الصورة غير صحيحة." });
        const contentType = input.imageContentType || match[1];
        if (!contentType.startsWith("image/")) throw new TRPCError({ code: "BAD_REQUEST", message: "اختاري ملف صورة فقط." });
        const extension = contentType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "jpg";
        const uploaded = await storagePut(`products/${Date.now()}.${extension}`, Buffer.from(match[2], "base64"), contentType);
        imageUrl = uploaded.url;
      }
      return db.createProduct({ ...input, imageUrl });
    }),
    update: adminOnly.input(productInput.partial().extend({
      id: z.number().int().positive(),
      status: z.enum(["available", "reserved", "sold"]).optional(),
    })).mutation(({ input }) => db.updateProduct(input)),
    remove: adminOnly.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteProduct(input.id)),
  }),
  orders: router({
    create: publicProcedure.input(z.object({
      customerName: z.string().min(2).max(160),
      phone: z.string().min(6).max(32),
      governorate: z.string().min(2).max(100),
      area: z.string().min(2).max(100),
      address: z.string().min(5).max(1000),
      notes: z.string().max(1000).optional(),
      shippingFee: z.number().int().min(0).max(100000),
      items: z.array(z.object({ productId: z.number().int().positive(), reservationToken: z.string().min(10).max(96) })).min(1).max(20),
    })).mutation(async ({ input }) => {
      try {
        const result = await db.createOrder(input);
        await notifyOwner({
          title: `طلب مؤكد: ${result.orderNumber}`,
          content: `العميلة: ${input.customerName}\nالهاتف: ${input.phone}\nالعنوان: ${input.governorate}، ${input.area}، ${input.address}\nالإجمالي: ${result.total} جنيه\nطريقة الدفع: كاش عند الاستلام\nالطلب: ${input.items.map((item) => `#${item.productId}`).join(", ")}`,
        });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "ORDER_FAILED";
        if (message === "PRODUCT_UNAVAILABLE") throw new TRPCError({ code: "CONFLICT", message: "أحد البرفانات لم يعد متاحًا. ارجعي للسلة وحاولي مرة أخرى." });
        if (message === "DUPLICATE_PRODUCT") throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن إضافة نفس البرفان مرتين." });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "حصلت مشكلة أثناء تسجيل الطلب." });
      }
    }),
    list: adminOnly.query(() => db.listOrders()),
    updateStatus: adminOnly.input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["new", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
    })).mutation(({ input }) => db.updateOrderStatus(input.id, input.status)),
  }),
});

export type AppRouter = typeof appRouter;
