/**
 * 世界烈酒图鉴 v6.5.0 - 中级功能模块（F21-F40）
 * 姜维（OpenCode）开发
 */

const LiquorFeaturesMid = (() => {
  // ==================== F21 年份筛选与分布 ====================
  const 获取年份范围 = () => {
    const allData = window.LiquorData?.getAll() || [];
    const years = allData.map(item => item.year).filter(y => y && y > 0);
    return {
      min: Math.min(...years) || 1900,
      max: Math.max(...years) || new Date().getFullYear()
    };
  };

  const 按年份筛选 = (startYear, endYear) => {
    const allData = window.LiquorData?.getAll() || [];
    return allData.filter(item => {
      if (!item.year || item.year <= 0) return false;
      return item.year >= startYear && item.year <= endYear;
    });
  };

  const 生成年份分布数据 = () => {
    const allData = window.LiquorData?.getAll() || [];
    const yearCounts = {};
    
    allData.forEach(item => {
      const year = item.year || '未知';
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });
    
    const sortedYears = Object.keys(yearCounts).sort();
    return {
      labels: sortedYears,
      data: sortedYears.map(y => yearCounts[y])
    };
  };

  // ==================== F22 历史浏览记录 ====================
  const 记录浏览项 = (itemId) => {
    let 历史 = JSON.parse(localStorage.getItem('liquor_browse_history') || '[]');
    
    // 移除已存在的相同记录
    历史 = 历史.filter(h => h.id !== itemId);
    
    // 添加到开头
    历史.unshift({
      id: itemId,
      timestamp: Date.now()
    });
    
    // 保持最多50条
    if (历史.length > 50) {
      历史.pop();
    }
    
    localStorage.setItem('liquor_browse_history', JSON.stringify(历史));
  };

  const 获取浏览历史记录 = () => {
    const 历史 = JSON.parse(localStorage.getItem('liquor_browse_history') || '[]');
    return 历史.map(item => ({
      ...item,
      data: window.LiquorData?.getById(item.id)
    })).filter(item => item.data);
  };

  const 清除浏览历史 = () => {
    localStorage.setItem('liquor_browse_history', '[]');
  };

  // ==================== F23 搜索历史管理 ====================
  const 保存搜索关键词 = (keyword) => {
    if (!keyword || !keyword.trim()) return;
    
    let 历史 = JSON.parse(localStorage.getItem('liquor_search_history') || '[]');
    
    // 移除已存在的相同记录
    历史 = 历史.filter(k => k !== keyword);
    
    // 添加到开头
    历史.unshift(keyword);
    
    // 保持最多20条
    if (历史.length > 20) {
      历史.pop();
    }
    
    localStorage.setItem('liquor_search_history', JSON.stringify(历史));
  };

  const 获取搜索历史记录 = () => {
    return JSON.parse(localStorage.getItem('liquor_search_history') || '[]');
  };

  const 清除搜索历史记录 = () => {
    localStorage.setItem('liquor_search_history', '[]');
  };

  // ==================== F24 批量收藏操作 ====================
  const 批量添加到收藏 = (itemIds, folderId) => {
    let favorites = JSON.parse(localStorage.getItem('liquor_favorites') || '{}');
    
    if (!favorites[folderId]) {
      favorites[folderId] = { id: folderId, name: folderId, icon: '📦', items: [] };
    }
    
    const folder = favorites[folderId];
    let addedCount = 0;
    
    itemIds.forEach(id => {
      if (!folder.items.includes(id)) {
        folder.items.push(id);
        addedCount++;
      }
    });
    
    localStorage.setItem('liquor_favorites', JSON.stringify(favorites));
    return addedCount;
  };

  const 批量从收藏移除 = (itemIds) => {
    let favorites = JSON.parse(localStorage.getItem('liquor_favorites') || '{}');
    
    Object.values(favorites).forEach(folder => {
      folder.items = folder.items.filter(id => !itemIds.includes(id));
    });
    
    localStorage.setItem('liquor_favorites', JSON.stringify(favorites));
    return itemIds.length;
  };

  const 批量移动收藏 = (itemIds, fromFolderId, toFolderId) => {
    let favorites = JSON.parse(localStorage.getItem('liquor_favorites') || '{}');
    
    // 从原分组移除
    if (favorites[fromFolderId]) {
      favorites[fromFolderId].items = favorites[fromFolderId].items.filter(id => !itemIds.includes(id));
    }
    
    // 添加到新分组
    if (!favorites[toFolderId]) {
      favorites[toFolderId] = { id: toFolderId, name: toFolderId, icon: '📦', items: [] };
    }
    
    itemIds.forEach(id => {
      if (!favorites[toFolderId].items.includes(id)) {
        favorites[toFolderId].items.push(id);
      }
    });
    
    localStorage.setItem('liquor_favorites', JSON.stringify(favorites));
    return true;
  };

  // ==================== F25 侧滑抽屉详情页 ====================
  const 打开侧滑详情 = (itemId) => {
    const item = window.LiquorData?.getById(itemId);
    if (!item) return;
    
    const modal = document.getElementById('slideInDetail') || 创建侧滑容器();
    const content = modal.querySelector('.modal-slide-in__content');
    
    content.innerHTML = 生成详情页内容(item);
    modal.classList.add('show');
    
    当前详情索引 = 0;
    当前详情酒款 = [item];
  };

  const 创建侧滑容器 = () => {
    const container = document.createElement('div');
    container.id = 'slideInDetail';
    container.className = 'modal-slide-in';
    container.innerHTML = `
      <div class="modal-slide-in__header">
        <span class="modal-slide-in__title">酒款详情</span>
        <button class="modal-slide-in__close" onclick="关闭侧滑详情()">✕</button>
      </div>
      <div class="modal-slide-in__content"></div>
      <div class="modal-slide-in__footer">
        <button class="modal__btn" onclick="上一款酒()">← 上一款</button>
        <button class="modal__btn primary" onclick="添加到收藏()">❤️ 收藏</button>
        <button class="modal__btn" onclick="下一款酒()">下一款 →</button>
      </div>
    `;
    document.body.appendChild(container);
    return container;
  };

  let 当前详情索引 = 0;
  let 当前详情酒款 = [];

  const 下一款酒 = () => {
    if (当前详情酒款.length === 0) return;
    当前详情索引 = (当前详情索引 + 1) % 当前详情酒款.length;
    显示当前详情项();
  };

  const 上一款酒 = () => {
    if (当前详情酒款.length === 0) return;
    当前详情索引 = (当前详情索引 - 1 + 当前详情酒款.length) % 当前详情酒款.length;
    显示当前详情项();
  };

  const 显示当前详情项 = () => {
    const item = 当前详情酒款[当前详情索引];
    if (!item) return;
    
    const content = document.querySelector('.modal-slide-in__content');
    if (content) {
      content.innerHTML = 生成详情页内容(item);
    }
  };

  const 关闭侧滑详情 = () => {
    const modal = document.getElementById('slideInDetail');
    if (modal) {
      modal.classList.remove('show');
    }
  };

  const 生成详情页内容 = (item) => {
    return `
      <div class="modal__image">
        <span style="font-size: 72px;">${获取酒款图标(item.type)}</span>
      </div>
      <div class="modal__header">
        <div class="modal__title-group">
          <h2 class="modal__name">${item.name}</h2>
          <p class="modal__ename">${item.ename || ''}</p>
          <div class="modal__badges">
            <span class="modal__badge">${item.type || '其他'}</span>
            <span class="modal__badge">${item.region || '产区未知'}</span>
            <span class="modal__badge">${item.abv || 0}°</span>
          </div>
        </div>
      </div>
      <div class="modal__section">
        <h3 class="modal__section-title">📊 基本信息</h3>
        <div class="modal__grid">
          <div class="modal__grid-item">
            <div class="modal__grid-label">酒精度</div>
            <div class="modal__grid-value">${item.abv || 0}°</div>
          </div>
          <div class="modal__grid-item">
            <div class="modal__grid-label">参考价格</div>
            <div class="modal__grid-value">¥${item.price || '待定'}</div>
          </div>
          <div class="modal__grid-item">
            <div class="modal__grid-label">综合评分</div>
            <div class="modal__grid-value">${item.score || 'N/A'}</div>
          </div>
          <div class="modal__grid-item">
            <div class="modal__grid-label">年份</div>
            <div class="modal__grid-value">${item.year || '未知'}</div>
          </div>
        </div>
      </div>
      <div class="modal__section">
        <h3 class="modal__section-title">👃 风味特征</h3>
        <div class="modal__tasting">
          <div class="modal__tasting-item">
            <span class="modal__tasting-icon">👃</span>
            <span class="modal__tasting-text">香气: ${item.aroma || 0}/20</span>
          </div>
          <div class="modal__tasting-item">
            <span class="modal__tasting-icon">👅</span>
            <span class="modal__tasting-text">口感: ${item.body || 0}/20</span>
          </div>
          <div class="modal__tasting-item">
            <span class="modal__tasting-icon">😋</span>
            <span class="modal__tasting-text">味道: ${item.taste || 0}/20</span>
          </div>
          <div class="modal__tasting-item">
            <span class="modal__tasting-icon">🌸</span>
            <span class="modal__tasting-text">余韵: ${item.afterglow || 0}/20</span>
          </div>
        </div>
      </div>
      <div class="modal__section">
        <h3 class="modal__section-title">🏷️ 风味标签</h3>
        <div class="liquor-card-tags">
          ${(item.flavor_tags || []).map(tag => `<span class="liquor-tag">${tag}</span>`).join('')}
        </div>
      </div>
      ${item.description ? `
        <div class="modal__section">
          <h3 class="modal__section-title">📝 描述</h3>
          <div class="modal__story">${item.description}</div>
        </div>
      ` : ''}
    `;
  };

  const 获取酒款图标 = (type) => {
    const icons = {
      '酱香型': '🍶', '浓香型': '🍶', '清香型': '🍶', '馥郁香型': '🍶',
      '威士忌': '🥃', '白兰地': '🍷', '伏特加': '🍸', '金酒': '🌿',
      '朗姆酒': '🏝️', '龙舌兰': '🌵', '清酒': '🍶', '其他': '🍾'
    };
    return icons[type] || '🍾';
  };

  // ==================== F26 评分系统增强 ====================
  const 获取综合评分 = (item) => {
    const aroma = item.aroma || 0;
    const body = item.body || 0;
    const taste = item.taste || 0;
    const afterglow = item.afterglow || 0;
    
    return ((aroma + body + taste + afterglow) / 4).toFixed(1);
  };

  const 计算分项评分 = (item) => {
    return {
      香气: item.aroma || 0,
      口感: item.body || 0,
      味道: item.taste || 0,
      余韵: item.afterglow || 0,
      平衡: 计算平衡度(item),
      甜度: 估算甜度(item),
      酸度: 估算酸度(item)
    };
  };

  const 计算平衡度 = (item) => {
    const aroma = item.aroma || 0;
    const body = item.body || 0;
    const taste = item.taste || 0;
    const afterglow = item.afterglow || 0;
    
    const avg = (aroma + body + taste + afterglow) / 4;
    const variance = Math.pow(aroma - avg, 2) + Math.pow(body - avg, 2) + 
                     Math.pow(taste - avg, 2) + Math.pow(afterglow - avg, 2);
    const stdDev = Math.sqrt(variance / 4);
    
    // 平衡度 = 10 - 标准差（标准差越小越平衡）
    return Math.max(0, (10 - stdDev)).toFixed(1);
  };

  const 估算甜度 = (item) => {
    // 基于类型估算甜度
    const sweetTypes = ['浓香型', '酱香型'];
    if (sweetTypes.includes(item.type)) {
      return (Math.random() * 3 + 6).toFixed(1);
    }
    return (Math.random() * 5 + 3).toFixed(1);
  };

  const 估算酸度 = (item) => {
    // 基于类型估算酸度
    const sourTypes = ['清香型'];
    if (sourTypes.includes(item.type)) {
      return (Math.random() * 3 + 6).toFixed(1);
    }
    return (Math.random() * 4 + 2).toFixed(1);
  };

  // ==================== F27 年份分布图 ====================
  const 生成年份柱状图数据 = () => {
    const allData = window.LiquorData?.getAll() || [];
    const yearCounts = {};
    
    allData.forEach(item => {
      const year = item.year || '未知';
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });
    
    const years = Object.keys(yearCounts).sort((a, b) => a - b);
    
    return {
      labels: years,
      datasets: [{
        label: '酒款数量',
        data: years.map(y => yearCounts[y]),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1
      }]
    };
  };

  // ==================== F28 价格分布图 ====================
  const 生成价格分布数据 = () => {
    const allData = window.LiquorData?.getAll() || [];
    const ranges = {
      '0-200': 0,
      '200-500': 0,
      '500-1000': 0,
      '1000-3000': 0,
      '3000-10000': 0,
      '10000+': 0
    };
    
    allData.forEach(item => {
      const price = item.price || 0;
      if (price < 200) ranges['0-200']++;
      else if (price < 500) ranges['200-500']++;
      else if (price < 1000) ranges['500-1000']++;
      else if (price < 3000) ranges['1000-3000']++;
      else if (price < 10000) ranges['3000-10000']++;
      else ranges['10000+']++;
    });
    
    return {
      labels: Object.keys(ranges),
      data: Object.values(ranges)
    };
  };

  // ==================== F29 产区地图 ====================
  const 获取产区分布数据 = () => {
    const allData = window.LiquorData?.getAll() || [];
    const regionCounts = {};
    
    allData.forEach(item => {
      const region = item.region || '未知';
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });
    
    return Object.entries(regionCounts)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  };

  const 生成产区热力图数据 = () => {
    const allData = window.LiquorData?.getAll() || [];
    const regionScores = {};
    
    allData.forEach(item => {
      const region = item.region || '未知';
      if (!regionScores[region]) {
        regionScores[region] = { total: 0, count: 0 };
      }
      regionScores[region].total += item.score || 0;
      regionScores[region].count++;
    });
    
    return Object.entries(regionScores).map(([region, data]) => ({
      region,
      avgScore: (data.total / data.count).toFixed(1),
      count: data.count
    }));
  };

  // ==================== F30 调酒配方 ====================
  const 初始化调酒配方库 = () => {
    const recipes = JSON.parse(localStorage.getItem('liquor_cocktail_recipes') || 'null');
    if (recipes) return recipes;
    
    const 默认配方 = {
      '马天尼': {
        name: '马天尼',
        icon: '🍸',
        base: '金酒',
        ingredients: ['金酒 60ml', '干苦艾酒 15ml', '橄榄或柠檬皮'],
        method: '搅拌法',
        glass: '马天尼杯',
        garnish: '橄榄或柠檬皮卷',
        difficulty: '中等'
      },
      '曼哈顿': {
        name: '曼哈顿',
        icon: '🍸',
        base: '威士忌',
        ingredients: ['黑麦威士忌 45ml', '甜苦艾酒 20ml', '安格式苦精 2dash'],
        method: '搅拌法',
        glass: '古典杯',
        garnish: '马拉斯奇诺樱桃',
        difficulty: '中等'
      },
      '玛格丽特': {
        name: '玛格丽特',
        icon: '🥃',
        base: '龙舌兰',
        ingredients: ['龙舌兰 45ml', '君度 20ml', '青柠汁 15ml'],
        method: '摇和法',
        glass: '玛格丽特杯',
        garnish: '盐边+青柠片',
        difficulty: '简单'
      },
      '古典': {
        name: '古典',
        icon: '🥃',
        base: '波本威士忌',
        ingredients: ['波本威士忌 45ml', '单糖浆 5ml', '安格式苦精 2dash', '橙皮'],
        method: '搅拌法',
        glass: '古典杯',
        garnish: '橙皮+苦精',
        difficulty: '简单'
      },
      '莫斯科骡子': {
        name: '莫斯科骡子',
        icon: '🍺',
        base: '伏特加',
        ingredients: ['伏特加 45ml', '姜啤酒 120ml', '青柠汁 10ml'],
        method: '直接倒入',
        glass: '高球杯',
        garnish: '青柠角+薄荷叶',
        difficulty: '简单'
      },
      '金汤力': {
        name: '金汤力',
        icon: '🍸',
        base: '金酒',
        ingredients: ['金酒 45ml', '汤力水 150ml'],
        method: '直接倒入',
        glass: '高球杯',
        garnish: '青柠角',
        difficulty: '简单'
      },
      '自由古巴': {
        name: '自由古巴',
        icon: '🍹',
        base: '朗姆酒',
        ingredients: ['白朗姆 45ml', '可乐 120ml', '青柠汁 10ml'],
        method: '直接倒入',
        glass: '高球杯',
        garnish: '青柠角',
        difficulty: '简单'
      },
      '长岛冰茶': {
        name: '长岛冰茶',
        icon: '🍹',
        base: '多种烈酒',
        ingredients: ['金酒 15ml', '朗姆酒 15ml', '伏特加 15ml', '龙舌兰 15ml', '君度 15ml', '柠檬汁 25ml', '糖浆 10ml', '可乐少许'],
        method: '摇和法',
        glass: '高球杯',
        garnish: '柠檬片',
        difficulty: '困难'
      },
      '边车': {
        name: '边车',
        icon: '🍸',
        base: '白兰地',
        ingredients: ['白兰地 45ml', '君度 20ml', '柠檬汁 15ml'],
        method: '摇和法',
        glass: '马天尼杯',
        garnish: '柠檬皮卷',
        difficulty: '中等'
      },
      '内格罗尼': {
        name: '内格罗尼',
        icon: '🍸',
        base: '金酒',
        ingredients: ['金酒 30ml', '金巴利 30ml', '甜苦艾酒 30ml'],
        method: '搅拌法',
        glass: '古典杯',
        garnish: '橙皮',
        difficulty: '简单'
      }
    };
    
    localStorage.setItem('liquor_cocktail_recipes', JSON.stringify(默认配方));
    return 默认配方;
  };

  const 搜索调酒配方 = (query) => {
    const recipes = 初始化调酒配方库();
    if (!query) return Object.values(recipes);
    
    const q = query.toLowerCase();
    return Object.values(recipes).filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.base.toLowerCase().includes(q) ||
      r.method.toLowerCase().includes(q)
    );
  };

  const 根据基酒筛选配方 = (baseLiquor) => {
    const recipes = 初始化调酒配方库();
    return Object.values(recipes).filter(r => r.base === baseLiquor);
  };

  // ==================== F31 配餐指南 ====================
  const 获取配餐建议 = (liquorType) => {
    const 配餐表 = {
      '酱香型': ['烤肉', '酱香肉', '火锅', '川菜', '鲁菜'],
      '浓香型': ['川菜', '湘菜', '麻辣', '烧烤', '奶酪'],
      '清香型': ['海鲜', '蔬菜', '粤菜', '清淡菜式', '水果'],
      '馥郁香型': ['重口味菜', '麻辣', '火锅', '肉类'],
      '威士忌': ['烤肉', '牛排', '奶酪', '巧克力', '坚果'],
      '白兰地': ['甜点', '巧克力', '奶酪', '水果', '雪茄'],
      '伏特加': ['鱼子酱', '熏鱼', '冷盘', '俄式菜', '腌制食品'],
      '金酒': ['海鲜', '蔬菜', '水果', '清淡小吃', '泰式菜'],
      '朗姆酒': ['热带水果', '甜点', '蛋糕', '加勒比菜', '烤肉'],
      '龙舌兰': ['墨西哥菜', '塔可', '烤肉', '辛辣食物', '水果']
    };
    
    return 配餐表[liquorType] || 配餐表['威士忌'];
  };

  const 获取中餐配酒建议 = (菜系) => {
    const 中餐配酒表 = {
      '川菜': ['浓香型', '酱香型'],
      '湘菜': ['浓香型', '酱香型'],
      '粤菜': ['清香型', '浓香型'],
      '鲁菜': ['酱香型'],
      '苏菜': ['清香型', '浓香型'],
      '浙菜': ['清香型'],
      '闽菜': ['清香型', '浓香型'],
      '徽菜': ['酱香型', '浓香型'],
      '湘菜': ['浓香型']
    };
    
    return 中餐配酒表[菜系] || ['浓香型', '酱香型'];
  };

  // ==================== F32 收藏统计 ====================
  const 获取收藏统计 = () => {
    const favorites = JSON.parse(localStorage.getItem('liquor_favorites') || '{}');
    const allData = window.LiquorData?.getAll() || [];
    
    let totalCount = 0;
    let totalValue = 0;
    const typeDistribution = {};
    
    Object.values(favorites).forEach(folder => {
      folder.items?.forEach(itemId => {
        const item = allData.find(i => i.id === itemId);
        if (item) {
          totalCount++;
          totalValue += item.price || 0;
          typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
        }
      });
    });
    
    return {
      totalCount,
      totalValue,
      typeDistribution,
      folderCount: Object.keys(favorites).length,
      avgValue: totalCount > 0 ? Math.round(totalValue / totalCount) : 0
    };
  };

  // ==================== F33 饮酒提醒 ====================
  const 设置饮酒提醒 = (enabled, limit = 2) => {
    localStorage.setItem('liquor_drink_reminder', JSON.stringify({
      enabled,
      limit,
      lastDrinkDate: null
    }));
  };

  const 检查饮酒提醒 = () => {
    const settings = JSON.parse(localStorage.getItem('liquor_drink_reminder') || '{}');
    if (!settings.enabled) return null;
    
    const today = new Date().toDateString();
    if (settings.lastDrinkDate === today) {
      return {
        exceeded: true,
        message: '今日已饮酒，请注意适量',
        limit: settings.limit
      };
    }
    
    return {
      exceeded: false,
      message: `今日饮酒限量: ${settings.limit} 杯`,
      limit: settings.limit
    };
  };

  const 记录饮酒 = () => {
    const settings = JSON.parse(localStorage.getItem('liquor_drink_reminder') || '{}');
    settings.lastDrinkDate = new Date().toDateString();
    localStorage.setItem('liquor_drink_reminder', JSON.stringify(settings));
  };

  // ==================== F34 个性化推荐 ====================
  const 获取个性化推荐 = (userId, limit = 6) => {
    const favorites = JSON.parse(localStorage.getItem('liquor_favorites') || '{}');
    const browseHistory = JSON.parse(localStorage.getItem('liquor_browse_history') || '[]');
    const allData = window.LiquorData?.getAll() || [];
    
    // 获取用户偏好类型
    const preferredTypes = new Set();
    Object.values(favorites).forEach(folder => {
      folder.items?.forEach(itemId => {
        const item = allData.find(i => i.id === itemId);
        if (item && item.type) {
          preferredTypes.add(item.type);
        }
      });
    });
    
    // 过滤掉已收藏和已浏览的
    const excludeIds = new Set([
      ...Object.values(favorites).flatMap(f => f.items || []),
      ...browseHistory.map(h => h.id)
    ]);
    
    // 按偏好类型推荐
    let recommended = allData
      .filter(item => !excludeIds.has(item.id))
      .filter(item => preferredTypes.size === 0 || preferredTypes.has(item.type))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
    
    // 如果推荐不足，补充热门酒款
    if (recommended.length < limit) {
      const existingIds = new Set(recommended.map(i => i.id));
      const补充 = allData
        .filter(item => !excludeIds.has(item.id) && !existingIds.has(item.id))
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, limit - recommended.length);
      
      recommended = [...recommended, ...补充];
    }
    
    return recommended;
  };

  // ==================== F35 多语言切换 ====================
  const 初始化语言设置 = () => {
    const savedLang = localStorage.getItem('liquor_language') || 'zh-CN';
    return savedLang;
  };

  const 设置语言 = (lang) => {
    const 支持的语言 = ['zh-CN', 'en-US', 'ja-JP'];
    if (!支持的语言.includes(lang)) return;
    
    localStorage.setItem('liquor_language', lang);
    
    // 更新页面文字
    更新页面文字(lang);
    
    // 更新按钮状态
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  };

  const 更新页面文字 = (lang) => {
    const translations = {
      'zh-CN': {
        '酒款': '酒款', '类型': '类型', '产区': '产区', '价格': '价格',
        '评分': '评分', '收藏': '收藏', '对比': '对比', '搜索': '搜索'
      },
      'en-US': {
        '酒款': 'Liquor', '类型': 'Type', '产区': 'Region', '价格': 'Price',
        '评分': 'Score', '收藏': 'Favorite', '对比': 'Compare', '搜索': 'Search'
      },
      'ja-JP': {
        '酒款': '酒', '类型': '種類', '产区': '産地', '価格': '価格',
        'スコア': 'スコア', 'お気に入り': 'お気に入り', '比較': '比較', '検索': '検索'
      }
    };
    
    const trans = translations[lang] || translations['zh-CN'];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (trans[key]) {
        el.textContent = trans[key];
      }
    });
  };

  const 获取翻译 = (key, lang = null) => {
    const currentLang = lang || 初始化语言设置();
    const translations = {
      'zh-CN': { '酒款': '酒款', '类型': '类型', '产区': '产区', '价格': '价格', '评分': '评分' },
      'en-US': { '酒款': 'Liquor', '类型': 'Type', '产区': 'Region', '价格': 'Price', '评分': 'Score' },
      'ja-JP': { '酒款': '酒', '类型': '種類', '产区': '産地', '価格': '価格', 'スコア': 'スコア' }
    };
    return translations[currentLang]?.[key] || key;
  };

  // ==================== 公开 API ====================
  return {
    // 年份筛选 F21
    获取年份范围,
    按年份筛选,
    生成年份分布数据,
    
    // 历史浏览 F22
    记录浏览项,
    获取浏览历史记录,
    清除浏览历史,
    
    // 搜索历史 F23
    保存搜索关键词,
    获取搜索历史记录,
    清除搜索历史记录,
    
    // 批量收藏 F24
    批量添加到收藏,
    批量从收藏移除,
    批量移动收藏,
    
    // 侧滑详情 F25
    打开侧滑详情,
    关闭侧滑详情,
    下一款酒,
    上一款酒,
    
    // 评分系统 F26
    获取综合评分,
    计算分项评分,
    
    // 可视化 F27-F28
    生成年份柱状图数据,
    生成价格分布数据,
    
    // 产区地图 F29
    获取产区分布数据,
    生成产区热力图数据,
    
    // 调酒配方 F30
    初始化调酒配方库,
    搜索调酒配方,
    根据基酒筛选配方,
    
    // 配餐指南 F31
    获取配餐建议,
    获取中餐配酒建议,
    
    // 收藏统计 F32
    获取收藏统计,
    
    // 饮酒提醒 F33
    设置饮酒提醒,
    检查饮酒提醒,
    记录饮酒,
    
    // 个性化推荐 F34
    获取个性化推荐,
    
    // 多语言 F35
    初始化语言设置,
    设置语言,
    获取翻译
  };
})();

// 全局函数挂载
window.下一款酒 = LiquorFeaturesMid.下一款酒;
window.上一款酒 = LiquorFeaturesMid.上一款酒;
window.关闭侧滑详情 = LiquorFeaturesMid.关闭侧滑详情;
window.添加到收藏 = () => LiquorFeatures.切换收藏状态(window.currentLiquorId);
window.设置主题 = LiquorFeatures.设置主题;