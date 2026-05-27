/**
 * ================================================
 * 世界烈酒图鉴 - 代码分割与模块化加载
 * T07: 代码分割实现
 * ================================================
 */

/**
 * 模块注册表 - 用于追踪动态加载的模块
 */
const ModuleRegistry = {
    modules: new Map(),
    loading: new Map(),

    /**
     * 注册模块
     * @param {string} name - 模块名
     * @param {string} path - 模块路径
     * @param {Function} factory - 模块工厂函数
     */
    register(name, path, factory) {
        this.modules.set(name, {
            name,
            path,
            factory,
            loaded: false,
            exports: null
        });
    },

    /**
     * 获取模块
     * @param {string} name
     * @returns {Object|null}
     */
    get(name) {
        return this.modules.get(name) || null;
    },

    /**
     * 获取所有已注册的模块
     * @returns {Array}
     */
    getAll() {
        return Array.from(this.modules.values());
    }
};

/**
 * 动态模块加载器
 */
class ModuleLoader {
    constructor() {
        this.basePath = './js/modules/';
        this.cacheEnabled = true;
        this.loadedModules = new Map();
    }

    /**
     * 加载JavaScript模块
     * @param {string} moduleName - 模块名称
     * @returns {Promise<any>}
     */
    async loadModule(moduleName) {
        // 如果已加载，直接返回缓存
        if (this.cacheEnabled && this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }

        // 如果正在加载，返回现有的Promise
        if (ModuleRegistry.loading.has(moduleName)) {
            return ModuleRegistry.loading.get(moduleName);
        }

        // 创建加载Promise
        const loadPromise = this.doLoadModule(moduleName);
        ModuleRegistry.loading.set(moduleName, loadPromise);

        try {
            const exports = await loadPromise;
            this.loadedModules.set(moduleName, exports);
            ModuleRegistry.loading.delete(moduleName);
            return exports;
        } catch (error) {
            ModuleRegistry.loading.delete(moduleName);
            throw error;
        }
    }

    /**
     * 执行实际的模块加载
     * @param {string} moduleName
     * @returns {Promise<any>}
     */
    async doLoadModule(moduleName) {
        // 检查是否有内置模块
        const builtInModule = this.getBuiltInModule(moduleName);
        if (builtInModule) {
            return builtInModule;
        }

        // 动态创建script标签加载
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = `${this.basePath}${moduleName}.js`;
            script.async = true;

            script.onload = () => {
                // 假设模块会注册到window对象
                const module = window[moduleName] || window[`${moduleName}Module`];
                resolve(module);
            };

            script.onerror = (error) => {
                console.warn(`模块 ${moduleName} 加载失败，尝试内联加载`);
                // 尝试从主HTML中查找模块定义
                const inlineModule = this.getInlineModule(moduleName);
                if (inlineModule) {
                    resolve(inlineModule);
                } else {
                    reject(new Error(`模块 ${moduleName} 加载失败`));
                }
            };

            document.head.appendChild(script);
        });
    }

    /**
     * 获取内置模块（不依赖外部文件的模块）
     * @param {string} name
     * @returns {Function|null}
     */
    getBuiltInModule(name) {
        const builtInModules = {
            // 图表模块
            'ChartModule': () => ({
                render: (data) => console.log('Chart rendered', data),
                update: (data) => console.log('Chart updated', data)
            }),
            // 地图模块
            'MapModule': () => ({
                render: (data) => console.log('Map rendered', data),
                update: (data) => console.log('Map updated', data)
            }),
            // 分享模块
            'ShareModule': () => ({
                shareToWechat: () => console.log('Share to WeChat'),
                shareToWeibo: () => console.log('Share to Weibo'),
                copyLink: () => console.log('Copy link')
            }),
            // 导出模块
            'ExportModule': () => ({
                exportPDF: () => console.log('Export PDF'),
                exportExcel: () => console.log('Export Excel')
            })
        };

        return builtInModules[name] ? builtInModules[name]() : null;
    }

    /**
     * 获取内联模块（从主HTML中提取的模块）
     * @param {string} name
     * @returns {Function|null}
     */
    getInlineModule(name) {
        // 尝试从window对象获取
        return window[name] || null;
    }

    /**
     * 批量预加载模块
     * @param {Array} moduleNames
     * @returns {Promise<Array>}
     */
    async preloadModules(moduleNames) {
        return Promise.all(moduleNames.map(name => this.loadModule(name)));
    }

    /**
     * 根据条件动态加载模块
     * @param {Function} condition - 条件函数
     * @param {string} moduleName - 要加载的模块名
     * @returns {Promise<any>}
     */
    async loadIf(condition, moduleName) {
        if (condition()) {
            return this.loadModule(moduleName);
        }
        return null;
    }

    /**
     * 懒加载模块（当需要时才加载）
     * @param {string} moduleName
     * @param {Function} factory - 延迟工厂函数
     * @returns {Function}
     */
    lazyLoad(moduleName, factory) {
        let loaded = false;
        let moduleInstance = null;

        return (...args) => {
            if (!loaded) {
                moduleInstance = factory();
                loaded = true;
            }
            return moduleInstance(...args);
        };
    }

    /**
     * 清除模块缓存
     * @param {string} moduleName - 可选，指定模块名
     */
    clearCache(moduleName) {
        if (moduleName) {
            this.loadedModules.delete(moduleName);
        } else {
            this.loadedModules.clear();
        }
    }
}

