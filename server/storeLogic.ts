export function getUniqueProductIds(productIds: number[]) {
  return Array.from(new Set(productIds));
}

export function calculateOrderTotals(prices: number[], shippingFee: number) {
  const subtotal = prices.reduce((sum, price) => sum + price, 0);
  return { subtotal, shippingFee, total: subtotal + shippingFee };
}
