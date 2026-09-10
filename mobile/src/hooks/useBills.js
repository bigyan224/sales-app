import { useBillsStore } from '../state/billStore';

/** Convenience hook over the bills store for screens. */
export function useBills() {
  const bills = useBillsStore((s) => s.bills);
  const loading = useBillsStore((s) => s.loading);
  const refresh = useBillsStore((s) => s.refresh);
  const addBill = useBillsStore((s) => s.addBill);
  const updateBill = useBillsStore((s) => s.updateBill);
  const removeBill = useBillsStore((s) => s.removeBill);

  return {
    bills,
    loading,
    refresh,
    addBill,
    updateBill,
    removeBill,
  };
}
