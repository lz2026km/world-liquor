/**
 * 世界烈酒图鉴 v6.5.0 - 功能增强主模块
 * 姜维（OpenCode）开发
 * 60项功能增强 - 高优先级功能（F01-F20）
 */

const LiquorFeatures = (() => {
  // ==================== 模块状态 ====================
  let 已初始化 = false;
  let 当前选中酒款 = null;
  let 筛选条件 = {};
  let 排序方式 = 'score';

  // ==================== 初始化 ====================
  const 初始化 = () => {
    if (已初始化) return;
    
    // 等待数据加载完成
    if (window.LiquorData) {
      初始化功能模块();
    } else {
      document.addEventListener('DOMContentLoaded', 初始化功能模块);
    }
    
    已初始化 = true;
  };

  const 初始化功能模块 = () => {
    // 初始化搜索增强
    初始化搜索增强();
    
    // 初始化筛选增强
    初始化筛选增强();
    
    // 初始化收藏夹增强
    初始化收藏夹增强();
    
    // 初始化成就系统
    初始化成就系统();
    
    // 初始化快捷键
    初始化快捷键();
    
    // 初始化主题设置
    初始化主题设置();
    
    // 初始化浏览历史
    初始化浏览历史();
    
    // 绑定事件监听
    绑定全局事件();
    
    console.log('🍶 世界烈酒图鉴 v6.5.0 功能模块初始化完成');
  };

  // ==================== F01 智能搜索增强 ====================
  const 初始化搜索增强 = () => {
    const 搜索输入框 = document.querySelector('.search-bar__input');
    if (!搜索输入框) return;
    
    // 实时搜索建议
    搜索输入框.addEventListener('input', 防抖处理((e) => {
      const query = e.target.value.trim();
      if (query.length >= 1) {
        显示搜索建议(query);
      } else {
        隐藏搜索建议();
      }
    }, 300));
    
    // 搜索历史显示
    搜索输入框.addEventListener('focus', () => {
      const 历史 = 获取搜索历史();
      if (历史.length > 0) {
        显示搜索历史(历史);
      }
    });
    
    // 回车搜索
    搜索输入框.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          保存搜索历史(query);
          执行搜索(query);
        }
      }
    });
  };

  const 显示搜索建议 = (query) => {
    const suggestions = document.querySelector('.search-suggestions') || 创建搜索建议容器();
    const results = 执行智能搜索(query);
    
    if (results.length === 0) {
      suggestions.innerHTML = '<div class="search-autocomplete__empty">未找到匹配结果</div>';
      suggestions.classList.add('show');
      return;
    }
    
    suggestions.innerHTML = results.map(item => `
      <div class="search-suggestion-item" data-id="${item.id}">
        <div class="suggestion-icon">${获取酒款图标(item.type)}</div>
        <div class="suggestion-info">
          <div class="suggestion-name">${高亮匹配(item.name, query)}</div>
          <div class="suggestion-meta">
            <span class="suggestion-type">${item.type || '其他'}</span>
            <span class="suggestion-match-type pinyin">${item.匹配类型 || ''}</span>
          </div>
        </div>
      </div>
    `).join('');
    
    suggestions.classList.add('show');
    
    // 绑定点击事件
    suggestions.querySelectorAll('.search-suggestion-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        打开酒款详情(id);
        隐藏搜索建议();
      });
    });
  };

  const 创建搜索建议容器 = () => {
    const 搜索容器 = document.querySelector('.header__search');
    const container = document.createElement('div');
    container.className = 'search-suggestions';
    搜索容器.appendChild(container);
    return container;
  };

  const 隐藏搜索建议 = () => {
    const suggestions = document.querySelector('.search-suggestions');
    if (suggestions) {
      suggestions.classList.remove('show');
    }
  };

  const 执行智能搜索 = (query) => {
    const allData = window.LiquorData?.getAll() || [];
    if (!query) return [];
    
    const q = query.toLowerCase();
    
    return allData
      .map(item => {
        const name = (item.name || '').toLowerCase();
        const ename = (item.ename || '').toLowerCase();
        const pinyin = 转拼音(item.name || '');
        const pinyinAbbr = 取拼音首字母(item.name || '');
        
        let 匹配类型 = '';
        let matched = false;
        
        if (name.includes(q)) {
          匹配类型 = '汉字匹配';
          matched = true;
        } else if (ename.includes(q)) {
          匹配类型 = '英文匹配';
          matched = true;
        } else if (pinyin.includes(q)) {
          匹配类型 = '拼音匹配';
          matched = true;
        } else if (pinyinAbbr.includes(q)) {
          匹配类型 = '首字母匹配';
          matched = true;
        }
        
        return matched ? { ...item, 匹配类型 } : null;
      })
      .filter(Boolean)
      .slice(0, 8);
  };

  const 高亮匹配 = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="match">$1</span>');
  };

  const 显示搜索历史 = (历史) => {
    const historyContainer = document.querySelector('.search-history') || 创建历史容器();
    historyContainer.innerHTML = `
      <div class="search-history__header">
        <span class="search-history__title">搜索历史</span>
        <button class="search-history__clear" onclick="清除搜索历史()">清除</button>
      </div>
      <div class="search-history__list">
        ${历史.slice(0, 10).map(keyword => `
          <div class="search-history__item" onclick="执行搜索('${keyword}')">
            <span class="search-history__item-icon">⏱️</span>
            <span>${keyword}</span>
          </div>
        `).join('')}
      </div>
    `;
    historyContainer.classList.add('show');
  };

  const 创建历史容器 = () => {
    const 搜索容器 = document.querySelector('.header__search');
    const container = document.createElement('div');
    container.className = 'search-history';
    搜索容器.appendChild(container);
    return container;
  };

  const 保存搜索历史 = (query) => {
    let 历史 = JSON.parse(localStorage.getItem('liquor_search_history') || '[]');
    历史 = 历史.filter(k => k !== query);
    历史.unshift(query);
    历史 = 历史.slice(0, 20);
    localStorage.setItem('liquor_search_history', JSON.stringify(历史));
  };

  const 获取搜索历史 = () => {
    return JSON.parse(localStorage.getItem('liquor_search_history') || '[]');
  };

  const 清除搜索历史 = () => {
    localStorage.setItem('liquor_search_history', '[]');
    const historyContainer = document.querySelector('.search-history');
    if (historyContainer) {
      historyContainer.classList.remove('show');
    }
  };

  const 执行搜索 = (query) => {
    window.LiquorData?.filter({ query });
    // 触发搜索结果更新
    document.dispatchEvent(new CustomEvent('searchUpdated', { detail: { query } }));
  };

  // ==================== F02 高级筛选增强 ====================
  const 初始化筛选增强 = () => {
    // 价格区间快速选择
    setupPriceRangeSlider();
    
    // 筛选标签交互
    setupFilterChips();
    
    // 筛选历史
    setupFilterHistory();
  };

  const setupPriceRangeSlider = () => {
    const slider = document.querySelector('.price-range-slider');
    if (!slider) return;
    
    const display = document.querySelector('.price-range-display');
    
    slider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (display) {
        display.textContent = `¥0 - ¥${value}`;
      }
      更新价格筛选(value);
    });
  };

  const setupFilterChips = () => {
    document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
      chip.addEventListener('click', () => {
        const filterType = chip.dataset.filter;
        const filterValue = chip.dataset.value;
        
        // 切换选中状态
        const siblings = chip.parentElement.querySelectorAll('.filter-chip');
        siblings.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        // 应用筛选
        应用筛选条件(filterType, filterValue);
      });
    });
  };

  const setupFilterHistory = () => {
    const 历史 = 获取筛选历史();
    if (历史.length > 0) {
      渲染筛选历史(历史);
    }
  };

  const 应用筛选条件 = (type, value) => {
    筛选条件[type] = value;
    保存筛选历史到存储(筛选条件);
    重新筛选酒款();
  };

  const 重新筛选酒款 = () => {
    const results = window.LiquorData?.filter(筛选条件) || [];
    document.dispatchEvent(new CustomEvent('filterUpdated', { 
      detail: { filters: 筛选条件, results } 
    }));
  };

  const 保存筛选历史到存储 = (filters) => {
    let 历史 = 获取筛选历史();
    const item = {
      id: Date.now(),
      filters: { ...filters },
      timestamp: new Date().toLocaleString('zh-CN')
    };
    历史.unshift(item);
    历史 = 历史.slice(0, 10);
    localStorage.setItem('liquor_filter_history', JSON.stringify(历史));
  };

  const 获取筛选历史 = () => {
    return JSON.parse(localStorage.getItem('liquor_filter_history') || '[]');
  };

  const 渲染筛选历史 = (历史) => {
    const container = document.querySelector('.filter-history');
    if (!container) return;
    
    container.innerHTML = `
      <div class="filter-history__header">
        <span class="filter-history__title">筛选历史</span>
        <button class="filter-history__clear" onclick="清除筛选历史()">清除</button>
      </div>
      <div class="filter-history__list">
        ${历史.map(item => `
          <div class="filter-history__item" onclick="恢复筛选历史('${item.id}')">
            <span class="filter-history__item-time">${item.timestamp}</span>
            <span class="filter-history__item-summary">${生成筛选摘要(item.filters)}</span>
          </div>
        `).join('')}
      </div>
    `;
  };

  const 生成筛选摘要 = (filters) => {
    const parts = [];
    if (filters.type) parts.push(filters.type);
    if (filters.region) parts.push(filters.region);
    if (filters.priceRange) parts.push(`¥${filters.priceRange.min}-${filters.priceRange.max}`);
    return parts.join(' | ') || '未设置筛选';
  };

  const 恢复筛选历史 = (historyId) => {
    const 历史 = 获取筛选历史();
    const item = 历史.find(h => h.id === parseInt(historyId));
    if (item) {
      筛选条件 = { ...item.filters };
      重新筛选酒款();
    }
  };

  const 清除筛选历史 = () => {
    localStorage.setItem('liquor_filter_history', '[]');
    const container = document.querySelector('.filter-history');
    if (container) {
      container.innerHTML = '';
    }
  };

  // ==================== F04 收藏夹增强 ====================
  const 初始化收藏夹增强 = () => {
    // 初始化收藏分组
    初始化收藏分组();
    
    // 绑定收藏按钮事件
    绑定收藏按钮事件();
  };

  const 初始化收藏分组 = () => {
    const 默认分组 = {
      '白酒': { id: '白酒', name: '白酒', icon: '🍶', items: [] },
      '威士忌': { id: '威士忌', name: '威士忌', icon: '🥃', items: [] },
      '白兰地': { id: '白兰地', name: '白兰地', icon: '🍷', items: [] },
      '伏特加': { id: '伏特加', name: '伏特加', icon: '🍸', items: [] },
      '金酒': { id: '金酒', name: '金酒', icon: '🌿', items: [] },
      '朗姆酒': { id: '朗姆酒', name: '朗姆酒', icon: '🏝️', items: [] },
      '龙舌兰': { id: '龙舌兰', name: '龙舌兰', icon: '🌵', items: [] },
      '我的收藏': { id: '我的收藏', name: '我的收藏', icon: '❤️', items: [] }
    };
    
    let 分组 = JSON.parse(localStorage.getItem('liquor_favorites') || 'null');
    if (!分组) {
      分组 = 默认分组;
      localStorage.setItem('liquor_favorites', JSON.stringify(分组));
    }
    
    return 分组;
  };

  const 绑定收藏按钮事件 = () => {
    document.querySelectorAll('.liquor-card-fav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.liquor-card');
        const itemId = card?.dataset.id;
        if (itemId) {
          切换收藏状态(itemId, btn);
        }
      });
    });
  };

  const 切换收藏状态 = (itemId, btn) => {
    const 分组 = JSON.parse(localStorage.getItem('liquor_favorites') || '{}');
    const 默认分组 = '我的收藏';
    
    // 查找当前酒款所在分组
    let 当前分组Id = null;
    Object.values(分组).forEach(group => {
      if (group.items?.includes(itemId)) {
        当前分组Id = group.id;
      }
    });
    
    if (当前分组Id) {
      // 取消收藏
      const group = 分组[当前分组Id];
      group.items = group.items.filter(id => id !== itemId);
      btn.classList.remove('active');
    } else {
      // 添加收藏
      if (!分组[默认分组]) {
        分组[默认分组] = { id: 默认分组, name: 默认分组, icon: '❤️', items: [] };
      }
      分组[默认分组].items.push(itemId);
      btn.classList.add('active');
    }
    
    localStorage.setItem('liquor_favorites', JSON.stringify(分组));
    显示提示消息(当前分组Id ? '已取消收藏' : '已添加到收藏', 'success');
  };

  const 打开收藏管理器 = () => {
    const modal = document.getElementById('favoritesManager') || 创建收藏管理器();
    modal.classList.add('show');
  };

  const 创建收藏管理器 = () => {
    const container = document.createElement('div');
    container.id = 'favoritesManager';
    container.className = 'favorites-manager';
    container.innerHTML = `
      <div class="favorites-manager__header">
        <span class="favorites-manager__title">📦 收藏管理</span>
        <button class="favorites-manager__close" onclick="关闭收藏管理器()">✕</button>
      </div>
      <div class="favorites-manager__tabs">
        <div class="favorites-manager__tab active" data-tab="groups">分组</div>
        <div class="favorites-manager__tab" data-tab="ranking">排行榜</div>
      </div>
      <div class="favorites-manager__content">
        ${渲染收藏分组列表()}
      </div>
    `;
    document.body.appendChild(container);
    return container;
  };

  const 关闭收藏管理器 = () => {
    const modal = document.getElementById('favoritesManager');
    if (modal) {
      modal.classList.remove('show');
    }
  };

  const 渲染收藏分组列表 = () => {
    const 分组 = JSON.parse(localStorage.getItem('liquor_favorites') || '{}');
    return Object.values(分组).map(group => `
      <div class="folder-card" data-id="${group.id}">
        <div class="folder-card__header">
          <span class="folder-card__icon">${group.icon}</span>
          <div class="folder-card__info">
            <div class="folder-card__name">${group.name}</div>
            <div class="folder-card__count">${group.items?.length || 0} 款酒</div>
          </div>
          <div class="folder-card__actions">
            <button class="folder-card__btn" onclick="编辑分组名称('${group.id}')">✏️</button>
            ${!['白酒', '威士忌', '白兰地', '伏特加', '金酒', '朗姆酒', '龙舌兰', '我的收藏'].includes(group.id) 
              ? `<button class="folder-card__btn delete" onclick="删除分组('${group.id}')">🗑️</button>` 
              : ''}
          </div>
        </div>
        <div class="folder-card__items">
          ${(group.items || []).slice(0, 10).map(itemId => {
            const item = window.LiquorData?.getById(itemId);
            return item ? `<span class="folder-card__item-tag" onclick="打开酒款详情('${itemId}')">${item.name}</span>` : '';
          }).join('')}
        </div>
      </div>
    `).join('');
  };

  // ==================== F05 对比功能增强 ====================
  let 对比列表 = [];

  const 添加到对比 = (itemId) => {
    if (对比列表.length >= 12) {
      显示提示消息('对比数量已达上限(12款)', 'warning');
      return false;
    }
    if (!对比列表.includes(itemId)) {
      对比列表.push(itemId);
      更新对比栏();
    }
    return true;
  };

  const 从对比移除 = (itemId) => {
    对比列表 = 对比列表.filter(id => id !== itemId);
    更新对比栏();
  };

  const 清空对比 = () => {
    对比列表 = [];
    更新对比栏();
  };

  const 更新对比栏 = () => {
    const compareBar = document.querySelector('.compare-bar');
    const compareItems = document.querySelector('.compare-items');
    
    if (!compareBar || !compareItems) return;
    
    if (对比列表.length === 0) {
      compareBar.classList.remove('show');
      return;
    }
    
    compareBar.classList.add('show');
    compareItems.innerHTML = 对比列表.map(id => {
      const item = window.LiquorData?.getById(id);
      if (!item) return '';
      return `
        <div class="compare-item" data-id="${id}">
          <div class="compare-item__name">${item.name}</div>
          <div class="compare-item__meta">${item.type} | ${item.abv}°</div>
          <button class="compare-item__remove" onclick="从对比移除('${id}')">✕</button>
        </div>
      `;
    }).join('');
  };

  const 打开对比模态框 = () => {
    if (对比列表.length < 2) {
      显示提示消息('请至少选择2款酒进行对比', 'warning');
      return;
    }
    
    const modal = document.getElementById('compareModal') || 创建对比模态框();
    modal.classList.add('show');
    渲染对比表格();
  };

  const 创建对比模态框 = () => {
    const container = document.createElement('div');
    container.id = 'compareModal';
    container.className = 'modal compare-modal';
    container.innerHTML = `
      <button class="modal__close" onclick="关闭对比模态框()">✕</button>
      <div class="modal__content">
        <h2 class="modal__section-title">📊 酒款对比</h2>
        <div class="compare-table-wrapper">
          <table class="compare-table" id="compareTable"></table>
        </div>
        <div class="compare-radar-container" id="compareRadarContainer">
          <canvas id="compareRadarChart" class="compare-radar-chart"></canvas>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    return container;
  };

  const 关闭对比模态框 = () => {
    const modal = document.getElementById('compareModal');
    if (modal) {
      modal.classList.remove('show');
    }
  };

  const 渲染对比表格 = () => {
    const table = document.getElementById('compareTable');
    if (!table) return;
    
    const items = 对比列表.map(id => window.LiquorData?.getById(id)).filter(Boolean);
    
    // 表头
    let html = `<thead><tr><th>属性</th>${items.map(item => `<th>${item.name}</th>`).join('')}</tr></thead><tbody>`;
    
    // 属性行
    const attributes = [
      { key: 'type', label: '类型' },
      { key: 'region', label: '产区' },
      { key: 'abv', label: '酒精度' },
      { key: 'price', label: '价格' },
      { key: 'score', label: '评分' },
      { key: 'aroma', label: '香气' },
      { key: 'body', label: '口感' },
      { key: 'taste', label: '味道' },
      { key: 'afterglow', label: '余韵' }
    ];
    
    attributes.forEach(attr => {
      html += `<tr><td class="compare-label">${attr.label}</td>`;
      const values = items.map(item => item[attr.key] || '-');
      const maxVal = Math.max(...values.filter(v => typeof v === 'number'));
      
      values.forEach(val => {
        const isMax = val === maxVal && typeof val === 'number';
        html += `<td class="${isMax ? 'highlight-best' : ''}">${val}${attr.key === 'price' && val !== '-' ? '元' : ''}${attr.key === 'abv' && val !== '-' ? '°' : ''}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</tbody>';
    table.innerHTML = html;
  };

  // ==================== F06 品鉴笔记增强 ====================
  const 保存品鉴笔记 = (note) => {
    const 笔记 = JSON.parse(localStorage.getItem('liquor_tasting_notes') || '[]');
    const 新笔记 = {
      id: Date.now(),
      ...note,
      createdAt: new Date().toISOString()
    };
    笔记.unshift(新笔记);
    localStorage.setItem('liquor_tasting_notes', JSON.stringify(笔记));
    显示提示消息('品鉴笔记已保存', 'success');
    return 新笔记;
  };

  const 获取品鉴笔记列表 = () => {
    return JSON.parse(localStorage.getItem('liquor_tasting_notes') || '[]');
  };

  const 删除品鉴笔记 = (noteId) => {
    let 笔记 = JSON.parse(localStorage.getItem('liquor_tasting_notes') || '[]');
    笔记 = 笔记.filter(n => n.id !== noteId);
    localStorage.setItem('liquor_tasting_notes', JSON.stringify(笔记));
    显示提示消息('品鉴笔记已删除', 'success');
  };

  // ==================== F08 成就系统增强 ====================
  const 初始化成就系统 = () => {
    const 成就 = JSON.parse(localStorage.getItem('liquor_achievements') || 'null');
    if (!成就) {
      localStorage.setItem('liquor_achievements', JSON.stringify({
        '探索者': { unlocked: false, progress: 0 },
        '收藏家': { unlocked: false, progress: 0 },
        '品鉴师': { unlocked: false, progress: 0 },
        '美食家': { unlocked: false, progress: 0 },
        '调酒师': { unlocked: false, progress: 0 },
        '投资者': { unlocked: false, progress: 0 }
      }));
    }
  };

  const 检查成就解锁 = () => {
    const 成就 = JSON.parse(localStorage.getItem('liquor_achievements') || '{}');
    const favorites = JSON.parse(localStorage.getItem('liquor_favorites') || '{}');
    const notes = JSON.parse(localStorage.getItem('liquor_tasting_notes') || '[]');
    
    let newlyUnlocked = [];
    
    // 检查收藏家成就
    const totalFavorites = Object.values(favorites).reduce((sum, g) => sum + (g.items?.length || 0), 0);
    if (totalFavorites >= 100 && !成就['收藏家']?.unlocked) {
      成就['收藏家'].unlocked = true;
      newlyUnlocked.push('收藏家');
    }
    
    // 检查品鉴师成就
    if (notes.length >= 50 && !成就['品鉴师']?.unlocked) {
      成就['品鉴师'].unlocked = true;
      newlyUnlocked.push('品鉴师');
    }
    
    if (newlyUnlocked.length > 0) {
      localStorage.setItem('liquor_achievements', JSON.stringify(成就));
      显示提示消息(`🎉 成就解锁: ${newlyUnlocked.join(', ')}`, 'success');
    }
    
    return newlyUnlocked;
  };

  // ==================== F09 盲品模式 ====================
  let 盲品模式 = false;

  const 切换盲品模式 = () => {
    盲品模式 = !盲品模式;
    const indicator = document.querySelector('.blind-mode-indicator');
    const cards = document.querySelectorAll('.liquor-card');
    
    if (indicator) {
      indicator.classList.toggle('show', 盲品模式);
    }
    
    cards.forEach(card => {
      card.classList.toggle('blind-mode', 盲品模式);
    });
    
    return 盲品模式;
  };

  // ==================== F13 主题设置 ====================
  const 初始化主题设置 = () => {
    const savedTheme = localStorage.getItem('liquor_theme') || 'auto';
    设置主题(savedTheme);
  };

  const 设置主题 = (theme) => {
    const html = document.documentElement;
    
    switch(theme) {
      case 'dark':
        html.removeAttribute('data-theme');
        break;
      case 'light':
        html.setAttribute('data-theme', 'light');
        break;
      case 'oled':
        html.setAttribute('data-theme', 'oled');
        break;
      case 'auto':
        // 检测系统偏好
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          html.removeAttribute('data-theme');
        } else {
          html.setAttribute('data-theme', 'light');
        }
        break;
    }
    
    localStorage.setItem('liquor_theme', theme);
    
    // 更新按钮状态
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  };

  // ==================== F14 快捷键 ====================
  const 初始化快捷键 = () => {
    document.addEventListener('keydown', (e) => {
      // 忽略在输入框中的按键
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      
      switch(e.key) {
        case 'j':
        case 'J':
          导航选中项(1);
          break;
        case 'k':
        case 'K':
          导航选中项(-1);
          break;
        case 'g':
          跳转到位置('first');
          break;
        case 'G':
          跳转到位置('last');
          break;
        case '/':
          e.preventDefault();
          document.querySelector('.search-bar__input')?.focus();
          break;
        case 'Escape':
          关闭所有模态框();
          break;
        case 'b':
        case 'B':
          if (!e.ctrlKey && !e.metaKey) {
            切换侧边栏();
          }
          break;
      }
    });
  };

  let 当前选中索引 = 0;

  const 导航选中项 = (direction) => {
    const cards = document.querySelectorAll('.liquor-card');
    if (cards.length === 0) return;
    
    cards[当前选中索引]?.classList.remove('selected');
    
    if (direction > 0) {
      当前选中索引 = Math.min(当前选中索引 + 1, cards.length - 1);
    } else {
      当前选中索引 = Math.max(当前选中索引 - 1, 0);
    }
    
    cards[当前选中索引]?.classList.add('selected');
    cards[当前选中索引]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const 跳转到位置 = (position) => {
    const cards = document.querySelectorAll('.liquor-card');
    if (cards.length === 0) return;
    
    cards[当前选中索引]?.classList.remove('selected');
    当前选中索引 = position === 'first' ? 0 : cards.length - 1;
    cards[当前选中索引]?.classList.add('selected');
    cards[当前选中索引]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const 关闭所有模态框 = () => {
    document.querySelectorAll('.modal-backdrop.show, .modal.show, .favorites-manager.show').forEach(m => {
      m.classList.remove('show');
    });
  };

  const 切换侧边栏 = () => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('mobile-open');
    }
  };

  // ==================== F21 浏览历史 ====================
  const 初始化浏览历史 = () => {
    // 记录浏览历史
    document.querySelectorAll('.liquor-card').forEach(card => {
      card.addEventListener('click', () => {
        const itemId = card.dataset.id;
        if (itemId) {
          记录浏览(itemId);
        }
      });
    });
  };

  const 记录浏览 = (itemId) => {
    let 历史 = JSON.parse(localStorage.getItem('liquor_browse_history') || '[]');
    
    // 移除已存在的相同记录
    历史 = 历史.filter(h => h.id !== itemId);
    
    // 添加到开头
    历史.unshift({
      id: itemId,
      timestamp: Date.now()
    });
    
    // 保持最多50条
    历史 = 历史.slice(0, 50);
    
    localStorage.setItem('liquor_browse_history', JSON.stringify(历史));
  };

  const 获取浏览历史 = () => {
    return JSON.parse(localStorage.getItem('liquor_browse_history') || '[]');
  };

  // ==================== 辅助函数 ====================
  const 防抖处理 = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const 转拼音 = (str) => {
    if (!str) return '';
    // 简化的拼音转换
    const map = {
      '马':'ma','拉':'la','图':'tu','克':'ke','帝':'di','王':'wang',
      '茅':'mao','台':'tai','五':'wu','粮':'liang','液':'ye',
      '威':'wei','士':'shi','忌':'ji','白':'bai','兰':'lan','地':'di',
      '伏':'fu','特':'te','加':'jia','金':'jin','酒':'jiu','朗':'lang',
      '姆':'mu','龙':'long','舌':'she','酸':'suan','甜':'tian',
      '苦':'ku','辣':'la','香':'xiang','陈':'chen','老':'lao'
    };
    let result = '';
    for (let char of str) {
      result += map[char] || char;
    }
    return result;
  };

  const 取拼音首字母 = (str) => {
    if (!str) return '';
    return str.split('').map(c => 转拼音(c).charAt(0)).join('');
  };

  const 获取酒款图标 = (type) => {
    const icons = {
      '酱香型': '🍶', '浓香型': '🍶', '清香型': '🍶', '馥郁香型': '🍶',
      '威士忌': '🥃', '白兰地': '🍷', '伏特加': '🍸', '金酒': '🌿',
      '朗姆酒': '🏝️', '龙舌兰': '🌵', '清酒': '🍶', '其他': '🍾'
    };
    return icons[type] || '🍾';
  };

  const 打开酒款详情 = (itemId) => {
    window.openLiquorModal?.(itemId);
  };

  const 显示提示消息 = (message, type = 'info') => {
    const container = document.querySelector('.toast-container') || 创建提示容器();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    toast.innerHTML = `
      <span class="toast__icon">${icons[type] || icons.info}</span>
      <span>${message}</span>
      <button class="toast__close" onclick="this.parentElement.remove()">✕</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const 创建提示容器 = () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  };

  const 绑定全局事件 = () => {
    // 点击空白处关闭建议
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header__search')) {
        隐藏搜索建议();
        const historyContainer = document.querySelector('.search-history');
        if (historyContainer) {
          historyContainer.classList.remove('show');
        }
      }
    });
    
    // ESC关闭模态框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        关闭所有模态框();
      }
    });
  };

  // ==================== 公开 API ====================
  return {
    初始化,
    
    // 搜索
    执行搜索,
    保存搜索历史,
    获取搜索历史: 获取搜索历史,
    清除搜索历史,
    
    // 筛选
    应用筛选条件,
    获取筛选历史,
    恢复筛选历史,
    清除筛选历史,
    
    // 收藏
    获取收藏分组: () => JSON.parse(localStorage.getItem('liquor_favorites') || '{}'),
    切换收藏状态,
    打开收藏管理器,
    关闭收藏管理器,
    
    // 对比
    添加到对比,
    从对比移除,
    清空对比,
    打开对比模态框,
    关闭对比模态框,
    获取对比列表: () => 对比列表,
    
    // 品鉴笔记
    保存品鉴笔记,
    获取品鉴笔记: 获取品鉴笔记列表,
    删除品鉴笔记,
    
    // 成就
    检查成就解锁,
    
    // 盲品
    切换盲品模式,
    是否盲品模式: () => 盲品模式,
    
    // 主题
    设置主题,
    获取当前主题: () => localStorage.getItem('liquor_theme') || 'auto',
    
    // 工具
    显示提示消息,
    获取浏览历史
  };
})();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  LiquorFeatures.初始化();
});

// 全局函数挂载
window.LiquorFeatures = LiquorFeatures;
window.清除搜索历史 = LiquorFeatures.清除搜索历史;
window.执行搜索 = LiquorFeatures.执行搜索;
window.恢复筛选历史 = (id) => LiquorFeatures.恢复筛选历史(id);
window.清除筛选历史 = LiquorFeatures.清除筛选历史;
window.打开收藏管理器 = LiquorFeatures.打开收藏管理器;
window.关闭收藏管理器 = LiquorFeatures.关闭收藏管理器;
window.添加到对比 = LiquorFeatures.添加到对比;
window.从对比移除 = LiquorFeatures.从对比移除;
window.清空对比 = LiquorFeatures.清空对比;
window.打开对比模态框 = LiquorFeatures.打开对比模态框;
window.关闭对比模态框 = LiquorFeatures.关闭对比模态框;
window.删除品鉴笔记 = LiquorFeatures.删除品鉴笔记;
window.切换盲品模式 = LiquorFeatures.切换盲品模式;
window.设置主题 = LiquorFeatures.设置主题;