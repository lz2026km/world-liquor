/**
 * ================================================
 * 世界烈酒图鉴 - 防抖与节流
 * T13: 防抖节流实现
 * ================================================
 */

/**
 * 防抖函数 - 在事件停止触发后延迟执行
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function}
 */
function debounce(fn, delay = 300, immediate = false) {
    let timeoutId = null;
    
    return function(...args) {
        const context = this;
        
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        if (immediate && !timeoutId) {
            fn.apply(context, args);
        }
        
        timeoutId = setTimeout(() => {
            if (!immediate) {
                fn.apply(context, args);
            }
            timeoutId = null;
        }, delay);
    };
}

/**
 * 节流函数 - 在指定时间间隔内只执行一次
 * @param {Function} fn - 要执行的函数
 * @param {number} limit - 时间间隔（毫秒）
 * @param {Object} options - 配置选项
 * @returns {Function}
 */
function throttle(fn, limit = 300, options = {}) {
    let timeoutId = null;
    let lastRan = null;
    const { trailing = true, leading = true } = options;
    
    return function(...args) {
        const context = this;
        
        if (!lastRan && leading) {
            fn.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(timeoutId);
        }
        
        const remaining = limit - (Date.now() - lastRan);
        
        timeoutId = setTimeout(() => {
            if (trailing && (Date.now() - lastRan) >= limit) {
                fn.apply(context, args);
                lastRan = Date.now();
            }
        }, Math.max(0, remaining));
    };
}

/**
 * 搜索防抖 - 专门用于搜索输入
 * @param {Function} fn - 搜索函数
 * @param {number} delay - 延迟时间（默认300ms）
 * @returns {Function}
 */
function createSearchDebounce(fn, delay = 300) {
    return debounce(fn, delay, false);
}

/**
 * 滚动节流 - 专门用于滚动事件
 * @param {Function} fn - 滚动处理函数
 * @param {number} limit - 时间间隔（默认100ms）
 * @returns {Function}
 */
function createScrollThrottle(fn, limit = 100) {
    return throttle(fn, limit, { trailing: true, leading: false });
}

/**
 * 窗口 resize 节流
 * @param {Function} fn - 处理函数
 * @param {number} limit - 时间间隔
 * @returns {Function}
 */
function createResizeThrottle(fn, limit = 200) {
    return throttle(fn, limit, { trailing: true, leading: false });
}

/**
 * 快速连续事件防抖（用于键盘输入等高频事件）
 * @param {Function} fn - 处理函数
 * @param {number} minInterval - 最小间隔
 * @returns {Function}
 */
function createRapidDebounce(fn, minInterval = 50) {
    let lastExecute = 0;
    
    return function(...args) {
        const now = Date.now();
        if (now - lastExecute >= minInterval) {
            lastExecute = now;
            fn.apply(this, args);
        }
    };
}

/**
 * 请求动画帧节流 - 使用 requestAnimationFrame 进行节流
 * @param {Function} fn - 处理函数
 * @returns {Function}
 */
function createRAFThrottle(fn) {
    let ticking = false;
    
    return function(...args) {
        const context = this;
        if (!ticking) {
            requestAnimationFrame(() => {
                fn.apply(context, args);
                ticking = false;
            });
            ticking = true;
        }
    };
}

// 防抖管理类 - 管理多个防抖实例
class DebounceManager {
    constructor() {
        this.instances = new Map();
    }

    /**
     * 创建或获取防抖实例
     * @param {string} key - 实例标识
     * @param {Function} fn - 函数
     * @param {number} delay - 延迟
     * @returns {Function}
     */
    getOrCreate(key, fn, delay = 300) {
        if (!this.instances.has(key)) {
            this.instances.set(key, debounce(fn, delay));
        }
        return this.instances.get(key);
    }

    /**
     * 清除指定实例
     * @param {string} key
     */
    clear(key) {
        if (this.instances.has(key)) {
            this.instances.delete(key);
        }
    }

    /**
     * 清除所有实例
     */
    clearAll() {
        this.instances.clear();
    }
}

// 节流管理类
class ThrottleManager {
    constructor() {
        this.instances = new Map();
    }

    getOrCreate(key, fn, limit = 300) {
        if (!this.instances.has(key)) {
            this.instances.set(key, throttle(fn, limit));
        }
        return this.instances.get(key);
    }

    clear(key) {
        if (this.instances.has(key)) {
            this.instances.delete(key);
        }
    }

    clearAll() {
        this.instances.clear();
    }
}

// 创建全局管理器
window.debounceManager = new DebounceManager();
window.throttleManager = new ThrottleManager();

// 导出全局函数
window.debounce = debounce;
window.throttle = throttle;
window.createSearchDebounce = createSearchDebounce;
window.createScrollThrottle = createScrollThrottle;
window.createResizeThrottle = createResizeThrottle;
window.createRapidDebounce = createRapidDebounce;
window.createRAFThrottle = createRAFThrottle;