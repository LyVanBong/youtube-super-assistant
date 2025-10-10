interface CacheEntry<T> {
  data: T;
  expire: number;
}

const cache: { [key: string]: CacheEntry<unknown> } = {};

export const get = <T>(key: string): T | null => {
    if (cache[key] && cache[key].expire > Date.now()) {
        return cache[key].data as T;
    }
    delete cache[key]; // Expired or non-existent
    return null;
};

export const set = <T>(key: string, data: T, ttl = 60 * 60 * 1000): void => {
    cache[key] = {
        data,
        expire: Date.now() + ttl,
    };
};

export const clear = (): void => {
    Object.keys(cache).forEach(key => delete cache[key]);
};