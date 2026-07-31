/**
 * Shared shapes used across the app (JSDoc typedefs — documentation only).
 *
 * @typedef {'synced' | 'pending' | 'deleted'} SyncStatus
 *
 * @typedef {{ year: number, month: number, day: number }} BsDateParts
 *   `month` is 1-based (1 = Baisakh ... 12 = Chaitra).
 *
 * @typedef {{
 *   id: string,
 *   bsDate: string,        // zero-padded BS date 'YYYY-MM-DD'
 *   adDate: string,        // zero-padded Gregorian date 'YYYY-MM-DD'
 *   title: string|null,
 *   salesAmount: number,
 *   profit: number|null,
 *   createdAt: string,     // ISO-8601
 *   updatedAt: string,     // ISO-8601 (used for last-write-wins sync)
 *   syncStatus: SyncStatus,
 *   deletedAt: string|null
 * }} Sale
 *
 * @typedef {{
 *   bsDate: string,
 *   adDate: string,
 *   title?: string|null,
 *   salesAmount: number,
 *   profit?: number|null
 * }} SaleInput
 *
 * @typedef {{ totalSales: number, totalProfit: number, count: number }} SalesSummary
 *
 * @typedef {{ id: string, status: 'synced'|'deleted'|'up-to-date' }} PushBatchResult
 *
 * @typedef {{ sales: Sale[], total: number }} RemoteSales
 */

export {};
