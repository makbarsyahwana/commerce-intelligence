import { ProviderConfig } from "../../types/providers";

export type { ProviderConfig };

export const PROVIDERS: ProviderConfig[] = [
  {
    name: "fake-store",
    productsApi: "https://fake-store-api.mock.beeceptor.com/api/products",
    ordersApi: "https://fake-store-api.mock.beeceptor.com/api/orders",
    rateLimit: {
      requests: 10,
      window: 60, // 10 requests per minute
    },
    variations: {
      price: 0.05, // ±5%
      discount: 0.10, // ±10%
      rating: 0.05, // ±5%
      totalPrice: 0.03, // ±3%
      quantity: true, // ±1 unit
      unitPrice: 0.02, // ±2%
    },
  },
  // Add more providers here as needed
  // {
  //   name: "shopify",
  //   productsApi: "https://api.shopify.com/products",
  //   ordersApi: "https://api.shopify.com/orders",
  //   auth: "Bearer ${process.env.SHOPIFY_TOKEN}",
  //   rateLimit: {
  //     requests: 40,
  //     window: 60,
  //   },
  //   variations: {
  //     price: 0.03,
  //     discount: 0.05,
  //     rating: 0.02,
  //     totalPrice: 0.02,
  //     quantity: true,
  //     unitPrice: 0.01,
  //   },
  // },
];

export function getProviderByName(name: string): ProviderConfig | undefined {
  return PROVIDERS.find(p => p.name === name);
}

export function getAllProviders(): ProviderConfig[] {
  return PROVIDERS;
}
