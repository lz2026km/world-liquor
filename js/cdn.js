/**
 * ================================================
 * 世界烈酒图鉴 - CDN 资源管理
 * T10: CDN加速实现
 * ================================================
 */

const CDNConfig = {
    // CDN基础URL（可配置）
    baseUrl: '',  // 使用空字符串表示相对路径，生产环境可配置为CDN地址
    
    // 静态资源映射
    resources: {
        // Google字体
        fonts: {
            google: 'https://fonts.googleapis.com',
            fontsGstatic: 'https://fonts.gstatic.com'
        },
        
        // CDN库（预留）
        libraries: {
            lzString: 'https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js'
        }
    },
    
    // 资源优先级
    priorities: {
        'preconnect': ['fonts'],
        'preload': ['styles', 'data'],
        'defer': ['analytics', 'optional']
    }
};

/**
 * 预连接关键CDN
 */
function setupPreconnect() {
    const preconnectLinks = [
        { href: CDNConfig.resources.fonts.google, crossorigin: 'anonymous' },
        { href: CDNConfig.resources.fonts.fontsGstatic, crossorigin: 'anonymous' }
    ];
    
    preconnectLinks.forEach(link => {
        const existingLink = document.querySelector(`link[href="${link.href}"]`);
        if (existingLink) return;
        
        const linkEl = document.createElement('link');
        linkEl.rel = 'preconnect';
        linkEl.href = link.href;
        linkEl.crossOrigin = link.crossorigin;
        document.head.appendChild(linkEl);
    });
}

/**
 * 获取优化后的资源URL
 * @param {string} resourceType - 资源类型
 * @param {string} path - 资源路径
 * @returns {string}
 */
function getOptimizedUrl(resourceType, path) {
    if (!path) return path;
    
    // 如果已配置CDN基础URL，替换路径
    if (CDNConfig.baseUrl) {
        return `${CDNConfig.baseUrl}${path}`;
    }
    
    // 否则使用原始路径
    return path;
}

/**
 * 批量预加载资源
 * @param {Array} resources - 资源列表
 */
function preloadResources(resources = []) {
    resources.forEach(resource => {
        const { href, as, type, crossorigin } = resource;
        
        const existingLink = document.querySelector(`link[href="${href}"]`);
        if (existingLink) return;
        
        const linkEl = document.createElement('link');
        linkEl.rel = 'preload';
        linkEl.href = href;
        if (as) linkEl.as = as;
        if (type) linkEl.type = type;
        if (crossorigin) linkEl.crossOrigin = crossorigin;
        
        document.head.appendChild(linkEl);
    });
}

/**
 * 异步加载脚本
 * @param {string} src - 脚本地址
 * @returns {Promise}
 */
function loadScriptAsync(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * 延迟加载脚本
 * @param {string} src
 * @returns {Promise}
 */
function loadScriptDefer(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * 预加载关键CSS
 */
function preloadCriticalCSS() {
    const criticalResources = [
        { href: '/styles.css', as: 'style' },
        { href: '/animations.css', as: 'style' }
    ];
    
    preloadResources(criticalResources);
}

/**
 * 预加载关键数据
 */
function preloadCriticalData() {
    const criticalResources = [
        { href: '/data.js', as: 'script' }
    ];
    
    preloadResources(criticalResources);
}

/**
 * 初始化CDN优化
 */
function initCDNOptimization() {
    // 设置预连接
    setupPreconnect();
    
    // 预加载关键资源
    preloadCriticalCSS();
    preloadCriticalData();
    
    console.log('CDN优化已初始化');
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCDNOptimization);
} else {
    initCDNOptimization();
}

// 导出全局函数
window.CDNConfig = CDNConfig;
window.getOptimizedUrl = getOptimizedUrl;
window.preloadResources = preloadResources;
window.loadScriptAsync = loadScriptAsync;
window.loadScriptDefer = loadScriptDefer;
window.initCDNOptimization = initCDNOptimization;