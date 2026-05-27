/**
 * ================================================
 * 世界烈酒图鉴 - SEO优化
 * T04: SEO优化实现
 * ================================================
 */

/**
 * SEO优化管理器
 */
class SEOManager {
    constructor() {
        this.structuredDataCache = null;
    }

    /**
     * 更新页面标题
     * @param {string} title - 新标题
     * @param {boolean} appendSiteName - 是否追加站点名
     */
    updateTitle(title, appendSiteName = true) {
        const siteName = '世界烈酒图鉴';
        const fullTitle = appendSiteName ? `${title} - ${siteName}` : title;
        document.title = fullTitle;
        
        // 更新og:title
        this.updateMetaProperty('og:title', fullTitle);
    }

    /**
     * 更新Meta描述
     * @param {string} description
     */
    updateDescription(description) {
        this.updateMetaName('description', description);
        this.updateMetaProperty('og:description', description);
    }

    /**
     * 更新Meta标签
     * @param {string} name
     * @param {string} content
     */
    updateMetaName(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    /**
     * 更新Open Graph属性
     * @param {string} property
     * @param {string} content
     */
    updateMetaProperty(property, content) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    /**
     * 生成JSON-LD结构化数据
     * @param {Object} data - 页面数据
     * @returns {string}
     */
    generateStructuredData(data = {}) {
        const baseData = {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            'name': '世界烈酒图鉴',
            'description': '探索全球200款顶级烈酒，包含茅台、五粮液、威士忌、白兰地等',
            'applicationCategory': 'LifestyleApplication',
            'operatingSystem': 'Web Browser',
            'offers': {
                '@type': 'Offer',
                'price': '0',
                'priceCurrency': 'CNY'
            },
            'aggregateRating': {
                '@type': 'AggregateRating',
                'ratingValue': '4.8',
                'ratingCount': '200'
            }
        };

        // 如果有当前酒款信息，生成ItemList结构
        if (data.currentLiquor) {
            baseData.interactionStatistic = {
                '@type': 'InteractionCounter',
                'interactionType': { '@type': 'SearchAction' },
                'userInteractionCount': window.DATA?.length || 200
            };
        }

        return JSON.stringify(baseData);
    }

    /**
     * 注入结构化数据
     * @param {Object} data
     */
    injectStructuredData(data = {}) {
        // 移除已有的结构化数据
        const existing = document.querySelector('script[type="application/ld+json"]');
        if (existing) existing.remove();

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'seo-structured-data';
        script.textContent = this.generateStructuredData(data);
        document.head.appendChild(script);
    }

    /**
     * 添加面包屑导航结构化数据
     * @param {Array} breadcrumbs - 面包屑路径
     */
    injectBreadcrumbStructuredData(breadcrumbs = []) {
        const breadcrumbData = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': breadcrumbs.map((item, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'name': item.name,
                'item': item.url || window.location.href
            }))
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'seo-breadcrumb-data';
        script.textContent = JSON.stringify(breadcrumbData);
        document.head.appendChild(script);
    }

    /**
     * 生成酒款列表的结构化数据
     * @param {Array} liquors - 酒款列表
     * @returns {string}
     */
    generateLiquorListStructuredData(liquors = []) {
        const listData = {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            'name': '世界烈酒列表',
            'description': '全球顶级烈酒图鉴',
            'numberOfItems': liquors.length,
            'itemListElement': liquors.slice(0, 20).map((liquor, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'item': {
                    '@type': 'Product',
                    'name': liquor.name,
                    'description': liquor.description || `${liquor.name} - ${liquor.type} ${liquor.region}`,
                    'brand': {
                        '@type': 'Brand',
                        'name': liquor.brand || '未知品牌'
                    },
                    'offers': {
                        '@type': 'Offer',
                        'price': liquor.price || '0',
                        'priceCurrency': 'CNY'
                    }
                }
            }))
        };

        return JSON.stringify(listData);
    }

    /**
     * 更新当前页面的SEO信息
     * @param {Object} options - 配置选项
     */
    updatePageSEO(options = {}) {
        const {
            title,
            description,
            keywords,
            canonical,
            liquors
        } = options;

        if (title) this.updateTitle(title);
        if (description) this.updateDescription(description);
        if (keywords) this.updateMetaName('keywords', keywords);
        
        // 更新规范链接
        if (canonical) {
            let link = document.querySelector('link[rel="canonical"]');
            if (!link) {
                link = document.createElement('link');
                link.rel = 'canonical';
                document.head.appendChild(link);
            }
            link.href = canonical;
        }

        // 注入结构化数据
        this.injectStructuredData({ currentLiquor: options.currentLiquor });

        // 如果有酒款列表数据，生成列表结构化数据
        if (liquors && liquors.length > 0) {
            const existingList = document.querySelector('#seo-liquor-list-data');
            if (existingList) existingList.remove();

            const script = document.createElement('script');
            script.id = 'seo-liquor-list-data';
            script.type = 'application/ld+json';
            script.textContent = this.generateLiquorListStructuredData(liquors);
            document.head.appendChild(script);
        }

        // 生成面包屑
        this.injectBreadcrumbStructuredData(options.breadcrumbs || [
            { name: '首页', url: '/' },
            { name: '世界烈酒', url: '/liquors' }
        ]);
    }

    /**
     * 生成sitemap.xml类型的数据
     * @returns {Array}
     */
    generateSiteMapData() {
        const pages = [
            { url: '/', changefreq: 'weekly', priority: '1.0' },
            { url: '/?type=baijiu', changefreq: 'weekly', priority: '0.9' },
            { url: '/?type=whisky', changefreq: 'weekly', priority: '0.9' },
            { url: '/?type=cognac', changefreq: 'weekly', priority: '0.9' }
        ];

        return pages.map(page => ({
            loc: `${window.location.origin}${page.url}`,
            changefreq: page.changefreq,
            priority: page.priority,
            lastmod: new Date().toISOString().split('T')[0]
        }));
    }

    /**
     * 添加Robots.txt指导
     */
    addRobotsMeta() {
        // 添加robots meta标签
        const existing = document.querySelector('meta[name="robots"]');
        if (!existing) {
            const meta = document.createElement('meta');
            meta.name = 'robots';
            meta.content = 'index, follow';
            document.head.appendChild(meta);
        }
    }

    /**
     * 添加作者信息
     * @param {string} author
     */
    addAuthorMeta(author = 'LZ') {
        this.updateMetaName('author', author);
        this.updateMetaProperty('article:author', author);
    }

    /**
     * 生成社交分享元数据
     * @param {Object} options
     */
    addSocialMeta(options = {}) {
        const {
            title = '世界烈酒图鉴',
            description = '探索全球200款顶级烈酒',
            image = `${window.location.origin}/og-image.jpg`,
            url = window.location.href
        } = options;

        this.updateMetaProperty('og:title', title);
        this.updateMetaProperty('og:description', description);
        this.updateMetaProperty('og:image', image);
        this.updateMetaProperty('og:url', url);
        this.updateMetaProperty('og:type', 'website');

        // Twitter Card
        this.updateMetaName('twitter:card', 'summary_large_image');
        this.updateMetaName('twitter:title', title);
        this.updateMetaName('twitter:description', description);
        this.updateMetaName('twitter:image', image);
    }
}

// 创建全局SEO管理器
window.SEOManager = SEOManager;
window.seoManager = new SEOManager();

/**
 * 初始化SEO设置
 */
function initSEO() {
    // 添加基础SEO标签
    window.seoManager.addRobotsMeta();
    window.seoManager.addAuthorMeta();
    
    // 添加社交分享标签
    window.seoManager.addSocialMeta();
    
    // 注入初始结构化数据
    window.seoManager.injectStructuredData();

    console.log('SEO功能已初始化');
}

// 导出
window.initSEO = initSEO;