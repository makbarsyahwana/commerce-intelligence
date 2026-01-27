import { prisma } from "../container/prisma";
import { createLogger } from "../container/logger";
import type {
  DashboardMetrics,
  DashboardTrends,
  TrendInfo,
  OrderStatus,
  ProductCategory,
  RevenueCategory,
  RecentOrder,
  TopProduct,
} from "@/types/dashboard";

const logger = createLogger({ operation: 'dashboardQueries' });

/**
 * Get metric cards data for dashboard overview
 */
export async function getMetricCards(dateRange?: { from: Date; to: Date }) {
  try {
    logger.debug('Fetching metric cards data', { dateRange });

    const resolvedTo = dateRange?.to ?? new Date();
    const resolvedFrom = dateRange?.from ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rangeMs = resolvedTo.getTime() - resolvedFrom.getTime();
    const previousTo = resolvedFrom;
    const previousFrom = new Date(resolvedFrom.getTime() - rangeMs);

    const currentCreatedAtFilter = {
      createdAt: {
        gte: resolvedFrom,
        lte: resolvedTo,
      },
    };

    const previousCreatedAtFilter = {
      createdAt: {
        gte: previousFrom,
        lte: previousTo,
      },
    };

    const dateFilter = dateRange ? {
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to
      }
    } : {};

    const buildTrend = (current: number, previous: number): TrendInfo => {
      if (previous === 0 && current === 0) {
        return { value: 0, direction: 'neutral' };
      }

      if (previous === 0) {
        return { value: 100, direction: 'up' };
      }

      const pct = ((current - previous) / previous) * 100;
      const rounded = Math.round(Math.abs(pct));
      if (pct > 0.5) return { value: rounded, direction: 'up' };
      if (pct < -0.5) return { value: rounded, direction: 'down' };
      return { value: 0, direction: 'neutral' };
    };

    const [
      totalProducts,
      totalOrders,
      totalRevenue,
      totalProviders,
      latestSyncRun,
      productsCurrent,
      productsPrevious,
      ordersCurrent,
      ordersPrevious,
      revenueCurrent,
      revenuePrevious,
      providersCurrent,
      providersPrevious,
    ] = await Promise.all([
      // Total products count
      prisma.product.count(),
      
      // Total orders count (with optional date filter)
      prisma.order.count({
        where: dateFilter
      }),
      
      // Total revenue from completed orders (with optional date filter)
      prisma.order.aggregate({
        where: { 
          status: 'completed',
          ...dateFilter
        },
        _sum: { totalPrice: true }
      }),
      
      // Total unique providers
      prisma.product.groupBy({
        by: ['provider']
      }),
      
      // Latest sync run status
      prisma.syncRun.findFirst({
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          errorMessage: true,
          productsFetched: true,
          ordersFetched: true
        }
      }),

      // Trends (default: last 7 days vs previous 7 days)
      prisma.product.count({ where: currentCreatedAtFilter }),
      prisma.product.count({ where: previousCreatedAtFilter }),

      prisma.order.count({ where: currentCreatedAtFilter }),
      prisma.order.count({ where: previousCreatedAtFilter }),

      prisma.order.aggregate({
        where: {
          status: 'completed',
          ...currentCreatedAtFilter,
        },
        _sum: { totalPrice: true },
      }),
      prisma.order.aggregate({
        where: {
          status: 'completed',
          ...previousCreatedAtFilter,
        },
        _sum: { totalPrice: true },
      }),

      prisma.product.groupBy({ by: ['provider'], where: currentCreatedAtFilter }),
      prisma.product.groupBy({ by: ['provider'], where: previousCreatedAtFilter }),
    ]);

    const trends: DashboardTrends = {
      products: buildTrend(productsCurrent, productsPrevious),
      orders: buildTrend(ordersCurrent, ordersPrevious),
      revenue: buildTrend(
        Number(revenueCurrent._sum.totalPrice || 0),
        Number(revenuePrevious._sum.totalPrice || 0)
      ),
      providers: buildTrend(providersCurrent.length, providersPrevious.length),
    };

    const metrics: DashboardMetrics = {
      totalProducts,
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.totalPrice || 0),
      totalProviders: totalProviders.length,
      trends,
      latestSyncRun: latestSyncRun || null,
      dateRange: dateRange || null
    };

    logger.info('Metric cards data fetched successfully', metrics);
    return metrics;
  } catch (error) {
    logger.error('Failed to fetch metric cards data', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Get orders grouped by status for chart
 */
export async function getOrdersByStatus() {
  try {
    logger.debug('Fetching orders by status');

    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalPrice: true }
    });

    const result: OrderStatus[] = ordersByStatus.map(({ status, _count, _sum }) => ({
      status,
      count: _count.id,
      totalRevenue: Number(_sum.totalPrice || 0)
    }));

    logger.info('Orders by status fetched successfully', { count: result.length });
    return result;
  } catch (error) {
    logger.error('Failed to fetch orders by status', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Get products grouped by category for chart
 */
export async function getProductsByCategory() {
  try {
    logger.debug('Fetching products by category');

    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      _avg: { price: true },
      _sum: { price: true }
    });

    const result: ProductCategory[] = productsByCategory.map(({ category, _count, _avg, _sum }) => ({
      category: category || 'Uncategorized',
      count: _count.id,
      avgPrice: Number(_avg.price || 0),
      totalValue: Number(_sum.price || 0)
    }));

    logger.info('Products by category fetched successfully', { count: result.length });
    return result;
  } catch (error) {
    logger.error('Failed to fetch products by category', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Get revenue grouped by category for chart
 */
export async function getRevenueByCategory() {
  try {
    logger.debug('Fetching revenue by category');

    // Prisma approach - type-safe and maintainable
    const orderItemsByCategory = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: 'completed'
        }
      },
      _sum: {
        quantity: true
      },
      _count: {
        id: true
      }
    });

    // Get product details for each group
    const productIds = orderItemsByCategory.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, category: true }
    });

    // Combine and group by category
    const categoryMap = new Map<string, { orderCount: number; quantity: number }>();
    
    orderItemsByCategory.forEach(({ productId, _sum, _count }) => {
      const productDetail = products.find(p => p.id === productId);
      const category = productDetail?.category || 'Uncategorized';
      
      const existing = categoryMap.get(category);
      if (existing) {
        existing.orderCount += _count?.id || 0;
        existing.quantity += Number(_sum?.quantity || 0);
      } else {
        categoryMap.set(category, {
          orderCount: _count?.id || 0,
          quantity: Number(_sum?.quantity || 0)
        });
      }
    });

    // Convert to array and sort
    const result: RevenueCategory[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        orderCount: data.orderCount,
        quantity: data.quantity
      }))
      .sort((a, b) => b.orderCount - a.orderCount);

    logger.info('Revenue by category fetched successfully', { count: result.length });
    return result;
  } catch (error) {
    logger.error('Failed to fetch revenue by category', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Get recent orders for dashboard table
 */
export async function getRecentOrders(limit = 5) {
  try {
    logger.debug('Fetching recent orders', { limit });

    const recentOrders = await prisma.order.findMany({
      select: {
        id: true,
        providerOrderId: true,
        provider: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        _count: {
          select: { orderItems: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const normalized: RecentOrder[] = recentOrders.map((o) => ({
      ...o,
      providerOrderId: o.providerOrderId.toString(),
      totalPrice: Number(o.totalPrice),
    }));

    logger.info('Recent orders fetched successfully', { count: normalized.length });
    return normalized;
  } catch (error) {
    logger.error('Failed to fetch recent orders', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Get top products by revenue for dashboard
 */
export async function getTopProducts(limit = 5) {
  try {
    logger.debug('Fetching top products', { limit });

    // Prisma approach - type-safe and maintainable
    const orderItemStats = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: 'completed'
        }
      },
      _sum: {
        quantity: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    });

    // Get product details for top items
    const productIds = orderItemStats.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        provider: true,
        category: true,
        price: true,
        availability: true,
        rating: true,
        discount: true
      }
    });

    // Combine data
    const result = orderItemStats.map(({ productId, _sum, _count }) => {
      const product = products.find(p => p.id === productId);
      if (!product) return null;

      return {
        id: product.id,
        name: product.name,
        provider: product.provider,
        category: product.category,
        price: Number(product.price),
        availability: Boolean(product.availability),
        rating: product.rating ? Number(product.rating) : null,
        discount: product.discount,
        orderCount: _count?.id || 0,
        totalQuantity: Number(_sum?.quantity || 0)
      };
    }).filter((p): p is TopProduct => p !== null);

    logger.info('Top products fetched successfully', { count: result.length });
    return result;
  } catch (error) {
    logger.error('Failed to fetch top products', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Get latest sync run for status display
 */
export async function getLatestSyncRun() {
  try {
    logger.debug('Fetching latest sync run');

    const latestSyncRun = await prisma.syncRun.findFirst({
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        provider: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        errorMessage: true,
        productsFetched: true,
        ordersFetched: true
      }
    });

    logger.info('Latest sync run fetched successfully', { 
      hasData: !!latestSyncRun 
    });
    return latestSyncRun;
  } catch (error) {
    logger.error('Failed to fetch latest sync run', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}
