import { SYNC_CONSTANTS } from "../config/constants";
import { ProductVariations, OrderVariations } from "../../../types/sync";

export function addVariation(value: number, percentage: number = SYNC_CONSTANTS.VARIATIONS.PRICE): number {
  const variation = 1 - percentage + Math.random() * (percentage * 2);
  return Number((value * variation).toFixed(SYNC_CONSTANTS.DECIMAL_PRECISION));
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
