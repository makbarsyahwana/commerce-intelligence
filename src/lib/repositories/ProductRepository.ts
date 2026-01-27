import { BaseRepository, TransactionClient } from "./BaseRepository";
import { ProductResponse, applyProductVariations } from "../sync";
import { ProviderConfig } from "../providers/config";

export class ProductRepository extends BaseRepository {
  constructor(tx?: TransactionClient) {
    super(tx);
  }

  async upsertProduct(product: ProductResponse, provider: ProviderConfig, syncedAt: Date) {
    try {
      const { variedPrice, variedDiscount, variedRating } = applyProductVariations(
        Number(product.price),
        product.discount,
        product.rating,
        provider.variations
      );

      const result = await this.prisma.product.upsert({
        where: { 
          provider_providerProductId: {
            provider: provider.name,
            providerProductId: product.product_id,
          }
        },
        update: {
          name: product.name,
          description: product.description,
          image: product.image,
          price: variedPrice,
          discount: variedDiscount,
          availability: product.availability,
          brand: product.brand,
          category: product.category,
          rating: variedRating,
          syncedAt,
        },
        create: {
          provider: provider.name,
          providerProductId: product.product_id,
          name: product.name,
          description: product.description,
          image: product.image,
          price: variedPrice,
          discount: variedDiscount,
          availability: product.availability,
          brand: product.brand,
          category: product.category,
          rating: variedRating,
          syncedAt,
        },
      });

      this.logSuccess('Product upserted', { 
        providerProductId: product.product_id,
        provider: provider.name 
      });

      return result;
    } catch (error) {
      this.handleError(error, 'Product upsert');
    }
  }

  async upsertProductReviews(product: ProductResponse, provider: ProviderConfig, syncedAt: Date) {
    if (!product.reviews || product.reviews.length === 0) {
      return;
    }

    try {
      // Delete existing reviews for this product
      await this.prisma.productReview.deleteMany({
        where: {
          product: {
            provider: provider.name,
            providerProductId: product.product_id,
          }
        }
      });

      // Create new reviews using the existing working pattern
      for (const review of product.reviews) {
        await this.prisma.productReview.create({
          data: {
            product: {
              connect: {
                provider_providerProductId: {
                  provider: provider.name,
                  providerProductId: product.product_id,
                }
              }
            },
            providerUserId: review.user_id,
            rating: review.rating,
            comment: review.comment,
            syncedAt,
          },
        });
      }

      this.logSuccess('Product reviews upserted', { 
        providerProductId: product.product_id,
        reviewCount: product.reviews.length 
      });
    } catch (error) {
      this.handleError(error, 'Product reviews upsert');
    }
  }

  async upsertProductsWithReviews(
    products: ProductResponse[], 
    provider: ProviderConfig, 
    syncedAt: Date
  ) {
    const results = await Promise.all(
      products.map(product => this.upsertProduct(product, provider, syncedAt))
    );

    // Handle reviews separately for better error handling
    await Promise.all(
      products.map(product => this.upsertProductReviews(product, provider, syncedAt))
    );

    return results;
  }
}
