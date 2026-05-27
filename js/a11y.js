/**
 * ================================================
 * 世界烈酒图鉴 - 无障碍访问增强
 * T05: 无障碍访问优化
 * ================================================
 */

class AccessibilityManager {
    constructor() {
        this.focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(', ');
        
        this.skipLinks = [];
        this.announcer = null;
        this.lastFocusedElement = null;
        
        this.init();
    }

    init() {
        this.createSkipLinks();
        this.createAnnouncer();
        this.setupFocusManagement();
        this.setupKeyboardNavigation();
        this.setupAriaLiveRegion();
    }

    /**
     * 创建跳过导航链接
     */
    createSkipLinks() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = '跳转到主要内容';
        skipLink.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector('#main-content, .main-content, main');
            if (target) {
                target.tabIndex = -1;
                target.focus();
                target.scrollIntoView();
            }
        });
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .skip-link {
                position: absolute;
                top: -100px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--accent-600, #b08a42);
                color: white;
                padding: 12px 24px;
                border-radius: 0 0 8px 8px;
                z-index: 10000;
                font-weight: 600;
                text-decoration: none;
                transition: top 0.3s;
            }
            .skip-link:focus {
                top: 0;
                outline: 2px solid var(--accent-400, #cfa85e);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    /**
     * 创建语音播报区域
     */
    createAnnouncer() {
        this.announcer = document.createElement('div');
        this.announcer.id = 'aria-live-announcer';
        this.announcer.setAttribute('aria-live', 'polite');
        this.announcer.setAttribute('aria-atomic', 'true');
        this.announcer.className = 'sr-only';
        this.announcer.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;
        document.body.appendChild(this.announcer);
    }

    /**
     * 播报消息给屏幕阅读器
     * @param {string} message - 消息内容
     * @param {string} priority - 优先级 'polite' | 'assertive'
     */
    announce(message, priority = 'polite') {
        if (!this.announcer) return;
        
        this.announcer.setAttribute('aria-live', priority);
        this.announcer.textContent = '';
        
        // 延迟确保内容被重新读取
        setTimeout(() => {
            this.announcer.textContent = message;
        }, 100);
    }

    /**
     * 设置焦点管理
     */
    setupFocusManagement() {
        // 记住上次焦点的元素
        document.addEventListener('mousedown', () => {
            this.lastFocusedElement = document.activeElement;
        });

        // 当模态框打开时保存焦点
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && this.lastFocusedElement) {
                this.lastFocusedElement.focus();
            }
        });
    }

    /**
     * 设置键盘导航
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', e => {
            // 处理特定的键盘快捷键
            if (e.key === 'Tab') {
                this.handleTabKey(e);
            }
        });
    }

    /**
     * 处理Tab键导航
     * @param {KeyboardEvent} e
     */
    handleTabKey(e) {
        const focusableElements = this.getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Shift + Tab 循环
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
            this.announce('已循环到最后一个可聚焦元素');
        }
        // Tab 循环
        else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
            this.announce('已循环到第一个可聚焦元素');
        }
    }

    /**
     * 获取所有可聚焦元素
     * @returns {NodeList}
     */
    getFocusableElements() {
        return document.querySelectorAll(this.focusableSelectors);
    }

    /**
     * 设置ARIA实时区域
     */
    setupAriaLiveRegion() {
        // 为动态内容更新添加ARIA标签
        const liveRegion = document.createElement('div');
        liveRegion.id = 'live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
    }

    /**
     * 更新按钮的ARIA标签
     * @param {HTMLElement} button
     * @param {boolean} isActive
     */
    updateButtonState(button, isActive) {
        if (!button) return;
        
        const currentLabel = button.getAttribute('aria-label') || button.textContent;
        if (isActive) {
            button.setAttribute('aria-pressed', 'true');
            button.setAttribute('aria-label', `${currentLabel} (已激活)`);
        } else {
            button.setAttribute('aria-pressed', 'false');
            button.setAttribute('aria-label', `${currentLabel} (未激活)`);
        }
    }

    /**
     * 为模态框设置适当的ARIA属性
     * @param {HTMLElement} modal
     */
    setupModalAccessibility(modal) {
        if (!modal) return;

        // 设置ARIA属性
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        
        // 如果有标题，设置aria-labelledby
        const title = modal.querySelector('h1, h2, h3');
        if (title) {
            const titleId = `modal-title-${Date.now()}`;
            title.id = titleId;
            modal.setAttribute('aria-labelledby', titleId);
        }

        // 如果有描述，设置aria-describedby
        const description = modal.querySelector('.modal__section-title, .modal__text');
        if (description) {
            const descId = `modal-desc-${Date.now()}`;
            description.id = descId;
            modal.setAttribute('aria-describedby', descId);
        }
    }

    /**
     * 为卡片列表设置ARIA角色
     * @param {HTMLElement} container
     */
    setupListAccessibility(container) {
        if (!container) return;

        const items = container.children;
        
        // 设置ARIA角色
        container.setAttribute('role', 'list');
        
        // 为每个列表项设置角色
        Array.from(items).forEach((item, index) => {
            item.setAttribute('role', 'listitem');
            item.setAttribute('aria-posinset', index + 1);
            item.setAttribute('aria-setsize', items.length);
            
            // 添加键盘导航支持
            item.setAttribute('tabindex', '0');
            item.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }

    /**
     * 高对比度模式支持
     */
    enableHighContrast() {
        const style = document.createElement('style');
        style.id = 'high-contrast-mode';
        style.textContent = `
            @media (forced-colors: active) {
                .liquor-card {
                    border: 2px solid ButtonText !important;
                }
                .header__btn, .filter-chip {
                    border: 2px solid ButtonText !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 添加视觉焦点指示器
     */
    addFocusIndicators() {
        const style = document.createElement('style');
        style.id = 'focus-indicators';
        style.textContent = `
            *:focus-visible {
                outline: 3px solid var(--accent-400, #cfa85e) !important;
                outline-offset: 2px !important;
            }
            button:focus-visible,
            a:focus-visible {
                outline: 3px solid var(--accent-400, #cfa85e) !important;
                outline-offset: 2px !important;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * 初始化无障碍功能
 */
function initAccessibility() {
    // 创建无障碍管理器
    window.accessibilityManager = new AccessibilityManager();
    
    // 添加焦点指示器
    window.accessibilityManager.addFocusIndicators();
    
    // 为所有按钮添加ARIA标签
    document.querySelectorAll('button').forEach(btn => {
        if (!btn.getAttribute('aria-label') && !btn.textContent.trim()) {
            const titleEl = btn.querySelector('[title]');
            if (titleEl) {
                btn.setAttribute('aria-label', titleEl.getAttribute('title'));
            }
        }
    });
    
    // 为图片添加缺失的alt属性
    document.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('alt')) {
            img.setAttribute('alt', '烈酒图片');
        }
    });

    // 确保所有表单元素有标签
    document.querySelectorAll('input, select, textarea').forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (!label && !input.hasAttribute('aria-label')) {
            const placeholder = input.getAttribute('placeholder');
            if (placeholder) {
                input.setAttribute('aria-label', placeholder);
            }
        }
    });

    console.log('无障碍功能已初始化');
}

// 导出全局函数
window.AccessibilityManager = AccessibilityManager;
window.initAccessibility = initAccessibility;