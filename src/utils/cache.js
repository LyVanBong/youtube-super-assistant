// Simple cache for storing data
const cache = {};

export const get = (key) => {
    if (cache[key] && cache[key].expire > Date.now()) {
        return cache[key].data;
    }
    return null;
};

export const set = (key, data, ttl = 60 * 60 * 1000) => {
    cache[key] = {
        data,
        expire: Date.now() + ttl,
    };
};

export const clear = () => {
    Object.keys(cache).forEach(key => delete cache[key]);
};