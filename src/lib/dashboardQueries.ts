import { prisma } from "./prisma";
import { createLogger } from "./logger";

const logger = createLogger({ operation: 'dashboardQueries' });

/**
 * Get metric cards data for dashboard overview
 */
export async function getMetricCards(dateRange?: { from: Date; to: Date }) {
  try {
    logger.debug('Fetching metric cards data', { dateRange });

    const dateFilter = dateRange ? {
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to
      }
    } : {};

    const [
      totalProducts,
      totalOrders,
      totalRevenue,
      totalProviders,
      latestSyncRun
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
      })
    ]);

    const metrics = {
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      totalProviders: totalProviders.length,
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

    const result = ordersByStatus.map(({ status, _count, _sum }) => ({
      status,
      count: _count.id,
      totalRevenue: _sum.totalPrice || 0
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

    const result = productsByCategory.map(({ category, _count, _avg, _sum }) => ({
      category: category || 'Uncategorized',
      count: _count.id,
      avgPrice: _avg.price || 0,
      totalValue: _sum.price || 0
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
    const result = Array.from(categoryMap.entries())
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

    logger.info('Recent orders fetched successfully', { count: recentOrders.length });
    return recentOrders;
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
        availability: product.availability,
        rating: product.rating ? Number(product.rating) : null,
        discount: product.discount,
        orderCount: _count?.id || 0,
        totalQuantity: Number(_sum?.quantity || 0)
      };
    }).filter(Boolean) as Array<{
      id: string;
      name: string;
      provider: string;
      category: string;
      price: number;
      availability: boolean;
      rating: number | null;
      discount: number | null;
      orderCount: number;
      totalQuantity: number;
    }>;

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
