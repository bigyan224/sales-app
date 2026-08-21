import axios from 'axios';
import { API_BASE_URL, PULL_LIMIT } from '../config';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const api = {
  /** Pushes local changes (edits + delete tombstones) to the server. */
  async pushBatch(sales) {
    const { data } = await client.post('/sales/batch-sync', { sales });
    return data.results;
  },

  /** Pulls records updated after `since` (null = everything). */
  async fetchRemote(since) {
    const { data } = await client.get('/sales', {
      params: { since: since ?? undefined, limit: PULL_LIMIT },
    });
    return data;
  },

  /** Pushes local product changes (edits + delete tombstones) to the server. */
  async pushProductBatch(products) {
    const { data } = await client.post('/products/batch-sync', { products });
    return data.results;
  },

  /** Pulls products updated after `since` (null = everything). */
  async fetchRemoteProducts(since) {
    const { data } = await client.get('/products', {
      params: { since: since ?? undefined, limit: PULL_LIMIT },
    });
    return data;
  },

  /** Reports whether the backend is reachable. */
  async ping() {
    try {
      await client.get('/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  },
};
