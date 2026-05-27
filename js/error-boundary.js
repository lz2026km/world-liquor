/**
 * ================================================
 * 世界烈酒图鉴 - 错误边界与处理
 * T06: 错误边界实现
 * ================================================
 */

/**
 * 错误类型枚举
 */
const ErrorType = {
    NETWORK: 'network',           // 网络错误
    DATA: 'data',                 // 数据错误
    RENDER: 'render',             // 渲染错误
    STORAGE: 'storage',           // 存储错误
    UNKNOWN: 'unknown'            // 未知错误
};

/**
 * 错误边界管理器
 */
class ErrorBoundary {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;  // 最多保存100条错误
        this.errorHandlers = new Map();
        this.isEnabled = true;
    }

    /**
     * 捕获错误
     * @param {Error} error - 错误对象
     * @param {string} context - 错误上下文
     * @param {Object} extra - 额外信息
     */
    capture(error, context = '', extra = {}) {
        if (!this.isEnabled) return;

        const errorInfo = {
            id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            message: error?.message || error || '未知错误',
            name: error?.name || 'Error',
            stack: error?.stack || '',
            type: this.classifyError(error),
            context,
            extra,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // 添加到错误列表
        this.errors.unshift(errorInfo);
        
        // 限制错误数量
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }

        // 调用错误处理器
        const handlers = this.errorHandlers.get(errorInfo.type) || [];
        handlers.forEach(handler => handler(errorInfo));

        // 调用通用处理器
        const generalHandlers = this.errorHandlers.get('*') || [];
        generalHandlers.forEach(handler => handler(errorInfo));

        // 打印到控制台
        console.error(`[${errorInfo.type}] ${context}:`, errorInfo);

        return errorInfo;
    }

    /**
     * 对错误进行分类
     * @param {Error} error - 错误对象
     * @returns {string}
     */
    classifyError(error) {
        if (!error) return ErrorType.UNKNOWN;
        
        const message = error.message?.toLowerCase() || '';
        const name = error.name?.toLowerCase() || '';
        
        if (message.includes('network') || message.includes('fetch') || message.includes('request')) {
            return ErrorType.NETWORK;
        }
        if (message.includes('json') || message.includes('parse') || message.includes('data')) {
            return ErrorType.DATA;
        }
        if (message.includes('render') || message.includes('dom') || message.includes('element')) {
            return ErrorType.RENDER;
        }
        if (message.includes('storage') || message.includes('localstorage') || message.includes('indexeddb')) {
            return ErrorType.STORAGE;
        }
        
        return ErrorType.UNKNOWN;
    }

    /**
     * 注册错误处理器
     * @param {string} type - 错误类型，* 表示所有类型
     * @param {Function} handler - 处理函数
     */
    on(type, handler) {
        if (!this.errorHandlers.has(type)) {
            this.errorHandlers.set(type, []);
        }
        this.errorHandlers.get(type).push(handler);
    }

    /**
     * 获取错误列表
     * @param {Object} filters - 筛选条件
     * @returns {Array}
     */
    getErrors(filters = {}) {
        let result = [...this.errors];
        
        if (filters.type) {
            result = result.filter(e => e.type === filters.type);
        }
        if (filters.context) {
            result = result.filter(e => e.context.includes(filters.context));
        }
        if (filters.since) {
            result = result.filter(e => new Date(e.timestamp) >= new Date(filters.since));
        }
        
        return result;
    }

    /**
     * 获取错误统计
     * @returns {Object}
     */
    getStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            recent: []
        };

        this.errors.forEach(e => {
            stats.byType[e.type] = (stats.byType[e.type] || 0) + 1;
        });

        // 最近5分钟的错误
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        stats.recent = this.errors.filter(e => new Date(e.timestamp) >= fiveMinutesAgo).length;

        return stats;
    }

    /**
     * 清除错误记录
     */
    clear() {
        this.errors = [];
    }

    /**
     * 启用/禁用错误捕获
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }
}

/**
 * 安全的异步函数包装器
 * @param {Function} fn - 异步函数
 * @param {string} context - 上下文
 * @returns {Function}
 */
function safeAsync(fn, context = '') {
    return async function(...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            window.errorBoundary?.capture(error, context, { args });
            return null;
        }
    };
}

/**
 * 安全的同步函数包装器
 * @param {Function} fn - 函数
 * @param {string} context - 上下文
 * @returns {Function}
 */
function safeSync(fn, context = '') {
    return function(...args) {
        try {
            return fn.apply(this, args);
        } catch (error) {
            window.errorBoundary?.capture(error, context, { args });
            return null;
        }
    };
}

/**
 * 安全的 Promise 包装器
 * @param {Promise} promise - Promise对象
 * @param {string} context - 上下文
 * @returns {Promise}
 */
function safePromise(promise, context = '') {
    return promise.catch(error => {
        window.errorBoundary?.capture(error, context);
        return null;
    });
}

/**
 * 全局未捕获错误处理器
 */
function setupGlobalErrorHandlers() {
    // 初始化错误边界
    window.errorBoundary = new ErrorBoundary();

    // 监听未捕获的Promise错误
    window.addEventListener('unhandledrejection', event => {
        window.errorBoundary.capture(
            event.reason,
            'unhandledrejection',
            { timestamp: event.timestamp }
        );
    });

    // 监听全局错误
    window.addEventListener('error', event => {
        window.errorBoundary.capture(
            event.error || new Error(event.message),
            'window.onerror',
            {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            }
        );
    });

    // 注册默认错误处理器
    window.errorBoundary.on('*', errorInfo => {
        // 可以在这里添加统一的错误上报逻辑
        if (errorInfo.type !== ErrorType.UNKNOWN) {
            console.warn('错误上报:', errorInfo);
        }
    });

    // 为特定操作添加错误处理
    window.errorBoundary.on(ErrorType.DATA, errorInfo => {
        console.warn('数据错误，可能需要刷新数据缓存');
    });

    window.errorBoundary.on(ErrorType.NETWORK, errorInfo => {
        console.warn('网络错误，请检查网络连接');
    });

    console.log('全局错误处理器已初始化');
}

// 导出全局函数
window.ErrorBoundary = ErrorBoundary;
window.ErrorType = ErrorType;
window.safeAsync = safeAsync;
window.safeSync = safeSync;
window.safePromise = safePromise;
window.setupGlobalErrorHandlers = setupGlobalErrorHandlers;