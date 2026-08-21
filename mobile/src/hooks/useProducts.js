import { useProductsStore } from '../state/productStore';

/** Convenience hook over the products store for screens. */
export function useProducts() {
  const products = useProductsStore((s) => s.products);
  const loading = useProductsStore((s) => s.loading);
  const refresh = useProductsStore((s) => s.refresh);
  const addProduct = useProductsStore((s) => s.addProduct);
  const updateProduct = useProductsStore((s) => s.updateProduct);
  const removeProduct = useProductsStore((s) => s.removeProduct);

  return {
    products,
    loading,
    refresh,
    addProduct,
    updateProduct,
    removeProduct,
  };
}
