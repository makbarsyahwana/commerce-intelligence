-- CreateIndex
CREATE INDEX "Order_provider_idx" ON "Order"("provider");

-- CreateIndex
CREATE INDEX "Order_provider_providerOrderId_idx" ON "Order"("provider", "providerOrderId" DESC);

-- CreateIndex
CREATE INDEX "Product_provider_idx" ON "Product"("provider");
