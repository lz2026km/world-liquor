/**
 * ================================================
 * 世界烈酒图鉴 - 虚拟列表
 * T14: 虚拟滚动实现
 * ================================================
 */

class VirtualList {
    constructor(options = {}) {
        this.options = {
            container: null,
            itemHeight: null,       // 每项高度，若不确定可设为null
            itemCount: 0,          // 总条目数
            overscan: 5,           // 预渲染条目数
            bufferSize: 10,        // 缓冲区大小
            ...options
        };
        
        this.scrollTop = 0;
        this.containerHeight = 0;
        this.renderedItems = new Map();
        this.renderedRange = { start: 0, end: 0 };
        
        this.init();
    }

    init() {
        if (!this.options.container) {
            console.warn('VirtualList: 容器未指定');
            return;
        }
        
        this.setupContainer();
        this.bindEvents();
        this.render();
    }

    setupContainer() {
        const container = this.options.container;
        container.style.overflow = 'auto';
        container.style.position = 'relative';
        
        // 创建内部结构
        this.contentEl = document.createElement('div');
        this.contentEl.className = 'virtual-list-content';
        this.contentEl.style.cssText = `
            position: relative;
            width: 100%;
        `;
        
        this.scrollEl = document.createElement('div');
        this.scrollEl.className = 'virtual-list-scroll';
        this.scrollEl.style.cssText = `
            position: relative;
            width: 100%;
        `;
        
        this.scrollEl.appendChild(this.contentEl);
        container.appendChild(this.scrollEl);
        
        // 获取容器尺寸
        this.updateContainerHeight();
    }

    bindEvents() {
        const container = this.options.container;
        
        // 滚动事件节流
        this.scrollHandler = this.handleScroll.bind(this);
        container.addEventListener('scroll', this.scrollHandler, { passive: true });
        
        // 窗口 resize 时更新
        this.resizeHandler = this.handleResize.bind(this);
        window.addEventListener('resize', this.resizeHandler, { passive: true });
    }

    handleScroll() {
        const container = this.options.container;
        this.scrollTop = container.scrollTop;
        this.render();
    }

    handleResize() {
        this.updateContainerHeight();
        this.render();
    }

    updateContainerHeight() {
        const container = this.options.container;
        this.containerHeight = container.clientHeight;
    }

    /**
     * 计算可见范围
     * @returns {Object} {start, end}
     */
    getVisibleRange() {
        const { itemHeight, itemCount, overscan } = this.options;
        
        if (itemHeight === null) {
            // 如果没有固定高度，使用简单的估算
            const estimatedHeight = 200;
            const start = Math.max(0, Math.floor(this.scrollTop / estimatedHeight) - overscan);
            const visibleCount = Math.ceil(this.containerHeight / estimatedHeight);
            const end = Math.min(itemCount, start + visibleCount + overscan * 2);
            return { start, end };
        }
        
        const start = Math.max(0, Math.floor(this.scrollTop / itemHeight) - overscan);
        const visibleCount = Math.ceil(this.containerHeight / itemHeight);
        const end = Math.min(itemCount, start + visibleCount + overscan * 2);
        
        return { start, end };
    }

    /**
     * 计算内容总高度
     * @returns {number}
     */
    getTotalHeight() {
        const { itemHeight, itemCount } = this.options;
        
        if (itemHeight !== null) {
            return itemHeight * itemCount;
        }
        
        // 估算高度
        const estimatedHeight = 200;
        return estimatedHeight * itemCount;
    }

    /**
     * 渲染可见项
     */
    render() {
        const { itemCount } = this.options;
        if (itemCount === 0) return;
        
        const range = this.getVisibleRange();
        const totalHeight = this.getTotalHeight();
        
        // 更新内容高度
        this.contentEl.style.height = `${totalHeight}px`;
        
        // 只在范围变化时重新渲染
        if (range.start === this.renderedRange.start && range.end === this.renderedRange.end) {
            return;
        }
        
        this.renderedRange = range;
        
        // 移除不在范围内的已渲染项
        for (const [index, item] of this.renderedItems) {
            if (index < range.start || index >= range.end) {
                if (item.element && item.element.parentNode) {
                    item.element.parentNode.removeChild(item.element);
                }
                this.renderedItems.delete(index);
            }
        }
        
        // 渲染范围内的项
        for (let i = range.start; i < range.end; i++) {
            if (!this.renderedItems.has(i)) {
                this.renderItem(i);
            }
        }
    }

    /**
     * 渲染单个项
     * @param {number} index
     */
    renderItem(index) {
        const { itemHeight, overscan } = this.options;
        
        const itemEl = document.createElement('div');
        itemEl.className = 'virtual-list-item';
        
        // 计算位置
        const top = itemHeight !== null 
            ? index * itemHeight 
            : index * 200; // 估算高度
        
        itemEl.style.cssText = `
            position: absolute;
            top: ${top}px;
            left: 0;
            width: 100%;
            height: ${itemHeight !== null ? itemHeight + 'px' : 'auto'};
        `;
        
        // 保存引用
        this.renderedItems.set(index, {
            element: itemEl,
            index: index
        });
        
        this.contentEl.appendChild(itemEl);
        
        // 触发渲染回调（由外部提供）
        if (this.options.renderItem) {
            this.options.renderItem(itemEl, index);
        }
    }

    /**
     * 更新配置
     * @param {Object} newOptions
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        
        if (newOptions.itemCount !== undefined || 
            newOptions.itemHeight !== undefined) {
            this.render();
        }
    }

    /**
     * 滚动到指定索引
     * @param {number} index
     */
    scrollToIndex(index) {
        const container = this.options.container;
        const { itemHeight } = this.options;
        
        const targetScroll = itemHeight !== null 
            ? index * itemHeight 
            : index * 200;
        
        container.scrollTop = targetScroll;
    }

    /**
     * 获取当前可见范围
     * @returns {Object}
     */
    getCurrentRange() {
        return { ...this.renderedRange };
    }

    /**
     * 刷新列表
     */
    refresh() {
        this.render();
    }

    /**
     * 销毁虚拟列表
     */
    destroy() {
        const container = this.options.container;
        container.removeEventListener('scroll', this.scrollHandler);
        window.removeEventListener('resize', this.resizeHandler);
        
        this.renderedItems.clear();
        this.scrollEl.remove();
    }
}

/**
 * 创建虚拟列表的工厂函数
 * @param {HTMLElement} container
 * @param {Object} options
 * @returns {VirtualList}
 */
function createVirtualList(container, options = {}) {
    return new VirtualList({
        container,
        ...options
    });
}

// 导出全局
window.VirtualList = VirtualList;
window.createVirtualList = createVirtualList;