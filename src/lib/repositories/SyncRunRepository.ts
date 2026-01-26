import { BaseRepository } from "./BaseRepository";
import { SyncStatus, SyncRunData, SyncRunUpdateData } from "../../types/sync";

export class SyncRunRepository extends BaseRepository {

  async create(data: SyncRunData) {
    try {
      const result = await this.prisma.syncRun.create({ data });
      this.logSuccess('SyncRun created', { id: result.id, provider: data.provider });
      return result;
    } catch (error) {
      this.handleError(error, 'SyncRun creation');
    }
  }

  async update(id: string, data: SyncRunUpdateData) {
    try {
      const result = await this.prisma.syncRun.update({
        where: { id },
        data,
      });
      this.logSuccess('SyncRun updated', { id, status: data.status });
      return result;
    } catch (error) {
      this.handleError(error, 'SyncRun update');
    }
  }

  async findLatest(provider?: string) {
    try {
      const where = provider ? { provider } : {};
      const result = await this.prisma.syncRun.findFirst({
        where,
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          errorMessage: true,
          productsFetched: true,
          ordersFetched: true,
          provider: true,
        }
      });
      return result;
    } catch (error) {
      this.handleError(error, 'Latest SyncRun fetch');
    }
  }

  async findRecent(limit: number = 10) {
    try {
      const results = await this.prisma.syncRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          errorMessage: true,
          productsFetched: true,
          ordersFetched: true,
          provider: true,
        }
      });
      return results;
    } catch (error) {
      this.handleError(error, 'Recent SyncRuns fetch');
    }
  }
}
