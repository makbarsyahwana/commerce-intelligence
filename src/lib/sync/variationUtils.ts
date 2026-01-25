import { SYNC_CONSTANTS } from "./constants";

/**
 * Add small random variation to make charts more interesting
 * @param value - Original numeric value
 * @param percentage - Variation percentage (default 0.05 = 5%)
 * @returns Varied value with 2 decimal precision
 */
export function addVariation(value: number, percentage: number = SYNC_CONSTANTS.VARIATIONS.PRICE): number {
  const variation = 1 - percentage + Math.random() * (percentage * 2);
  return Number((value * variation).toFixed(SYNC_CONSTANTS.DECIMAL_PRECISION));
}

/**
 * Apply provider-specific variations to product data
 */
export interface ProductVariations {
  price?: number;
  discount?: number;
  rating?: number;
}

export function applyProductVariations(
  price: number,
  discount: number | null,
  rating: number | null,
  variations: ProductVariations = {}
) {
  const variedPrice = addVariation(price, variations.price ?? SYNC_CONSTANTS.VARIATIONS.PRICE);
  const variedDiscount = discount ? addVariation(discount, variations.discount ?? SYNC_CONSTANTS.VARIATIONS.DISCOUNT) : null;
  const variedRating = rating ? addVariation(rating, variations.rating ?? SYNC_CONSTANTS.VARIATIONS.RATING) : null;

  return { variedPrice, variedDiscount, variedRating };
}

/**
 * Apply provider-specific variations to order data
 */
export interface OrderVariations {
  totalPrice?: number;
}

export function applyOrderVariations(
  totalPrice: number,
  variations: OrderVariations = {}
) {
  const variedTotalPrice = addVariation(
    totalPrice, 
    variations.totalPrice ?? SYNC_CONSTANTS.VARIATIONS.TOTAL_PRICE
  );

  return { variedTotalPrice };
}
