/**
 * ================================================
 * 世界烈酒图鉴 - 图片懒加载
 * T03: 图片懒加载实现
 * ================================================
 */

class LazyImageLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px 0px',  // 提前50px开始加载
            threshold: 0.01,        // 只要有1%可见就开始加载
            placeholderClass: 'lazy-image-placeholder',
            loadedClass: 'lazy-image-loaded',
            errorClass: 'lazy-image-error',
            ...options
        };
        
        this.observer = null;
        this.images = new Map();  // 存储图片元素和其数据
        this.placeholderSVG = this.createPlaceholderSVG();
        
        this.init();
    }

    init() {
        // 创建 Intersection Observer
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                entries => this.handleIntersection(entries),
                {
                    rootMargin: this.options.rootMargin,
                    threshold: this.options.threshold
                }
            );
        }
    }

    /**
     * 创建占位符SVG
     * @returns {string}
     */
    createPlaceholderSVG() {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23151310' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='40'%3E🥃%3C/text%3E%3C/svg%3E`;
    }

    /**
     * 处理交叉观察事件
     * @param {Array} entries - 观察条目
     */
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                this.loadImage(img);
                this.observer.unobserve(img);
            }
        });
    }

    /**
     * 观察一个图片元素
     * @param {HTMLImageElement} img - 图片元素
     * @param {string} src - 真实图片地址
     * @param {string} alt - 图片描述
     */
    observe(img, src, alt = '') {
        if (!img || !src) return;

        // 保存数据
        this.images.set(img, { src, alt });

        // 设置初始状态
        img.src = this.placeholderSVG;
        img.classList.add(this.options.placeholderClass);
        img.dataset.src = src;
        img.alt = alt;

        // 如果浏览器支持 Intersection Observer
        if (this.observer) {
            this.observer.observe(img);
        } else {
            // 降级：直接加载
            this.loadImage(img);
        }
    }

    /**
     * 批量观察多个图片
     * @param {string} selector - 选择器
     */
    observeAll(selector = '.lazy-image') {
        document.querySelectorAll(selector).forEach(img => {
            const src = img.dataset.src;
            const alt = img.alt || img.dataset.alt || '';
            if (src) {
                this.observe(img, src, alt);
            }
        });
    }

    /**
     * 加载图片
     * @param {HTMLImageElement} img - 图片元素
     */
    loadImage(img) {
        const data = this.images.get(img);
        if (!data) return;

        const { src, alt } = data;
        
        // 创建新图片预加载
        const tempImg = new Image();
        
        tempImg.onload = () => {
            img.src = src;
            img.alt = alt;
            img.classList.remove(this.options.placeholderClass);
            img.classList.add(this.options.loadedClass);
            
            // 触发自定义事件
            img.dispatchEvent(new CustomEvent('lazyloaded', { detail: { src } }));
        };

        tempImg.onerror = () => {
            img.classList.remove(this.options.placeholderClass);
            img.classList.add(this.options.errorClass);
            console.warn('图片加载失败:', src);
        };

        tempImg.src = src;
    }

    /**
     * 停止观察图片
     * @param {HTMLImageElement} img - 图片元素
     */
    unobserve(img) {
        if (this.observer) {
            this.observer.unobserve(img);
        }
        this.images.delete(img);
    }

    /**
     * 停止观察所有图片
     */
    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.images.clear();
    }
}

/**
 * 创建懒加载图片元素
 * @param {Object} options - 配置选项
 * @returns {HTMLElement}
 */
function createLazyImage(options = {}) {
    const {
        src = '',
        alt = '',
        className = '',
        placeholder = true
    } = options;

    const img = document.createElement('img');
    img.className = `lazy-image ${className}`.trim();
    img.alt = alt;
    img.dataset.src = src;
    img.loading = 'lazy';  // 原生懒加载支持

    if (placeholder) {
        img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23151310' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='40'%3E🥃%3C/text%3E%3C/svg%3E`;
    }

    return img;
}

/**
 * 初始化全局图片懒加载
 */
function initGlobalLazyLoading() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.lazyImageLoader = new LazyImageLoader();
            window.lazyImageLoader.observeAll();
        });
    } else {
        window.lazyImageLoader = new LazyImageLoader();
        window.lazyImageLoader.observeAll();
    }

    // 监听动态插入的图片
    if ('MutationObserver' in window) {
        const mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        // 检查是否有懒加载图片
                        if (node.classList?.contains('lazy-image')) {
                            const src = node.dataset.src;
                            const alt = node.alt || node.dataset.alt || '';
                            if (src) {
                                window.lazyImageLoader?.observe(node, src, alt);
                            }
                        }
                        
                        // 检查子元素
                        node.querySelectorAll?.('.lazy-image').forEach(img => {
                            const src = img.dataset.src;
                            const alt = img.alt || img.dataset.alt || '';
                            if (src) {
                                window.lazyImageLoader?.observe(img, src, alt);
                            }
                        });
                    }
                });
            });
        });

        mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
}

/**
 * 更新卡片图片的懒加载
 * @param {HTMLElement} card - 卡片元素
 * @param {string} imageUrl - 图片URL
 */
function updateCardImage(card, imageUrl) {
    if (!card) return;
    
    const imgContainer = card.querySelector('.liquor-card-image');
    if (!imgContainer) return;

    // 清除现有内容
    imgContainer.innerHTML = '';

    // 创建新的懒加载图片
    const img = createLazyImage({
        src: imageUrl,
        alt: card.querySelector('.liquor-card-name')?.textContent || '烈酒图片',
        className: 'liquor-card-img',
        placeholder: true
    });

    imgContainer.appendChild(img);
    
    // 触发加载
    window.lazyImageLoader?.observe(img, imageUrl, img.alt);
}

// 导出全局函数
window.LazyImageLoader = LazyImageLoader;
window.createLazyImage = createLazyImage;
window.initGlobalLazyLoading = initGlobalLazyLoading;
window.updateCardImage = updateCardImage;