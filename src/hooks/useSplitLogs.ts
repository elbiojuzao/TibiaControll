import { useCallback } from 'react';
import type { CreateSplitLogDto } from '@/types';
import { repositories } from '@/services/repositories';

export function useSplitLogs(accountId: string) {
  const createSplitLog = useCallback(
    (dto: CreateSplitLogDto) => repositories.splitLog.create(accountId, dto),
    [accountId],
  );

  return { createSplitLog };
}