/**
 * 代码分割配置
 */
const CodeSplitConfig = {
    // 需要延迟加载的功能模块
    lazyModules: [
        // 成就系统 - 页面加载时不需要
        { name: 'AchievementModule', condition: () => window.location.hash.includes('achievement') },
        // 分享功能 - 仅需要时加载
        { name: 'ShareModule', condition: () => window.location.hash.includes('share') },
        // 图表功能 - 仅在详情页需要
        { name: 'ChartModule', condition: () => window.location.hash.includes('chart') },
        // 地图功能 - 仅在地图页需要
        { name: 'MapModule', condition: () => window.location.hash.includes('map') },
        // 导出功能 - 仅导出时需要
        { name: 'ExportModule', condition: () => window.location.hash.includes('export') }
    ],

    // 延迟加载的UI组件
    lazyComponents: [
        { name: 'VideoPlayer', selector: '.video-placeholder' },
        { name: 'AromaWheel', selector: '.aroma-wheel' },
        { name: 'PriceChart', selector: '.price-history-chart' }
    ],

    // 预加载的关键模块
    criticalModules: [
        // 数据库模块
        { name: 'LiquorDB', path: './js/db.js' },
        // 错误边界
        { name: 'ErrorBoundary', path: './js/error-boundary.js' }
    ]
};

/**
 * 初始化代码分割功能
 */
async function initCodeSplit() {
    window.moduleLoader = new ModuleLoader();

    // 预加载关键模块
    for (const mod of CodeSplitConfig.criticalModules) {
        try {
            if (mod.path) {
                await loadScript(mod.path);
            }
        } catch (e) {
            console.warn(`预加载模块 ${mod.name} 失败:`, e);
        }
    }

    // 设置延迟加载观察器
    setupLazyLoadObserver();

    // 为特定功能添加延迟加载
    setupConditionalLazyLoad();

    console.log('代码分割功能已初始化');
}

/**
 * 动态加载脚本
 * @param {string} src
 * @returns {Promise}
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // 检查是否已加载
        if (document.querySelector(`script[src="${src}"]`)) {
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
 * 设置延迟加载观察器
 */
function setupLazyLoadObserver() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const moduleName = target.dataset.lazyModule;
                    if (moduleName) {
                        window.moduleLoader?.loadModule(moduleName);
                        observer.unobserve(target);
                    }
                }
            });
        },
        { rootMargin: '100px' }
    );

    // 观察需要延迟加载的元素
    document.querySelectorAll('[data-lazy-module]').forEach(el => {
        observer.observe(el);
    });
}

/**
 * 设置条件延迟加载
 */
function setupConditionalLazyLoad() {
    // 当滚动到页面底部时加载更多模块
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            CodeSplitConfig.lazyModules.forEach(mod => {
                if (mod.condition && mod.condition()) {
                    window.moduleLoader?.loadModule(mod.name);
                }
            });
        }
    }, { passive: true });

    // 路由变化时加载相关模块（如果使用hash路由）
    window.addEventListener('hashchange', () => {
        CodeSplitConfig.lazyModules.forEach(mod => {
            if (mod.condition && mod.condition()) {
                window.moduleLoader?.loadModule(mod.name);
            }
        });
    });
}

/**
 * 手动触发模块加载
 * @param {string} moduleName
 * @returns {Promise}
 */
async function loadModule(moduleName) {
    return window.moduleLoader?.loadModule(moduleName);
}

/**
 * 获取已加载模块列表
 * @returns {Array}
 */
function getLoadedModules() {
    return Array.from(window.moduleLoader?.loadedModules?.keys() || []);
}

// 导出全局函数
window.ModuleLoader = ModuleLoader;
window.ModuleRegistry = ModuleRegistry;
window.CodeSplitConfig = CodeSplitConfig;
window.loadModule = loadModule;
window.getLoadedModules = getLoadedModules;
window.initCodeSplit = initCodeSplit;