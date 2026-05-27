/**
 * ================================================
 * 世界烈酒图鉴 - 优化模块整合
 * T01-T07: 7项技术优化入口
 * ================================================
 */

/**
 * 优化模块初始化状态
 */
const OptimizationStatus = {
    db: { loaded: false, error: null },
    chunkLoader: { loaded: false, error: null },
    lazyImage: { loaded: false, error: null },
    errorBoundary: { loaded: false, error: null },
    a11y: { loaded: false, error: null },
    seo: { loaded: false, error: null },
    codeSplit: { loaded: false, error: null }
};

/**
 * 加载脚本的辅助函数
 * @param {string} src - 脚本路径
 * @returns {Promise}
 */
function loadOptimizationScript(src) {
    return new Promise((resolve, reject) => {
        // 检查是否已加载
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = false; // 按顺序加载
        script.onload = () => resolve();
        script.onerror = (e) => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}

/**
 * 按顺序加载所有优化模块
 * @returns {Promise<void>}
 */
async function loadAllOptimizations() {
    console.log('开始加载优化模块...');
    
    const scripts = [
        './js/db.js',           // T02 IndexedDB缓存
        './js/chunk-loader.js', // T01 大数据分片加载
        './js/lazy-image.js',   // T03 图片懒加载
        './js/error-boundary.js', // T06 错误边界
        './js/a11y.js',         // T05 无障碍访问
        './js/seo.js',          // T04 SEO优化
        './js/code-split.js'    // T07 代码分割
    ];

    const errors = [];

    for (const src of scripts) {
        try {
            await loadOptimizationScript(src);
            const moduleName = src.replace('./js/', '').replace('.js', '');
            OptimizationStatus[moduleName]?.loaded && (OptimizationStatus[moduleName].loaded = true);
            console.log(`✓ ${src} 加载成功`);
        } catch (error) {
            errors.push({ src, error });
            console.error(`✗ ${src} 加载失败:`, error);
        }
    }

    if (errors.length > 0) {
        console.warn(`${errors.length} 个优化模块加载失败，将使用降级方案`);
    }

    return errors.length === 0;
}

/**
 * 初始化所有优化功能
 * @returns {Promise<void>}
 */
async function initAllOptimizations() {
    // 加载所有优化模块
    await loadAllOptimizations();

    // 初始化错误边界（最先初始化，以便捕获后续错误）
    if (window.setupGlobalErrorHandlers) {
        try {
            setupGlobalErrorHandlers();
            console.log('✓ T06 错误边界初始化成功');
        } catch (e) {
            console.error('T06 错误边界初始化失败:', e);
        }
    }

    // 初始化无障碍功能
    if (window.initAccessibility) {
        try {
            initAccessibility();
            console.log('✓ T05 无障碍访问初始化成功');
        } catch (e) {
            console.error('T05 无障碍访问初始化失败:', e);
        }
    }

    // 初始化SEO
    if (window.initSEO) {
        try {
            initSEO();
            console.log('✓ T04 SEO优化初始化成功');
        } catch (e) {
            console.error('T04 SEO优化初始化失败:', e);
        }
    }

    // 初始化图片懒加载
    if (window.initGlobalLazyLoading) {
        try {
            initGlobalLazyLoading();
            console.log('✓ T03 图片懒加载初始化成功');
        } catch (e) {
            console.error('T03 图片懒加载初始化失败:', e);
        }
    }

    // 初始化代码分割
    if (window.initCodeSplit) {
        try {
            await initCodeSplit();
            console.log('✓ T07 代码分割初始化成功');
        } catch (e) {
            console.error('T07 代码分割初始化失败:', e);
        }
    }

    // 打印优化状态报告
    printOptimizationReport();
}

/**
 * 打印优化状态报告
 */
function printOptimizationReport() {
    console.log('\n========== 优化状态报告 ==========');
    console.log('T01 大数据分片加载:', window.chunkLoader ? '✓ 已就绪' : '✗ 未加载');
    console.log('T02 IndexedDB缓存:', window.LiquorDB ? '✓ 已就绪' : '✗ 未加载');
    console.log('T03 图片懒加载:', window.lazyImageLoader ? '✓ 已就绪' : '✗ 未加载');
    console.log('T04 SEO优化:', window.seoManager ? '✓ 已就绪' : '✗ 未加载');
    console.log('T05 无障碍访问:', window.accessibilityManager ? '✓ 已就绪' : '✗ 未加载');
    console.log('T06 错误边界:', window.errorBoundary ? '✓ 已就绪' : '✗ 未加载');
    console.log('T07 代码分割:', window.moduleLoader ? '✓ 已就绪' : '✗ 未加载');
    console.log('==================================\n');
}

/**
 * 获取优化状态
 * @returns {Object}
 */
function getOptimizationStatus() {
    return {
        db: !!window.LiquorDB,
        chunkLoader: !!window.chunkLoader,
        lazyImage: !!window.lazyImageLoader,
        seo: !!window.seoManager,
        a11y: !!window.accessibilityManager,
        errorBoundary: !!window.errorBoundary,
        codeSplit: !!window.moduleLoader
    };
}

/**
 * 检查是否所有优化都已加载
 * @returns {boolean}
 */
function isFullyOptimized() {
    const status = getOptimizationStatus();
    return Object.values(status).every(v => v === true);
}

// 导出全局函数
window.loadAllOptimizations = loadAllOptimizations;
window.initAllOptimizations = initAllOptimizations;
window.getOptimizationStatus = getOptimizationStatus;
window.isFullyOptimized = isFullyOptimized;

// 导出优化状态对象
window.OptimizationStatus = OptimizationStatus;