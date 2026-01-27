import { ProviderConfig } from "../../providers/config";
import { checkRateLimit } from "../../providers/providerRateLimit";
import { ProductResponse, OrderResponse } from "../../../types/api";

export type { ProductResponse, OrderResponse };

async function fetchFromProvider<T>(
  provider: ProviderConfig,
  apiUrl: string,
  resourceType: string
): Promise<T[]> {
  if (provider.rateLimit) {
    await checkRateLimit(provider.name, provider.rateLimit.requests, provider.rateLimit.window);
  }

  console.log(`Fetching ${resourceType} from ${provider.name} at ${apiUrl}`);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (provider.auth) {
    headers["Authorization"] = provider.auth;
  }

  const response = await fetch(apiUrl, { method: "GET", headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${resourceType} from ${provider.name}: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as T[];
  console.log(`Successfully fetched ${data.length} ${resourceType} from ${provider.name}`);
  return data;
}

export async function fetchProducts(provider: ProviderConfig): Promise<ProductResponse[]> {
  try {
    return await fetchFromProvider<ProductResponse>(provider, provider.productsApi, "products");
  } catch (error) {
    console.error(`Error fetching products from ${provider.name}:`, error);
    throw new Error(`Products fetch failed for ${provider.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function fetchOrders(provider: ProviderConfig): Promise<OrderResponse[]> {
  try {
    return await fetchFromProvider<OrderResponse>(provider, provider.ordersApi, "orders");
  } catch (error) {
    console.error(`Error fetching orders from ${provider.name}:`, error);
    throw new Error(`Orders fetch failed for ${provider.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
