/**
 * ================================================
 * 世界烈酒图鉴 - 缓存策略管理
 * T11: 缓存策略实现（Cache-Control/ETag）
 * ================================================
 */

/**
 * 缓存策略配置
 */
const CacheStrategy = {
    // 缓存版本
    version: 'v5.5.0',
    
    // 缓存有效期（毫秒）
    maxAge: {
        // 静态资源（CSS/JS）- 1年
        static: 365 * 24 * 60 * 60 * 1000,
        // 数据文件 - 1天
        data: 24 * 60 * 60 * 1000,
        // 图片 - 7天
        images: 7 * 24 * 60 * 60 * 1000,
        // API响应 - 1小时
        api: 60 * 60 * 1000
    },
    
    // 存储键前缀
    storagePrefix: 'wl_'
};

/**
 * 获取localStorage缓存
 * @param {string} key
 * @returns {any}
 */
function getStorageCache(key) {
    try {
        const item = localStorage.getItem(CacheStrategy.storagePrefix + key);
        if (!item) return null;
        
        const { data, timestamp, expires } = JSON.parse(item);
        
        // 检查是否过期
        if (expires && Date.now() > timestamp + expires) {
            localStorage.removeItem(CacheStrategy.storagePrefix + key);
            return null;
        }
        
        return data;
    } catch (e) {
        console.warn('读取缓存失败:', e);
        return null;
    }
}

/**
 * 设置localStorage缓存
 * @param {string} key
 * @param {any} data
 * @param {number} maxAge - 最大缓存时间（毫秒）
 */
function setStorageCache(key, data, maxAge = CacheStrategy.maxAge.data) {
    try {
        const item = {
            data,
            timestamp: Date.now(),
            expires: maxAge,
            version: CacheStrategy.version
        };
        localStorage.setItem(CacheStrategy.storagePrefix + key, JSON.stringify(item));
        return true;
    } catch (e) {
        console.warn('写入缓存失败:', e);
        // 可能是存储空间不足，尝试清理旧缓存
        clearOldCaches();
        return false;
    }
}

/**
 * 清除旧版本缓存
 */
function clearOldCaches() {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CacheStrategy.storagePrefix)) {
                const item = localStorage.getItem(key);
                try {
                    const parsed = JSON.parse(item);
                    if (parsed.version !== CacheStrategy.version) {
                        keysToRemove.push(key);
                    }
                } catch (e) {
                    // 无效的JSON，删除
                    keysToRemove.push(key);
                }
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`已清除${keysToRemove.length}个旧版本缓存`);
    } catch (e) {
        console.warn('清理旧缓存失败:', e);
    }
}

/**
 * 生成ETag
 * @param {string} content
 * @returns {string}
 */
function generateETag(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `"${CacheStrategy.version}-${Math.abs(hash).toString(16)}"`;
}

/**
 * 检查是否需要更新（基于ETag）
 * @param {string} key
 * @param {string} currentETag
 * @returns {boolean}
 */
function needsUpdate(key, currentETag) {
    const cachedETag = getStorageCache(`etag_${key}`);
    if (!cachedETag) return true;
    return cachedETag !== currentETag;
}

/**
 * 保存ETag
 * @param {string} key
 * @param {string} etag
 */
function saveETag(key, etag) {
    setStorageCache(`etag_${key}`, etag, CacheStrategy.maxAge.static);
}

/**
 * 获取数据缓存统计
 * @returns {Object}
 */
function getCacheStats() {
    let totalItems = 0;
    let totalSize = 0;
    const categories = {
        static: { count: 0, size: 0 },
        data: { count: 0, size: 0 },
        images: { count: 0, size: 0 },
        other: { count: 0, size: 0 }
    };
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CacheStrategy.storagePrefix)) {
            totalItems++;
            const value = localStorage.getItem(key);
            const size = value ? value.length : 0;
            totalSize += size;
            
            // 分类统计
            if (key.includes('data')) {
                categories.data.count++;
                categories.data.size += size;
            } else if (key.includes('etag')) {
                categories.static.count++;
                categories.static.size += size;
            } else {
                categories.other.count++;
                categories.other.size += size;
            }
        }
    }
    
    return {
        totalItems,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        categories
    };
}

/**
 * 格式化字节大小
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 清除所有应用缓存
 */
function clearAllAppCache() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CacheStrategy.storagePrefix)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`已清除${keysToRemove.length}个缓存项`);
}

/**
 * 初始化缓存策略
 */
function initCacheStrategy() {
    // 清除旧版本缓存
    clearOldCaches();
    
    // 打印缓存统计
    const stats = getCacheStats();
    console.log('缓存统计:', stats);
    
    console.log('缓存策略已初始化');
}

// 导出全局函数
window.CacheStrategy = CacheStrategy;
window.getStorageCache = getStorageCache;
window.setStorageCache = setStorageCache;
window.clearOldCaches = clearOldCaches;
window.generateETag = generateETag;
window.needsUpdate = needsUpdate;
window.saveETag = saveETag;
window.getCacheStats = getCacheStats;
window.clearAllAppCache = clearAllAppCache;
window.initCacheStrategy = initCacheStrategy;