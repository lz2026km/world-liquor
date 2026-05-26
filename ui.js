/**
 * 世界烈酒图鉴 v5 - 渲染层模块
 * 职责：UI渲染逻辑，与数据层解耦
 */

const UIRenderer = (() => {
  // DOM 元素引用
  let cardContainer = null;
  let filterContainer = null;
  let modalContainer = null;

  // 配置
  const CONFIG = {
    cardClass: 'liquor-card',
    cardImageClass: 'card-image',
    cardTitleClass: 'card-title',
    cardSubtitleClass: 'card-subtitle',
    cardScoreClass: 'card-score',
    cardPriceClass: 'card-price',
    modalClass: 'detail-modal-fullscreen',
    radarCanvasClass: 'radar-chart-canvas',
    filterActiveClass: 'filter-active',
    shimmerClass: 'card-shimmer',
    fadeInClass: 'fade-in-up'
  };

  // 图片错误处理
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const getImageUrl = (liquor) => {
    return liquor.image || `/images/${liquor.name}.jpg`;
  };

  // 创建卡片 HTML
  const createCardHTML = (liquor) => {
    const priceDisplay = liquor.price ? `¥${liquor.price.toLocaleString()}` : '价格待定';
    const scoreDisplay = liquor.score ? liquor.score.toFixed(1) : '--';
    const abvDisplay = liquor.abv ? `${liquor.abv}%vol` : '';
    const typeDisplay = liquor.type || '';
    const regionDisplay = liquor.region ? `【${liquor.region}】` : '';

return `
      <article class="${CONFIG.cardClass} ${CONFIG.shimmerClass}" data-id="${escapeHtml(liquor.id)}">
        <div class="${CONFIG.cardImageClass}">
          <img
            src="${getImageUrl(liquor)}"
            alt="${escapeHtml(liquor.name)}"
            loading="lazy"
            onerror="this.src='/images/placeholder.jpg'"
          />
          <span class="card-type-badge">${escapeHtml(typeDisplay)}</span>
        </div>
        <div class="card-content">
          <header class="card-header">
            <h3 class="${CONFIG.cardTitleClass}">${escapeHtml(regionDisplay)}${escapeHtml(liquor.name)}</h3>
            <p class="${CONFIG.cardSubtitleClass}">${escapeHtml(liquor.ename || '')}</p>
          </header>
          <div class="card-meta">
            <span class="${CONFIG.cardScoreClass}">
              <i class="icon-score"></i>
              ${escapeHtml(scoreDisplay)}
            </span>
            <span class="${CONFIG.cardPriceClass}">${escapeHtml(priceDisplay)}</span>
          </div>
          <div class="card-tags">
            ${(liquor.flavor_tags || []).slice(0, 3).map(tag =>
              `<span class="tag">${escapeHtml(tag)}</span>`
            ).join('')}
          </div>
        </div>
      </article>
    `;
  };

  // 渲染卡片网格
  const renderCardGrid = (liquors, container) => {
    if (!container) return;
    
    cardContainer = container;
    
    if (!liquors || liquors.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="icon-empty"></i>
          <p>暂无符合条件的酒品</p>
        </div>
      `;
      return;
    }

    const html = liquors.map(liquor => createCardHTML(liquor)).join('');
    container.innerHTML = html;

    // 触发入场动画
    requestAnimationFrame(() => {
      const cards = container.querySelectorAll(`.${CONFIG.cardClass}`);
      cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 50}ms`;
        card.classList.add(CONFIG.fadeInClass);
      });
    });
  };

  // 渲染单个卡片（追加）
  const appendCard = (liquor, container) => {
    if (!container || !liquor) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = createCardHTML(liquor);
    const card = wrapper.firstElementChild;
    
    card.classList.add(CONFIG.fadeInClass);
    container.appendChild(card);
  };

  // 渲染雷达图
  const renderRadarChart = (liquor, canvas) => {
    if (!canvas || !liquor) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 雷达图配置
    const config = {
      centerX: canvas.width / 2,
      centerY: canvas.height / 2,
      radius: Math.min(canvas.width, canvas.height) / 2 - 40,
      maxValue: 20,
      labels: ['香气', '酒体', '口感', '余味', '综合'],
      values: [
        liquor.aroma || 0,
        liquor.body || 0,
        liquor.taste || 0,
        liquor.afterglow || 0,
        liquor.score || 0
      ],
      labelColor: '#d8cdb7',
      gridColor: 'rgba(198, 161, 91, 0.15)',
      fillColor: 'rgba(198, 161, 91, 0.25)',
      strokeColor: '#c6a15b',
      animationDuration: 600
    };

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const angleStep = (Math.PI * 2) / config.labels.length;
    let animationProgress = 0;
    const animationStart = performance.now();

    const drawRadar = (progress) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制背景网格
      ctx.strokeStyle = config.gridColor;
      ctx.lineWidth = 1;

      for (let level = 1; level <= 4; level++) {
        const levelRadius = (config.radius / 4) * level;
        ctx.beginPath();
        for (let i = 0; i <= config.labels.length; i++) {
          const angle = i * angleStep - Math.PI / 2;
          const x = config.centerX + Math.cos(angle) * levelRadius;
          const y = config.centerY + Math.sin(angle) * levelRadius;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }

      // 绘制轴线
      ctx.beginPath();
      for (let i = 0; i < config.labels.length; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = config.centerX + Math.cos(angle) * config.radius;
        const y = config.centerY + Math.sin(angle) * config.radius;
        ctx.moveTo(config.centerX, config.centerY);
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 绘制数据填充
      const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      ctx.beginPath();
      for (let i = 0; i < config.values.length; i++) {
        const value = (config.values[i] / config.maxValue) * config.radius * easedProgress;
        const angle = i * angleStep - Math.PI / 2;
        const x = config.centerX + Math.cos(angle) * value;
        const y = config.centerY + Math.sin(angle) * value;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      ctx.fillStyle = config.fillColor;
      ctx.fill();

      ctx.strokeStyle = config.strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制数据点
      for (let i = 0; i < config.values.length; i++) {
        const value = (config.values[i] / config.maxValue) * config.radius * easedProgress;
        const angle = i * angleStep - Math.PI / 2;
        const x = config.centerX + Math.cos(angle) * value;
        const y = config.centerY + Math.sin(angle) * value;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = config.strokeColor;
        ctx.fill();
      }

      // 绘制标签
      ctx.fillStyle = config.labelColor;
      ctx.font = '12px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center';

      for (let i = 0; i < config.labels.length; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = config.radius + 25;
        const x = config.centerX + Math.cos(angle) * labelRadius;
        const y = config.centerY + Math.sin(angle) * labelRadius + 4;
        ctx.fillText(config.labels[i], x, y);
      }
    };

    // 动画循环
    const animate = (timestamp) => {
      animationProgress = (timestamp - animationStart) / config.animationDuration;
      if (animationProgress > 1) animationProgress = 1;

      drawRadar(animationProgress);

      if (animationProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  // 渲染详情弹窗
  const renderDetailModal = (liquor) => {
    if (!liquor) return;

    // 移除已存在的弹窗
    const existingModal = document.querySelector(`.${CONFIG.modalClass}`);
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = CONFIG.modalClass;
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" aria-label="关闭">
          <span>×</span>
        </button>
        
        <div class="modal-body">
          <div class="modal-left">
            <div class="modal-image">
              <img src="${getImageUrl(liquor)}" alt="${liquor.name}" onerror="this.src='/images/placeholder.jpg'" />
            </div>
            
            <div class="modal-info">
              <h2 class="modal-title">${liquor.name}</h2>
              <p class="modal-subtitle">${liquor.ename || ''}</p>
              
              <div class="modal-meta-grid">
                <div class="meta-item">
                  <span class="meta-label">类型</span>
                  <span class="meta-value">${liquor.type || '--'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">产区</span>
                  <span class="meta-value">${liquor.region || '--'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">酒精度</span>
                  <span class="meta-value">${liquor.abv ? `${liquor.abv}%vol` : '--'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">价格</span>
                  <span class="meta-value">${liquor.price ? `¥${liquor.price.toLocaleString()}` : '--'}</span>
                </div>
              </div>
              
              <div class="modal-description">
                <h3>品鉴描述</h3>
                <p>${liquor.description || '暂无描述'}</p>
              </div>
              
              ${liquor.tasting && liquor.tasting.length > 0 ? `
                <div class="modal-tasting">
                  <h3>品鉴步骤</h3>
                  <ul>
                    ${liquor.tasting.map(step => `<li>${step}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              ${liquor.pairing && liquor.pairing.length > 0 ? `
                <div class="modal-pairing">
                  <h3>配餐建议</h3>
                  <div class="pairing-tags">
                    ${liquor.pairing.map(item => `<span class="tag">${item}</span>`).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${liquor.awards && liquor.awards.length > 0 ? `
                <div class="modal-awards">
                  <h3>获奖荣誉</h3>
                  <ul>
                    ${liquor.awards.map(award => `<li>${award}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="modal-right">
            <div class="radar-container">
              <h3>五维评分</h3>
              <canvas class="${CONFIG.radarCanvasClass}" width="300" height="300"></canvas>
            </div>
            
            ${liquor.history ? `
              <div class="modal-history">
                <h3>历史背景</h3>
                <p>${liquor.history}</p>
              </div>
            ` : ''}
            
            ${liquor.brewing ? `
              <div class="modal-brewing">
                <h3>酿造工艺</h3>
                <div class="brewing-details">
                  ${liquor.brewing.method ? `<p><strong>工艺：</strong>${liquor.brewing.method}</p>` : ''}
                  ${liquor.brewing.fermentation_temp ? `<p><strong>发酵温度：</strong>${liquor.brewing.fermentation_temp}</p>` : ''}
                  ${liquor.brewing.fermentation_days ? `<p><strong>发酵天数：</strong>${liquor.brewing.fermentation_days}天</p>` : ''}
                  ${liquor.brewing.water_source ? `<p><strong>水源：</strong>${liquor.brewing.water_source}</p>` : ''}
                </div>
              </div>
            ` : ''}
            
            ${liquor.flavor_tags && liquor.flavor_tags.length > 0 ? `
              <div class="modal-tags">
                <h3>风味标签</h3>
                <div class="tag-cloud">
                  ${liquor.flavor_tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // 绑定关闭事件
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    });

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeBtn.click();
      }
    });

    // ESC 键关闭
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeBtn.click();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    document.body.appendChild(modal);

    // 触发动画
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });

    // 延迟渲染雷达图（等待 DOM 就绪）
    setTimeout(() => {
      const canvas = modal.querySelector(`.${CONFIG.radarCanvasClass}`);
      if (canvas) {
        renderRadarChart(liquor, canvas);
      }
    }, 100);

    return modal;
  };

  // 渲染成就徽章
  const renderAchievements = (achievements) => {
    if (!achievements || achievements.length === 0) {
      return '<p class="no-achievements">暂无成就</p>';
    }

    return achievements.map(achievement => `
      <div class="achievement-card" data-id="${achievement.id}">
        <div class="achievement-card__inner">
          <div class="achievement-card__front">
            <div class="achievement-icon">${achievement.icon || '🏆'}</div>
            <div class="achievement-name">${achievement.name}</div>
          </div>
          <div class="achievement-card__back">
            <div class="achievement-desc">${achievement.description}</div>
            <div class="achievement-date">${achievement.date || ''}</div>
          </div>
        </div>
      </div>
    `).join('');
  };

  // 渲染筛选面板
  const renderFilterPanel = (filters, container) => {
    if (!container) return;

    filterContainer = container;

    const filterHTML = `
      <div class="filter-panel">
        <div class="filter-section">
          <h4 class="filter-title">类型</h4>
          <div class="filter-pills" data-filter="type">
            ${(filters.types || []).map(type => `
              <button class="filter-pill" data-value="${type}">${type}</button>
            `).join('')}
          </div>
        </div>
        
        <div class="filter-section">
          <h4 class="filter-title">产区</h4>
          <div class="filter-pills" data-filter="region">
            ${(filters.regions || []).map(region => `
              <button class="filter-pill" data-value="${region}">${region}</button>
            `).join('')}
          </div>
        </div>
        
        <div class="filter-section">
          <h4 class="filter-title">价格区间</h4>
          <div class="filter-price-range">
            <input type="number" class="price-input" id="price-min" placeholder="最低价" />
            <span class="price-separator">-</span>
            <input type="number" class="price-input" id="price-max" placeholder="最高价" />
          </div>
        </div>
        
        <div class="filter-actions">
          <button class="btn-reset" id="filter-reset">重置筛选</button>
          <button class="btn-apply" id="filter-apply">应用筛选</button>
        </div>
      </div>
    `;

    container.innerHTML = filterHTML;
  };

  // 绑定事件（事件委托）
  const bindEvents = (options = {}) => {
    const { onCardClick, onFilterChange } = options;

    // 卡片点击事件
    document.addEventListener('click', (e) => {
      const card = e.target.closest(`.${CONFIG.cardClass}`);
      if (card && onCardClick) {
        const id = card.dataset.id;
        onCardClick(id);
        return;
      }

      // 筛选标签点击
      const filterPill = e.target.closest('.filter-pill');
      if (filterPill) {
        const pills = filterPill.parentElement.querySelectorAll('.filter-pill');
        pills.forEach(p => p.classList.remove(CONFIG.filterActiveClass));
        filterPill.classList.add(CONFIG.filterActiveClass);

        if (onFilterChange) {
          const filterType = filterPill.closest('[data-filter]')?.dataset.filter;
          onFilterChange(filterType, filterPill.dataset.value);
        }
        return;
      }

      // 重置按钮
      if (e.target.id === 'filter-reset' && onFilterChange) {
        const pills = document.querySelectorAll('.filter-pill');
        pills.forEach(p => p.classList.remove(CONFIG.filterActiveClass));
        const priceInputs = document.querySelectorAll('.price-input');
        priceInputs.forEach(input => input.value = '');
        onFilterChange('reset', null);
        return;
      }

      // 应用筛选按钮
      if (e.target.id === 'filter-apply' && onFilterChange) {
        const minPrice = document.getElementById('price-min')?.value;
        const maxPrice = document.getElementById('price-max')?.value;
        onFilterChange('price', {
          min: minPrice ? parseInt(minPrice) : undefined,
          max: maxPrice ? parseInt(maxPrice) : undefined
        });
        return;
      }
    });

    // 键盘搜索事件（搜索框）
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      let debounceTimer = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (onFilterChange) {
            onFilterChange('search', e.target.value);
          }
        }, 300);
      });
    }
  };

  // 显示加载状态
  const showLoading = (container) => {
    if (!container) return;
    container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    `;
  };

  // 显示错误状态
  const showError = (container, message) => {
    if (!container) return;
    container.innerHTML = `
      <div class="error-state">
        <i class="icon-error"></i>
        <p>${message || '加载失败，请刷新重试'}</p>
        <button class="btn-retry" onclick="location.reload()">重新加载</button>
      </div>
    `;
  };

  // 更新统计信息
  const updateStats = (total, filtered) => {
    const statsEl = document.querySelector('.stats-display');
    if (statsEl) {
      statsEl.innerHTML = `
        <span>共 ${total} 款</span>
        ${filtered !== total ? `<span>，已筛选 ${filtered} 款</span>` : ''}
      `;
    }
  };

  // 公开 API
  return {
    renderCardGrid,
    appendCard,
    createCardHTML,
    renderDetailModal,
    renderRadarChart,
    renderAchievements,
    renderFilterPanel,
    bindEvents,
    showLoading,
    showError,
    updateStats,
    CONFIG
  };
})();

// 全局挂钩（供 index.html 直接调用）
window.UI = UIRenderer;
window.UI.createCard = function(liquor) {
  const el = document.createElement('div');
  el.className = 'liquor-card card-shimmer';
  el.dataset.id = liquor.id;
  el.innerHTML = `
    <div class="card-image-wrap">
      <img src="${liquor.image || '/images/placeholder.jpg'}" alt="${liquor.name}"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect fill=%22%23151310%22 width=%22200%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23c6a15b%22 font-size=%2240%22>🍶</text></svg>'">
      <div class="card-type-badge">${liquor.type}</div>
    </div>
    <div class="card-info">
      <h3 class="card-name">${liquor.name}</h3>
      <p class="card-ename">${liquor.ename || ''}</p>
      <div class="card-meta">
        <span class="card-abv">${liquor.abv}%</span>
        <span class="card-score">★ ${liquor.score || 'N/A'}</span>
        <span class="card-price">¥${liquor.price}</span>
      </div>
    </div>
  `;
  return el;
};
window.UI.openDetail = function(liquor) {
  const modal = document.getElementById('detail-modal');
  const body = document.getElementById('detail-body');
  if (!modal || !body) return;
  modal.classList.add('detail-modal-open');
  body.innerHTML = `
    <div class="detail-layout">
      <div class="detail-left">
        <img src="${liquor.image || '/images/placeholder.jpg'}" alt="${escapeHtml(liquor.name)}" class="detail-image"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect fill=%22%23151310%22 width=%22200%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23c6a15b%22 font-size=%2240%22>🍶</text></svg>'">
        <div class="detail-basic">
          <h2 class="detail-name">${escapeHtml(liquor.name)}</h2>
          <p class="detail-ename">${escapeHtml(liquor.ename || '')}</p>
          <div class="detail-tags">
            <span class="detail-tag">${escapeHtml(liquor.type)}</span>
            <span class="detail-tag">${escapeHtml(String(liquor.abv))}%vol</span>
            <span class="detail-tag">${escapeHtml(liquor.region || '')}</span>
          </div>
          <div class="detail-price">¥${escapeHtml(String(liquor.price))}</div>
        </div>
      </div>
      <div class="detail-right">
        <div class="detail-radar">
          <canvas id="radar-canvas" width="240" height="240"></canvas>
        </div>
        <div class="detail-description">${escapeHtml(liquor.description || '')}</div>
        ${liquor.tasting ? `<div class="detail-section"><h4>品鉴笔记</h4><ul>${liquor.tasting.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>` : ''}
        ${liquor.pairing ? `<div class="detail-section"><h4>配餐建议</h4><p>${escapeHtml(liquor.pairing.join(' / '))}</p></div>` : ''}
        ${liquor.awards && liquor.awards.length ? `<div class="detail-section"><h4>荣誉</h4><ul>${liquor.awards.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul></div>` : ''}
        ${liquor.history ? `<div class="detail-section"><h4>历史背景</h4><p>${escapeHtml(liquor.history.substring(0, 200))}...</p></div>` : ''}
      </div>
    </div>
  `;
  // 绘制雷达图
  setTimeout(() => {
    const canvas = document.getElementById('radar-canvas');
    if (canvas && liquor.aroma !== undefined) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      const cx = w/2, cy = h/2, r = 80;
      const labels = ['香气', '酒体', '口感', '余味', '综合'];
      const values = [liquor.aroma/20*100, liquor.body/20*100, liquor.taste/20*100, liquor.afterglow/20*100, (liquor.score||85)];
      ctx.clearRect(0, 0, w, h);
      // 背景网格
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        for (let j = 0; j <= 5; j++) {
          const angle = (Math.PI * 2 * j / 5) - Math.PI/2;
          const dist = r * i / 5;
          const x = cx + Math.cos(angle) * dist;
          const y = cy + Math.sin(angle) * dist;
          if (i === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(198,161,91,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // 数据填充
      ctx.beginPath();
      values.forEach((v, i) => {
        const angle = (Math.PI * 2 * i / 5) - Math.PI/2;
        const dist = r * v / 100;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(198,161,91,0.4)');
      grad.addColorStop(1, 'rgba(198,161,91,0.05)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#c6a15b';
      ctx.lineWidth = 2;
      ctx.stroke();
      // 标签
      ctx.font = '12px Noto Sans SC';
      ctx.fillStyle = '#d8cdb7';
      ctx.textAlign = 'center';
      values.forEach((v, i) => {
        const angle = (Math.PI * 2 * i / 5) - Math.PI/2;
        const x = cx + Math.cos(angle) * (r + 20);
        const y = cy + Math.sin(angle) * (r + 20);
        ctx.fillText(labels[i], x, y);
      });
    }
  }, 50);
};
window.UI.closeDetail = function() {
  const modal = document.getElementById('detail-modal');
  if (modal) modal.classList.remove('detail-modal-open');
};
window.UI.renderAchievementsPanel = function() {
  const list = document.getElementById('achievements-list');
  if (!list) return;
  const achievements = [
    { id: 'a1', name: '初识佳酿', desc: '浏览第一款酒', icon: '🥃', unlocked: false },
    { id: 'a2', name: '白酒达人', desc: '浏览20款白酒', icon: '🏆', unlocked: false },
    { id: 'a3', name: '威士忌鉴赏家', desc: '浏览10款威士忌', icon: '🥃', unlocked: false },
    { id: 'a4', name: '收藏家', desc: '收藏5款酒', icon: '💎', unlocked: false },
    { id: 'a5', name: '品鉴大师', desc: '查看50款详情', icon: '⭐', unlocked: false },
  ];
  list.innerHTML = achievements.map(a => `
    <div class="achievement-card ${a.unlocked ? 'achievement-unlocked' : 'achievement-locked'}">
      <div class="achievement-icon">${a.icon}</div>
      <div class="achievement-info">
        <h4>${a.name}</h4>
        <p>${a.desc}</p>
      </div>
    </div>
  `).join('');
};
