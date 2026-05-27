/**
 * ================================================
 * 世界烈酒图鉴 - 性能监控
 * T04: 性能监控实现（FCP/LCP/CLS）
 * ================================================
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fcp: null,
            lcp: null,
            cls: 0,
            fid: null,
            ttfb: null
        };
        this.observers = [];
        this.listeners = [];
        this.init();
    }

    init() {
        if ('PerformanceObserver' in window) {
            this.observeLCP();
            this.observeCLS();
            this.observeFID();
        }
        this.measureTTFB();
        this.calculateFCP();
    }

    /**
     * 观察 LCP (最大内容绘制)
     */
    observeLCP() {
        try {
            const observer = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.lcp = lastEntry.startTime;
                this.notifyListeners('lcp', this.metrics.lcp);
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.push(observer);
        } catch (e) {
            console.warn('LCP观察器不支持:', e);
        }
    }

    /**
     * 观察 CLS (累积布局偏移)
     */
    observeCLS() {
        try {
            let clsValue = 0;
            const observer = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.metrics.cls = clsValue;
                this.notifyListeners('cls', this.metrics.cls);
            });
            observer.observe({ entryTypes: ['layout-shift'] });
            this.observers.push(observer);
        } catch (e) {
            console.warn('CLS观察器不支持:', e);
        }
    }

    /**
     * 观察 FID (首次输入延迟)
     */
    observeFID() {
        try {
            const observer = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    this.metrics.fid = entry.processingStart - entry.startTime;
                    this.notifyListeners('fid', this.metrics.fid);
                }
            });
            observer.observe({ entryTypes: ['first-input'] });
            this.observers.push(observer);
        } catch (e) {
            console.warn('FID观察器不支持:', e);
        }
    }

    /**
     * 测量 TTFB (首字节时间)
     */
    measureTTFB() {
        const entries = performance.getEntriesByType('navigation');
        if (entries.length > 0) {
            const nav = entries[0];
            this.metrics.ttfb = nav.responseStart - nav.requestStart;
            this.notifyListeners('ttfb', this.metrics.ttfb);
        }
    }

    /**
     * 计算 FCP (首次内容绘制)
     */
    calculateFCP() {
        const entries = performance.getEntriesByType('paint');
        for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
                this.metrics.fcp = entry.startTime;
                this.notifyListeners('fcp', this.metrics.fcp);
                break;
            }
        }
    }

    /**
     * 添加性能监听器
     * @param {Function} callback - 回调函数
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * 通知监听器
     * @param {string} metricName
     * @param {number} value
     */
    notifyListeners(metricName, value) {
        this.listeners.forEach(cb => cb(metricName, value));
    }

    /**
     * 获取所有指标
     * @returns {Object}
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * 获取指标报告
     * @returns {string}
     */
    getReport() {
        return `
========== 性能指标报告 ==========
FCP (首次内容绘制): ${this.metrics.fcp?.toFixed(2) || '测量中'} ms
LCP (最大内容绘制): ${this.metrics.lcp?.toFixed(2) || '测量中'} ms
CLS (累积布局偏移): ${this.metrics.cls?.toFixed(4) || '0'}
FID (首次输入延迟): ${this.metrics.fid?.toFixed(2) || '测量中'} ms
TTFB (首字节时间): ${this.metrics.ttfb?.toFixed(2) || '测量中'} ms
==================================
        `.trim();
    }

    /**
     * 销毁观察器
     */
    destroy() {
        this.observers.forEach(obs => obs.disconnect());
        this.observers = [];
        this.listeners = [];
    }
}

// 创建全局实例
window.PerformanceMonitor = PerformanceMonitor;
window.perfMonitor = new PerformanceMonitor();

// 性能告警阈值
const PERFORMANCE_THRESHOLDS = {
    fcp: 2000,  // 2秒
    lcp: 2500,  // 2.5秒
    cls: 0.1,    // 0.1
    fid: 100,    // 100ms
    ttfb: 800    // 800ms
};

// 性能告警
window.perfMonitor.addListener((metric, value) => {
    const threshold = PERFORMANCE_THRESHOLDS[metric.toUpperCase()];
    if (threshold && value > threshold) {
        console.warn(`⚠️ 性能警告: ${metric.toUpperCase()} = ${value.toFixed(2)}ms (阈值: ${threshold}ms)`);
    }
});

// 导出
window.getPerformanceMetrics = () => window.perfMonitor?.getMetrics();
window.getPerformanceReport = () => window.perfMonitor?.getReport();