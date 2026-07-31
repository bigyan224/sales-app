import { create } from 'zustand';
import { saleRepository } from '../db/saleRepository';
import { syncService } from '../services/syncService';
import { bsDateString, todayBs } from '../services/nepaliDate';
import { newUuid } from '../utils/id';
import { useSyncStore } from './syncStore';

function refreshPendingCount() {
  void useSyncStore.getState().refreshPendingCount();
}

function triggerSync() {
  void syncService.syncNow();
}

export const useSalesStore = create((set, get) => ({
  sales: [],
  todaySummary: { totalSales: 0, totalProfit: 0, count: 0 },
  loading: true,

  refresh: async () => {
    const today = bsDateString(todayBs());
    const [sales, todaySummary] = await Promise.all([
      saleRepository.getAllActiveSales(),
      saleRepository.getSummaryByDate(today),
    ]);
    set({ sales, todaySummary, loading: false });
    refreshPendingCount();
  },

  addSale: async (input) => {
    const now = new Date().toISOString();
    const sale = {
      id: newUuid(),
      bsDate: input.bsDate,
      adDate: input.adDate,
      title: input.title?.trim() || null,
      salesAmount: input.salesAmount,
      profit: input.profit ?? null,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deletedAt: null,
    };
    await saleRepository.insertSale(sale);
    await get().refresh();
    triggerSync();
    return sale;
  },

  updateSale: async (id, input) => {
    const existing = await saleRepository.getSaleById(id);
    if (!existing) return;
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      bsDate: input.bsDate,
      adDate: input.adDate,
      title: input.title?.trim() || null,
      salesAmount: input.salesAmount,
      profit: input.profit ?? null,
      updatedAt: now,
      syncStatus: 'pending',
      deletedAt: null,
    };
    await saleRepository.updateSale(updated);
    await get().refresh();
    triggerSync();
  },

  removeSale: async (id) => {
    await saleRepository.softDeleteSale(id);
    await get().refresh();
    triggerSync();
  },
}));
