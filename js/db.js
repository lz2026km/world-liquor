/**
 * ================================================
 * 世界烈酒图鉴 - IndexedDB 缓存管理
 * T02: IndexedDB缓存实现
 * ================================================
 */

const DB_NAME = 'WorldLiquorDB';
const DB_VERSION = 1;
const STORE_LIQUORS = 'liquors';
const STORE_META = 'meta';

let dbInstance = null;

/**
 * 打开或创建IndexedDB数据库
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // 创建烈酒数据存储仓库
            if (!db.objectStoreNames.contains(STORE_LIQUORS)) {
                const store = db.createObjectStore(STORE_LIQUORS, { keyPath: 'id' });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('region', 'region', { unique: false });
                store.createIndex('price', 'price', { unique: false });
                store.createIndex('name', 'name', { unique: false });
            }

            // 创建元数据存储仓库（用于存储更新时间、版本等信息）
            if (!db.objectStoreNames.contains(STORE_META)) {
                db.createObjectStore(STORE_META, { keyPath: 'key' });
            }
        };
    });
}

/**
 * 将烈酒数据存入IndexedDB
 * @param {Array} liquors - 烈酒数据数组
 * @param {string} type - 数据类型（可选，用于分类存储）
 * @returns {Promise<void>}
 */
async function cacheLiquorsToDB(liquors, type = 'all') {
    const db = await openDB();
    const tx = db.transaction(STORE_LIQUORS, 'readwrite');
    const store = tx.objectStore(STORE_LIQUORS);

    // 批量写入数据
    for (const liquor of liquors) {
        store.put({ ...liquor, _cachedType: type, _cachedAt: Date.now() });
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * 从IndexedDB读取所有缓存的烈酒数据
 * @param {string} type - 数据类型筛选（可选，空表示全部）
 * @returns {Promise<Array>}
 */
async function getCachedLiquors(type = null) {
    const db = await openDB();
    const tx = db.transaction(STORE_LIQUORS, 'readonly');
    const store = tx.objectStore(STORE_LIQUORS);

    return new Promise((resolve, reject) => {
        const results = [];
        const request = type 
            ? store.index('type').getAll(type) 
            : store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 获取特定类型的缓存数据
 * @param {string} type - 烈酒类型
 * @returns {Promise<Array>}
 */
async function getLiquorsByType(type) {
    return getCachedLiquors(type);
}

/**
 * 更新缓存元数据
 * @param {string} key - 键名
 * @param {any} value - 值
 * @returns {Promise<void>}
 */
async function updateCacheMeta(key, value) {
    const db = await openDB();
    const tx = db.transaction(STORE_META, 'readwrite');
    const store = tx.objectStore(STORE_META);
    store.put({ key, value, updatedAt: Date.now() });

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * 获取缓存元数据
 * @param {string} key - 键名
 * @returns {Promise<any>}
 */
async function getCacheMeta(key) {
    const db = await openDB();
    const tx = db.transaction(STORE_META, 'readonly');
    const store = tx.objectStore(STORE_META);

    return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result?.value);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 检查缓存是否有效
 * @param {number} maxAge - 最大缓存年龄（毫秒）
 * @returns {Promise<boolean>}
 */
async function isCacheValid(maxAge = 24 * 60 * 60 * 1000) {
    try {
        const meta = await getCacheMeta('lastUpdate');
        if (!meta) return false;
        return (Date.now() - meta.updatedAt) < maxAge;
    } catch {
        return false;
    }
}

/**
 * 清除所有缓存数据
 * @returns {Promise<void>}
 */
async function clearAllCache() {
    const db = await openDB();
    const tx = db.transaction([STORE_LIQUORS, STORE_META], 'readwrite');
    
    tx.objectStore(STORE_LIQUORS).clear();
    tx.objectStore(STORE_META).clear();

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * 获取缓存统计信息
 * @returns {Promise<{count: number, types: Object, lastUpdate: number}>}
 */
async function getCacheStats() {
    const liquors = await getCachedLiquors();
    const meta = await getCacheMeta('lastUpdate');
    
    const types = {};
    liquors.forEach(l => {
        if (l._cachedType) {
            types[l._cachedType] = (types[l._cachedType] || 0) + 1;
        }
    });

    return {
        count: liquors.length,
        types,
        lastUpdate: meta?.updatedAt || null
    };
}

/**
 * 批量缓存不同类型的数据（支持分片）
 * @param {Object} dataByType - 按类型分组的数据对象
 * @returns {Promise<void>}
 */
async function batchCacheByType(dataByType) {
    await updateCacheMeta('lastUpdate', Date.now());
    
    for (const [type, data] of Object.entries(dataByType)) {
        await cacheLiquorsToDB(data, type);
    }
}

// 导出全局函数
window.LiquorDB = {
    openDB,
    cacheLiquorsToDB,
    getCachedLiquors,
    getLiquorsByType,
    updateCacheMeta,
    getCacheMeta,
    isCacheValid,
    clearAllCache,
    getCacheStats,
    batchCacheByType
};