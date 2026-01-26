import { prisma } from "../prisma";
import { SyncStatus, SyncRunUpdateData } from "../../types/sync";

export async function updateSyncRun(
  id: string,
  status: SyncStatus,
  errorMessage: string | null,
  productsFetched: number | null,
  ordersFetched: number | null
) {
  try {
    const updateData: SyncRunUpdateData = {
      status,
      finishedAt: new Date(),
    };

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    if (productsFetched !== null) {
      updateData.productsFetched = productsFetched;
    }

    if (ordersFetched !== null) {
      updateData.ordersFetched = ordersFetched;
    }

    const result = await prisma.syncRun.update({
      where: { id },
      data: updateData,
    });

    console.log(`Updated SyncRun ${id} to status: ${status}`);
    return result;
  } catch (error) {
    console.error(`Failed to update SyncRun ${id}:`, error);
    throw new Error(`SyncRun update failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
