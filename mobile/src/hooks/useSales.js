import { useSalesStore } from '../state/salesStore';

/** Convenience hook over the sales store for screens. */
export function useSales() {
  const sales = useSalesStore((s) => s.sales);
  const todaySummary = useSalesStore((s) => s.todaySummary);
  const loading = useSalesStore((s) => s.loading);
  const refresh = useSalesStore((s) => s.refresh);
  const addSale = useSalesStore((s) => s.addSale);
  const updateSale = useSalesStore((s) => s.updateSale);
  const removeSale = useSalesStore((s) => s.removeSale);

  return { sales, todaySummary, loading, refresh, addSale, updateSale, removeSale };
}
