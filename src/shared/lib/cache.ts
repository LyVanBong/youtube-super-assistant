interface CacheEntry {
  data: any;
  expire: number;
}

const cache: { [key: string]: CacheEntry } = {};

export const get = (key: string): any | null => {
    if (cache[key] && cache[key].expire > Date.now()) {
        return cache[key].data;
    }
    delete cache[key]; // Expired or non-existent
    return null;
};

export const set = (key: string, data: any, ttl = 60 * 60 * 1000): void => {
    cache[key] = {
        data,
        expire: Date.now() + ttl,
    };
};

export const clear = (): void => {
    Object.keys(cache).forEach(key => delete cache[key]);
};
