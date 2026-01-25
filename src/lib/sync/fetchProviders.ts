import { ProviderConfig } from "../providers/config";
import { checkRateLimit } from "../providers/rateLimit";

export interface ProductResponse {
  product_id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  discount: number;
  availability: boolean;
  brand: string;
  category: string;
  rating: number;
  reviews?: Array<{
    user_id: number;
    rating: number;
    comment: string;
  }>;
}

export interface OrderResponse {
  order_id: number;
  user_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  total_price: number;
  status: string;
}

export async function fetchProducts(provider: ProviderConfig): Promise<ProductResponse[]> {
  try {
    // Check rate limit before making request
    if (provider.rateLimit) {
      await checkRateLimit(
        provider.name,
        provider.rateLimit.requests,
        provider.rateLimit.window
      );
    }

    console.log(`Fetching products from ${provider.name} at ${provider.productsApi}`);
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (provider.auth) {
      headers["Authorization"] = provider.auth;
    }

    const response = await fetch(provider.productsApi, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products from ${provider.name}: ${response.status} ${response.statusText}`);
    }

    const products = (await response.json()) as ProductResponse[];
    console.log(`Successfully fetched ${products.length} products from ${provider.name}`);
    return products;
  } catch (error) {
    console.error(`Error fetching products from ${provider.name}:`, error);
    throw new Error(`Products fetch failed for ${provider.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function fetchOrders(provider: ProviderConfig): Promise<OrderResponse[]> {
  try {
    // Check rate limit before making request
    if (provider.rateLimit) {
      await checkRateLimit(
        provider.name,
        provider.rateLimit.requests,
        provider.rateLimit.window
      );
    }

    console.log(`Fetching orders from ${provider.name} at ${provider.ordersApi}`);
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (provider.auth) {
      headers["Authorization"] = provider.auth;
    }

    const response = await fetch(provider.ordersApi, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders from ${provider.name}: ${response.status} ${response.statusText}`);
    }

    const orders = (await response.json()) as OrderResponse[];
    console.log(`Successfully fetched ${orders.length} orders from ${provider.name}`);
    return orders;
  } catch (error) {
    console.error(`Error fetching orders from ${provider.name}:`, error);
    throw new Error(`Orders fetch failed for ${provider.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
