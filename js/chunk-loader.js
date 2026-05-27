/**
 * ================================================
 * 世界烈酒图鉴 - 分片加载管理
 * T01: 大数据分片加载（按type懒加载）
 * ================================================
 */

const CHUNK_SIZE = 50;  // 每批加载50条数据
const LOAD_DEBOUNCE = 100;  // 防抖延迟

/**
 * 分片加载器类 - 用于管理大数据量的分片加载
 */
class ChunkLoader {
    constructor() {
        this.chunks = new Map();  // 存储已加载的分片
        this.loadingPromises = new Map();  // 存储正在加载的Promise
        this.totalLoaded = 0;
        this.listeners = [];
    }

    /**
     * 加载指定类型的分片数据
     * @param {string} type - 烈酒类型
     * @param {number} chunkIndex - 分片索引
     * @returns {Promise<Array>}
     */
    async loadChunk(type, chunkIndex) {
        const chunkKey = `${type}_${chunkIndex}`;
        
        // 如果已缓存，直接返回
        if (this.chunks.has(chunkKey)) {
            return this.chunks.get(chunkKey);
        }

        // 如果正在加载，等待完成
        if (this.loadingPromises.has(chunkKey)) {
            return this.loadingPromises.get(chunkKey);
        }

        // 计算数据范围
        const start = chunkIndex * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;

        // 创建加载Promise
        const loadPromise = this.fetchChunkData(type, start, end)
            .then(data => {
                this.chunks.set(chunkKey, data);
                this.loadingPromises.delete(chunkKey);
                this.totalLoaded += data.length;
                this.notifyListeners({ type, chunkIndex, data, total: this.totalLoaded });
                return data;
            })
            .catch(error => {
                this.loadingPromises.delete(chunkKey);
                throw error;
            });

        this.loadingPromises.set(chunkKey, loadPromise);
        return loadPromise;
    }

    /**
     * 获取指定类型的前N个分片数据
     * @param {string} type - 烈酒类型
     * @param {number} chunkCount - 分片数量
     * @returns {Promise<Array>}
     */
    async loadChunks(type, chunkCount) {
        const promises = [];
        for (let i = 0; i < chunkCount; i++) {
            promises.push(this.loadChunk(type, i));
        }
        const results = await Promise.all(promises);
        return results.flat();
    }

    /**
     * 从后端获取分片数据
     * @param {string} type - 烈酒类型
     * @param {number} start - 起始索引
     * @param {number} end - 结束索引
     * @returns {Promise<Array>}
     */
    async fetchChunkData(type, start, end) {
        // 尝试从IndexedDB获取
        const cached = await window.LiquorDB?.getCachedLiquors(type);
        if (cached && cached.length >= end) {
            return cached.slice(start, end);
        }

        // 从原始数据获取
        const allData = window.DATA || [];
        const filtered = type === 'all' || !type 
            ? allData 
            : allData.filter(item => item.type === type);
        
        return filtered.slice(start, end);
    }

    /**
     * 预加载指定类型的下一个分片
     * @param {string} type - 烈酒类型
     * @param {number} currentChunk - 当前分片索引
     */
    prefetchNext(type, currentChunk) {
        setTimeout(() => {
            this.loadChunk(type, currentChunk + 1).catch(() => {});
        }, LOAD_DEBOUNCE);
    }

    /**
     * 添加事件监听器
     * @param {Function} callback - 回调函数
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * 通知所有监听器
     * @param {Object} event - 事件对象
     */
    notifyListeners(event) {
        this.listeners.forEach(cb => cb(event));
    }

    /**
     * 获取已加载的分片数量
     * @param {string} type - 烈酒类型
     * @returns {number}
     */
    getLoadedChunkCount(type) {
        let count = 0;
        for (const key of this.chunks.keys()) {
            if (key.startsWith(`${type}_`)) {
                count++;
            }
        }
        return count;
    }

    /**
     * 清除指定类型的缓存
     * @param {string} type - 烈酒类型
     */
    clearType(type) {
        for (const key of this.chunks.keys()) {
            if (key.startsWith(`${type}_`)) {
                this.chunks.delete(key);
            }
        }
    }

    /**
     * 清除所有缓存
     */
    clearAll() {
        this.chunks.clear();
        this.totalLoaded = 0;
    }
}

/**
 * 创建懒加载观察器 - 用于无限滚动
 */
class LazyScrollLoader {
    constructor(options = {}) {
        this.loader = new ChunkLoader();
        this.container = options.container || document.getElementById('cardGrid');
        this.batchSize = options.batchSize || CHUNK_SIZE;
        this.currentChunk = 0;
        this.currentType = 'all';
        this.isLoading = false;
        this.hasMore = true;
        this.observer = null;
        this.sentinel = null;

        this.init();
    }

    init() {
        // 创建 sentinel 元素用于观察
        this.sentinel = document.createElement('div');
        this.sentinel.className = 'lazy-scroll-sentinel';
        this.sentinel.style.height = '1px';
        this.sentinel.style.width = '100%';
        
        if (this.container) {
            this.container.parentNode.insertBefore(this.sentinel, this.container.nextSibling);
        }

        // 创建 Intersection Observer
        this.observer = new IntersectionObserver(
            entries => this.handleIntersection(entries),
            { rootMargin: '200px', threshold: 0 }
        );

        if (this.sentinel) {
            this.observer.observe(this.sentinel);
        }
    }

    async handleIntersection(entries) {
        const entry = entries[0];
        if (entry.isIntersecting && !this.isLoading && this.hasMore) {
            await this.loadMore();
        }
    }

    async loadMore() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const data = await this.loader.loadChunk(this.currentType, this.currentChunk);
            
            if (data.length === 0) {
                this.hasMore = false;
                return;
            }

            // 渲染卡片
            this.renderCards(data);
            
            // 预加载下一个分片
            this.currentChunk++;
            this.loader.prefetchNext(this.currentType, this.currentChunk);

        } catch (error) {
            console.error('分片加载失败:', error);
        } finally {
            this.isLoading = false;
        }
    }

    renderCards(data) {
        if (!this.container) return;
        
        const fragment = document.createDocumentFragment();
        
        data.forEach((liquor, index) => {
            const card = createLiquorCard(liquor);
            card.style.animationDelay = `${index * 50}ms`;
            fragment.appendChild(card);
        });

        this.container.appendChild(fragment);
    }

    /**
     * 设置当前加载的类型
     * @param {string} type - 烈酒类型
     */
    setType(type) {
        this.currentType = type;
        this.currentChunk = 0;
        this.hasMore = true;
        this.loader.clearType(type);
    }

    /**
     * 重置加载器
     */
    reset() {
        this.currentChunk = 0;
        this.hasMore = true;
        this.isLoading = false;
    }

    /**
     * 销毁观察器
     */
    destroy() {
        if (this.observer && this.sentinel) {
            this.observer.unobserve(this.sentinel);
        }
    }
}

// 创建全局实例
window.ChunkLoader = ChunkLoader;
window.LazyScrollLoader = LazyScrollLoader;
window.chunkLoader = new ChunkLoader();