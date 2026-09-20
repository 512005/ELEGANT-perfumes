import { describe, expect, it } from "vitest";
import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(user = null): { ctx: TrpcContext; setCookies: any[] } {
  const setCookies: any[] = [];
  const ctx: TrpcContext = {
    user,
    req: {
      headers: {},
      protocol: "http",
    } as any,
    res: {
      cookie: (name: string, value: string, options: any) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: () => {},
    } as any,
  };
  return { ctx, setCookies };
}

describe("Standalone Store & Database Integration", () => {
  it("loads available products from local persistent store", async () => {
    const products = await db.listAllProducts();
    expect(products.length).toBeGreaterThanOrEqual(11);
    expect(products.some((p) => p.name.includes("IBRAQ Brazilian tobacco"))).toBe(true);
    expect(products.some((p) => p.name.includes("BURBERRY TOUCH"))).toBe(true);
  });

  it("handles product reservation and expiration logic", async () => {
    const products = await db.listAvailableProducts();
    const product = products.find((p) => p.status === "available");
    expect(product).toBeDefined();

    const reservation = await db.reserveProduct(product!.id);
    expect(reservation.id).toBe(product!.id);
    expect(reservation.reservationToken).toBeTruthy();
    expect(new Date(reservation.reservationExpiresAt).getTime()).toBeGreaterThan(Date.now());

    // Releasing reservation restores status to available
    await db.releaseReservation(product!.id, reservation.reservationToken);
    const updated = (await db.listAllProducts()).find((p) => p.id === product!.id);
    expect(updated?.status).toBe("available");
  });

  it("processes a full customer checkout order", async () => {
    const products = await db.listAvailableProducts();
    const product = products.find((p) => p.status === "available")!;
    const reservation = await db.reserveProduct(product.id);

    const orderResult = await db.createOrder({
      customerName: "ياسمين كمال",
      phone: "01099887766",
      governorate: "الجيزة",
      area: "الدقي",
      address: "شارع مصدق، عمارة 5",
      notes: "التسليم بعد الساعة 4 مساءً",
      shippingFee: 60,
      items: [
        {
          productId: reservation.id,
          reservationToken: reservation.reservationToken,
        },
      ],
    });

    expect(orderResult.orderNumber).toMatch(/^PF-/);
    expect(orderResult.total).toBe(reservation.price + 60);
    expect(orderResult.items[0].name).toBe(product.name);

    // Order should appear in listOrders
    const orders = await db.listOrders();
    const foundOrder = orders.find((o) => o.orderNumber === orderResult.orderNumber);
    expect(foundOrder).toBeDefined();
    expect(foundOrder?.customerName).toBe("ياسمين كمال");
    expect(foundOrder?.status).toBe("new");
  });

  it("authenticates admin directly with password without external OAuth", async () => {
    const { ctx, setCookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({
      email: "bassantsaleh2005@gmail.com",
      password: "novalre2026",
    });

    expect(result.success).toBe(true);
    expect(result.user?.role).toBe("admin");
    expect(setCookies.length).toBeGreaterThanOrEqual(1);
    expect(setCookies[0].name).toBe("app_session_id");
  });

  it("rejects unauthorized login attempts", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "bassantsaleh2005@gmail.com",
        password: "wrong_password_xyz",
      })
    ).rejects.toThrow("كلمة المرور غير صحيحة");
  });
});
