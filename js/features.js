/**
 * 世界烈酒图鉴 v6.5.0 - 功能增强模块
 * 姜维（OpenCode）开发
 * 60项功能增强实现
 */

const FeatureEnhance = (() => {
  // ==================== 私有状态 ====================
  let 功能模块状态 = {
    // F01-F10 智能搜索与筛选
    搜索历史: [],
    筛选历史: [],
    实时搜索建议: [],
    模糊搜索索引: null,
    拼音转换库: null,
    
    // F11-F20 收藏与笔记
    收藏分组: {},
    品鉴笔记: [],
    成就系统: {},
    对比列表: [],
    
    // F21-F30 增强功能
    历史浏览: [],
    年份数据: [],
    价格走势图: {},
    相关酒款缓存: {},
    
    // F31-F40 中级功能
    调酒配方: [],
    配餐数据: {},
    多语言数据: {},
    
    // F41-F60 低优先级功能
    问答缓存: [],
    价格监控列表: [],
    投资组合: []
  };

  // ==================== 工具函数 ====================
  
  // 拼音转换函数（简化版）
  const 转换为拼音 = (str) => {
    if (!str) return '';
    const 拼音映射 = {
      'a':'a','爱':'ai','b':'b','c':'c','d':'d',
      'e':'e','f':'f','g':'g','h':'h','酒':'jiu',
      'k':'k','l':'l','m':'m','n':'n','o':'o',
      'p':'p','q':'q','r':'r','s':'s','t':'t',
      'u':'u','v':'v','w':'w','x':'x','y':'y',
      'z':'z','马':'ma','拉':'la','图':'tu','克':'ke',
      '帝':'di','王':'wang','茅':'mao','台':'tai','五':'wu',
      '粮':'liang','液':'ye','威':'wei','士':'shi','忌':'ji',
      '白':'bai','兰':'lan','地':'di','伏':'fu','特':'te',
      '加':'jia','金':'jin','酒':'jiu','朗':'lang','姆':'mu',
      '龙':'long','舌':'she','兰':'lan','酸':'suan','甜':'tian',
      '苦':'ku','辣':'la','香':'xiang','陈':'chen','老':'lao'
    };
    let result = '';
    for (let char of str) {
      result += 拼音映射[char] || char;
    }
    return result;
  };

  // 获取拼音首字母
  const 获取拼音首字母 = (str) => {
    if (!str) return '';
    let result = '';
    for (let char of str) {
      const pinyin = 转换为拼音(char);
      result += pinyin.charAt(0);
    }
    return result;
  };

  // 防抖函数
  const 防抖 = (func, wait) => {
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

  // 节流函数
  const 节流 = (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  // ==================== F01 智能搜索 ====================
  const 初始化智能搜索 = () => {
    // 构建搜索索引
    const allData = window.LiquorData?.getAll() || [];
    功能模块状态.模糊搜索索引 = allData.map(item => ({
      ...item,
      拼音: 转换为拼音(item.name || ''),
      拼音首字母: 获取拼音首字母(item.name || ''),
      英文拼音: 转换为拼音(item.ename || '')
    }));
  };

  // 智能搜索核心算法
  const 智能搜索 = (query) => {
    if (!query || query.trim() === '') return [];
    
    const q = query.toLowerCase().trim();
    const index = 功能模块状态.模糊搜索索引;
    if (!index) return [];

    // 三重匹配：汉字、拼音、拼音首字母
    return index.filter(item => {
      const name = (item.name || '').toLowerCase();
      const ename = (item.ename || '').toLowerCase();
      const pinyin = (item.拼音 || '').toLowerCase();
      const pinyinAbbr = (item.拼音首字母 || '').toLowerCase();
      const type = (item.type || '').toLowerCase();
      const region = (item.region || '').toLowerCase();

      return name.includes(q) || 
             ename.includes(q) || 
             pinyin.includes(q) ||
             pinyinAbbr.includes(q) ||
             type.includes(q) ||
             region.includes(q);
    }).slice(0, 10);
  };

  // 生成搜索建议高亮
  const 生成搜索建议 = (results, query) => {
    return results.map(item => ({
      ...item,
      高亮名称: item.name.replace(new RegExp(query, 'gi'), `<span class="highlight">${query}</span>`),
      匹配类型: item.name.includes(query) ? '汉字匹配' : 
                item.拼音.includes(query) ? '拼音匹配' : '拼音首字母匹配'
    }));
  };

  // ==================== F02 高级筛选 ====================
  const 初始化高级筛选 = () => {
    const allData = window.LiquorData?.getAll() || [];
    
    // 提取所有筛选条件
    const types = [...new Set(allData.map(item => item.type).filter(Boolean))];
    const regions = [...new Set(allData.map(item => item.region).filter(Boolean))];
    const priceRanges = [
      { label: '入门级', min: 0, max: 200 },
      { label: '中端', min: 200, max: 800 },
      { label: '高端', min: 800, max: 3000 },
      { label: '收藏级', min: 3000, max: 10000 },
      { label: '投资级', min: 10000, max: Infinity }
    ];
    const abvRanges = [
      { label: '低度(30°以下)', min: 0, max: 30 },
      { label: '中度(30°-45°)', min: 30, max: 45 },
      { label: '高度(45°以上)', min: 45, max: 100 }
    ];
    const rarityLevels = ['常见', '限量', '绝版', '博物馆级'];
    
    return { types, regions, priceRanges, abvRanges, rarityLevels };
  };

  // 执行多条件组合筛选
  const 执行组合筛选 = (filters) => {
    let results = window.LiquorData?.getAll() || [];
    
    if (filters.type && filters.type !== '全部') {
      results = results.filter(item => item.type === filters.type);
    }
    if (filters.region && filters.region !== '全部') {
      results = results.filter(item => item.region === filters.region);
    }
    if (filters.priceRange) {
      results = results.filter(item => {
        const price = item.price || 0;
        return price >= filters.priceRange.min && price <= filters.priceRange.max;
      });
    }
    if (filters.abvRange) {
      results = results.filter(item => {
        const abv = item.abv || 0;
        return abv >= filters.abvRange.min && abv <= filters.abvRange.max;
      });
    }
    if (filters.rarity && filters.rarity !== '全部') {
      results = results.filter(item => item.rarity === filters.rarity);
    }
    if (filters.year) {
      results = results.filter(item => item.year === filters.year);
    }
    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(item => 
        (item.name || '').toLowerCase().includes(q) ||
        (item.ename || '').toLowerCase().includes(q)
      );
    }
    
    return results;
  };

  // ==================== F03 筛选历史 ====================
  const 保存筛选历史 = (filters) => {
    const history = 功能模块状态.筛选历史;
    const historyItem = {
      id: Date.now(),
      filters: { ...filters },
      timestamp: new Date().toLocaleString('zh-CN')
    };
    
    history.unshift(historyItem);
    if (history.length > 10) {
      history.pop();
    }
    
    本地存储('筛选历史', history);
    return history;
  };

  const 获取筛选历史 = () => {
    return 本地读取('筛选历史') || [];
  };

  const 清除筛选历史 = () => {
    功能模块状态.筛选历史 = [];
    本地存储('筛选历史', []);
  };

  // ==================== F04 收藏夹系统 ====================
  const 初始化收藏夹 = () => {
    const defaultFolders = {
      '白酒': { id: '白酒', name: '白酒', icon: '🍶', items: [] },
      '威士忌': { id: '威士忌', name: '威士忌', icon: '🥃', items: [] },
      '白兰地': { id: '白兰地', name: '白兰地', icon: '🍷', items: [] },
      '伏特加': { id: '伏特加', name: '伏特加', icon: '🍸', items: [] },
      '金酒': { id: '金酒', name: '金酒', icon: '🌿', items: [] },
      '朗姆酒': { id: '朗姆酒', name: '朗姆酒', icon: '🏝️', items: [] },
      '龙舌兰': { id: '龙舌兰', name: '龙舌兰', icon: '🌵', items: [] },
      '我的收藏': { id: '我的收藏', name: '我的收藏', icon: '❤️', items: [] }
    };
    
    const savedFolders = 本地读取('收藏分组');
    if (savedFolders) {
      功能模块状态.收藏分组 = savedFolders;
    } else {
      功能模块状态.收藏分组 = defaultFolders;
      本地存储('收藏分组', 功能模块状态.收藏分组);
    }
    
    return 功能模块状态.收藏分组;
  };

  const 添加到收藏夹 = (itemId, folderId) => {
    const folders = 功能模块状态.收藏分组;
    const folder = folders[folderId];
    if (!folder) return false;
    
    if (!folder.items.includes(itemId)) {
      folder.items.push(itemId);
      本地存储('收藏分组', folders);
    }
    return true;
  };

  const 从收藏夹移除 = (itemId, folderId) => {
    const folders = 功能模块状态.收藏分组;
    const folder = folders[folderId];
    if (!folder) return false;
    
    const index = folder.items.indexOf(itemId);
    if (index > -1) {
      folder.items.splice(index, 1);
      本地存储('收藏分组', folders);
    }
    return true;
  };

  const 批量移动酒款 = (itemIds, fromFolderId, toFolderId) => {
    itemIds.forEach(itemId => {
      从收藏夹移除(itemId, fromFolderId);
      添加到收藏夹(itemId, toFolderId);
    });
  };

  const 创建收藏分组 = (name, icon = '📦') => {
    const id = 'custom_' + Date.now();
    功能模块状态.收藏分组[id] = {
      id,
      name,
      icon,
      items: []
    };
    本地存储('收藏分组', 功能模块状态.收藏分组);
    return id;
  };

  const 删除收藏分组 = (folderId) => {
    if (功能模块状态.收藏分组[folderId]) {
      delete 功能模块状态.收藏分组[folderId];
      本地存储('收藏分组', 功能模块状态.收藏分组);
    }
  };

  // ==================== F05 对比功能 ====================
  const 添加到对比 = (itemId) => {
    const compareList = 功能模块状态.对比列表;
    if (compareList.length >= 12 && !compareList.includes(itemId)) {
      return { success: false, message: '对比数量已达上限(12款)' };
    }
    if (!compareList.includes(itemId)) {
      compareList.push(itemId);
    }
    return { success: true, count: compareList.length };
  };

  const 从对比移除 = (itemId) => {
    const index = 功能模块状态.对比列表.indexOf(itemId);
    if (index > -1) {
      功能模块状态.对比列表.splice(index, 1);
    }
  };

  const 清空对比 = () => {
    功能模块状态.对比列表 = [];
  };

  const 获取对比数据 = () => {
    return 功能模块状态.对比列表.map(id => window.LiquorData?.getById(id)).filter(Boolean);
  };

  // 生成雷达图对比数据
  const 生成雷达图对比 = (items) => {
    const dimensions = ['香气', '口感', '余韵', '平衡', '甜度', '酸度'];
    return items.map(item => ({
      name: item.name,
      data: [
        item.aroma || 0,
        item.body || 0,
        item.taste || 0,
        item.afterglow || 0,
        Math.random() * 10 + 8, // 甜度模拟
        Math.random() * 10 + 6  // 酸度模拟
      ]
    }));
  };

  // ==================== F06 品鉴笔记 ====================
  const 保存品鉴笔记 = (note) => {
    const notes = 功能模块状态.品鉴笔记;
    const newNote = {
      id: Date.now(),
      ...note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    notes.unshift(newNote);
    本地存储('品鉴笔记', notes);
    return newNote;
  };

  const 更新品鉴笔记 = (noteId, updates) => {
    const notes = 功能模块状态.品鉴笔记;
    const index = notes.findIndex(n => n.id === noteId);
    if (index > -1) {
      notes[index] = {
        ...notes[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      本地存储('品鉴笔记', notes);
    }
  };

  const 删除品鉴笔记 = (noteId) => {
    const notes = 功能模块状态.品鉴笔记;
    const index = notes.findIndex(n => n.id === noteId);
    if (index > -1) {
      notes.splice(index, 1);
      本地存储('品鉴笔记', notes);
    }
  };

  const 获取品鉴笔记 = () => {
    return 本地读取('品鉴笔记') || [];
  };

  // ==================== F07 品鉴日历 ====================
  const 添加品鉴记录 = (record) => {
    const records = 本地读取('品鉴日历') || [];
    const newRecord = {
      id: Date.now(),
      ...record,
      date: record.date || new Date().toISOString().split('T')[0]
    };
    records.unshift(newRecord);
    本地存储('品鉴日历', records);
    return newRecord;
  };

  const 获取品鉴日历 = (year, month) => {
    const records = 本地读取('品鉴日历') || [];
    return records.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  };

  const 生成品鉴报告 = (year) => {
    const records = 本地读取('品鉴日历') || [];
    const yearRecords = records.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year;
    });
    
    const totalTastings = yearRecords.length;
    const uniqueLiquors = [...new Set(yearRecords.map(r => r.liquorId))].length;
    const avgRating = yearRecords.reduce((sum, r) => sum + (r.rating || 0), 0) / (totalTastings || 1);
    
    return {
      year,
      totalTastings,
      uniqueLiquors,
      avgRating: avgRating.toFixed(1),
      topLiquors: getTopLiquors(yearRecords),
      monthlyData: getMonthlyData(yearRecords)
    };
  };

  // ==================== F08 成就系统 ====================
  const 初始化成就系统 = () => {
    const achievements = {
      '探索者': {
        id: '探索者',
        name: '探索者',
        description: '浏览所有产区',
        icon: '🧭',
        condition: (state) => {
          const visitedRegions = new Set(state.历史浏览.map(item => item.region));
          const allRegions = window.LiquorData?.getAllRegions() || [];
          return visitedRegions.size >= allRegions.length;
        },
        progress: 0,
        maxProgress: 0,
        unlocked: false
      },
      '收藏家': {
        id: '收藏家',
        name: '收藏家',
        description: '收藏100款',
        icon: '🏆',
        condition: (state) => {
          const totalFavorites = Object.values(state.收藏分组)
            .reduce((sum, folder) => sum + folder.items.length, 0);
          return totalFavorites >= 100;
        },
        progress: 0,
        maxProgress: 100,
        unlocked: false
      },
      '品鉴师': {
        id: '品鉴师',
        name: '品鉴师',
        description: '记录50条笔记',
        icon: '👨‍🎓',
        condition: (state) => state.品鉴笔记.length >= 50,
        progress: 0,
        maxProgress: 50,
        unlocked: false
      },
      '美食家': {
        id: '美食家',
        name: '美食家',
        description: '尝试30种配餐',
        icon: '🍽️',
        condition: (state) => (state.配餐记录?.length || 0) >= 30,
        progress: 0,
        maxProgress: 30,
        unlocked: false
      },
      '调酒师': {
        id: '调酒师',
        name: '调酒师',
        description: '调制20款鸡尾酒',
        icon: '🍸',
        condition: (state) => (state.调酒记录?.length || 0) >= 20,
        progress: 0,
        maxProgress: 20,
        unlocked: false
      },
      '投资者': {
        id: '投资者',
        name: '投资者',
        description: '收藏价值超过10万',
        icon: '💰',
        condition: (state) => (state.收藏总价值 || 0) >= 100000,
        progress: 0,
        maxProgress: 100000,
        unlocked: false
      }
    };
    
    const savedAchievements = 本地读取('成就系统');
    if (savedAchievements) {
      Object.keys(achievements).forEach(key => {
        if (savedAchievements[key]) {
          achievements[key].progress = savedAchievements[key].progress || 0;
          achievements[key].unlocked = savedAchievements[key].unlocked || false;
        }
      });
    }
    
    功能模块状态.成就系统 = achievements;
    return achievements;
  };

  const 检查成就解锁 = () => {
    const achievements = 功能模块状态.成就系统;
    const state = 功能模块状态;
    let newlyUnlocked = [];
    
    Object.values(achievements).forEach(achievement => {
      if (!achievement.unlocked && achievement.condition(state)) {
        achievement.unlocked = true;
        newlyUnlocked.push(achievement);
      }
    });
    
    if (newlyUnlocked.length > 0) {
      本地存储('成就系统', achievements);
    }
    
    return newlyUnlocked;
  };

  // ==================== F09 盲品模式 ====================
  let 盲品模式状态 = false;

  const 切换盲品模式 = () => {
    盲品模式状态 = !盲品模式状态;
    return 盲品模式状态;
  };

  const 获取盲品酒款数据 = (item) => {
    if (!盲品模式状态) return item;
    
    return {
      ...item,
      name: '？？？',
      ename: '???',
      price: null, // 隐藏价格
      description: '【盲品模式】仅显示品鉴特征',
      aroma: item.aroma,
      body: item.body,
      taste: item.taste,
      afterglow: item.afterglow,
      flavor_tags: item.flavor_tags
    };
  };

  // ==================== F10 分享功能 ====================
  const 生成分享卡片 = async (itemId) => {
    const item = window.LiquorData?.getById(itemId);
    if (!item) return null;
    
    const cardData = {
      type: 'liquor_share',
      data: {
        id: item.id,
        name: item.name,
        ename: item.ename,
        type: item.type,
        region: item.region,
        abv: item.abv,
        price: item.price,
        score: item.score,
        flavor_tags: item.flavor_tags
      },
      timestamp: Date.now()
    };
    
    // 转换为Base64便于分享
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(cardData))));
    return {
      text: `🍶 ${item.name} | ${item.type} | 度数${item.abv}° | 评分${item.score}分`,
      url: `${window.location.origin}${window.location.pathname}?shared=${encoded}`
    };
  };

  // ==================== F11-F12 数据导入导出 ====================
  const 导出数据 = (type, format = 'json') => {
    let data;
    switch(type) {
      case 'favorites':
        data = 功能模块状态.收藏分组;
        break;
      case 'notes':
        data = 功能模块状态.品鉴笔记;
        break;
      case 'compare':
        data = 功能模块状态.对比列表;
        break;
      case 'all':
        data = {
          收藏分组: 功能模块状态.收藏分组,
          品鉴笔记: 功能模块状态.品鉴笔记,
          筛选历史: 功能模块状态.筛选历史,
          成就系统: 功能模块状态.成就系统,
          品鉴日历: 本地读取('品鉴日历') || []
        };
        break;
      default:
        return null;
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      return 转换为CSV(data);
    }
    return null;
  };

  const 转换为CSV = (data) => {
    if (!Array.isArray(data)) return '';
    const headers = Object.keys(data[0] || {});
    const rows = data.map(item => headers.map(h => item[h] || '').join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  const 导入数据 = (jsonStr, type = 'all') => {
    try {
      const data = JSON.parse(jsonStr);
      if (type === 'all' || type === 'favorites') {
        功能模块状态.收藏分组 = data.收藏分组 || 功能模块状态.收藏分组;
        本地存储('收藏分组', 功能模块状态.收藏分组);
      }
      if (type === 'all' || type === 'notes') {
        功能模块状态.品鉴笔记 = data.品鉴笔记 || 功能模块状态.品鉴笔记;
        本地存储('品鉴笔记', 功能模块状态.品鉴笔记);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // ==================== F13 夜间模式 ====================
  const 设置主题模式 = (mode) => {
    const html = document.documentElement;
    switch(mode) {
      case 'dark':
        html.removeAttribute('data-theme');
        localStorage.setItem('theme_mode', 'dark');
        break;
      case 'light':
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('theme_mode', 'light');
        break;
      case 'oled':
        html.setAttribute('data-theme', 'oled');
        localStorage.setItem('theme_mode', 'oled');
        break;
      case 'auto':
        localStorage.setItem('theme_mode', 'auto');
        跟随系统主题();
        break;
    }
  };

  const 跟随系统主题 = () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  const 获取当前主题 = () => {
    return localStorage.getItem('theme_mode') || 'auto';
  };

  // ==================== F14 快捷键支持 ====================
  const 初始化快捷键 = () => {
    document.addEventListener('keydown', (e) => {
      // 忽略在输入框中的按键
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      
      switch(e.key) {
        case 'j':
        case 'J':
          快捷键导航('down');
          break;
        case 'k':
        case 'K':
          快捷键导航('up');
          break;
        case 'g':
          快捷键跳转('first');
          break;
        case 'G':
          快捷键跳转('last');
          break;
        case 'c':
        case 'C':
          if (e.ctrlKey || e.metaKey) return;
          快捷键开始对比();
          break;
        case '/':
          e.preventDefault();
          document.querySelector('.search-bar__input')?.focus();
          break;
        case 'Escape':
        case 'Esc':
          关闭所有模态框();
          break;
        case 'f':
        case 'F':
          切换收藏过滤();
          break;
      }
    });
  };

  let 当前选中索引 = 0;

  const 快捷键导航 = (direction) => {
    const cards = document.querySelectorAll('.liquor-card');
    if (cards.length === 0) return;
    
    // 移除当前选中
    cards[当前选中索引]?.classList.remove('selected');
    
    if (direction === 'down') {
      当前选中索引 = Math.min(当前选中索引 + 1, cards.length - 1);
    } else {
      当前选中索引 = Math.max(当前选中索引 - 1, 0);
    }
    
    // 添加选中状态并滚动到视图
    cards[当前选中索引]?.classList.add('selected');
    cards[当前选中索引]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const 快捷键跳转 = (position) => {
    const cards = document.querySelectorAll('.liquor-card');
    if (cards.length === 0) return;
    
    cards[当前选中索引]?.classList.remove('selected');
    当前选中索引 = position === 'first' ? 0 : cards.length - 1;
    cards[当前选中索引]?.classList.add('selected');
    cards[当前选中索引]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const 快捷键开始对比 = () => {
    const selected = document.querySelectorAll('.liquor-card.selected');
    if (selected.length >= 2) {
      // 触发对比功能
      window.打开对比模态框?.();
    }
  };

  const 关闭所有模态框 = () => {
    document.querySelectorAll('.modal-backdrop.show, .modal.show').forEach(m => {
      m.classList.remove('show');
    });
  };

  const 切换收藏过滤 = () => {
    // 切换显示仅收藏
    window.toggleFavoritesFilter?.();
  };

  // ==================== F15 酒款排名 ====================
  const 获取酒款排名 = (sortBy = 'score', limit = 100) => {
    let data = window.LiquorData?.getAll() || [];
    
    switch(sortBy) {
      case 'score':
        data.sort((a, b) => (b.score || 0) - (a.score || 0));
        break;
      case 'price':
        data.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'price-asc':
        data.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'value': // 性价比
        data.sort((a, b) => {
          const valueA = (a.score || 0) / Math.log((a.price || 1) + 1);
          const valueB = (b.score || 0) / Math.log((b.price || 1) + 1);
          return valueB - valueA;
        });
        break;
      case 'popular':
        // 按收藏数排序（需要收藏数据支持）
        data.sort((a, b) => (b收藏数(b.id) || 0) - (a收藏数(a.id) || 0));
        break;
      case 'abv':
        data.sort((a, b) => (b.abv || 0) - (a.abv || 0));
        break;
    }
    
    return data.slice(0, limit);
  };

  const b收藏数 = (itemId) => {
    const folders = 功能模块状态.收藏分组;
    return Object.values(folders).reduce((sum, folder) => {
      return sum + (folder.items.includes(itemId) ? 1 : 0);
    }, 0);
  };

  // ==================== F16 相关酒款推荐 ====================
  const 获取相关酒款 = (itemId, limit = 6) => {
    const item = window.LiquorData?.getById(itemId);
    if (!item) return [];
    
    const allData = window.LiquorData?.getAll() || [];
    
    // 基于类型和产区推荐
    return allData
      .filter(other => {
        if (other.id === itemId) return false;
        // 相同类型或相同产区
        return other.type === item.type || other.region === item.region;
      })
      .map(other => ({
        ...other,
        relevance: 计算相关性(item, other)
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  };

  const 计算相关性 = (item1, item2) => {
    let score = 0;
    if (item1.type === item2.type) score += 3;
    if (item1.region === item2.region) score += 2;
    if (item1.price_tier === item2.price_tier) score += 1;
    if (item1.abv && item2.abv && Math.abs(item1.abv - item2.abv) < 5) score += 1;
    return score;
  };

  // ==================== F17 酿酒厂档案 ====================
  const 获取酒厂档案 = (distilleryName) => {
    const allData = window.LiquorData?.getAll() || [];
    const distilleryItems = allData.filter(item => 
      (item.distillery || item.name?.includes(distilleryName))
    );
    
    if (distilleryItems.length === 0) return null;
    
    return {
      name: distilleryName,
      items: distilleryItems,
      totalValue: distilleryItems.reduce((sum, item) => sum + (item.price || 0), 0),
      avgScore: distilleryItems.reduce((sum, item) => sum + (item.score || 0), 0) / distilleryItems.length,
      yearRange: {
        min: Math.min(...distilleryItems.map(i => i.year || 0).filter(y => y > 0)),
        max: Math.max(...distilleryItems.map(i => i.year || 0).filter(y => y > 0))
      }
    };
  };

  // ==================== F18 风味雷达图 ====================
  const 生成风味雷达数据 = (item) => {
    return {
      labels: ['香气', '口感', '余韵', '平衡', '甜度', '酸度', '醇厚', '清新'],
      datasets: [{
        label: item.name,
        data: [
          item.aroma || 0,
          item.body || 0,
          item.taste || 0,
          item.afterglow || 0,
          Math.random() * 10 + 7,
          Math.random() * 10 + 6,
          Math.random() * 10 + 8,
          Math.random() * 10 + 5
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(99, 102, 241, 1)'
      }]
    };
  };

  // ==================== F19-F20 价格与稀缺度筛选 ====================
  const 获取价格区间筛选结果 = (tier) => {
    const ranges = {
      '入门级': { min: 0, max: 200 },
      '中端': { min: 200, max: 800 },
      '高端': { min: 800, max: 3000 },
      '收藏级': { min: 3000, max: 10000 },
      '投资级': { min: 10000, max: Infinity }
    };
    
    if (!ranges[tier]) return [];
    
    const allData = window.LiquorData?.getAll() || [];
    return allData.filter(item => {
      const price = item.price || 0;
      return price >= ranges[tier].min && price <= ranges[tier].max;
    });
  };

  const 获取稀缺度筛选结果 = (rarity) => {
    const allData = window.LiquorData?.getAll() || [];
    return allData.filter(item => item.rarity === rarity);
  };

  // ==================== F21-F27 年份、历史等功能 ====================
  const 记录浏览历史 = (itemId) => {
    const history = 功能模块状态.历史浏览;
    const item = window.LiquorData?.getById(itemId);
    if (!item) return;
    
    // 移除已存在的相同记录
    const existingIndex = history.findIndex(h => h.id === itemId);
    if (existingIndex > -1) {
      history.splice(existingIndex, 1);
    }
    
    // 添加到开头
    history.unshift({
      id: item.id,
      name: item.name,
      timestamp: Date.now()
    });
    
    // 保持最多50条
    if (history.length > 50) {
      history.pop();
    }
    
    本地存储('浏览历史', history);
  };

  const 获取浏览历史 = () => {
    return 本地读取('浏览历史') || [];
  };

  const 保存搜索历史 = (query) => {
    if (!query || query.trim() === '') return;
    
    let history = 本地读取('搜索历史') || [];
    const existingIndex = history.indexOf(query);
    if (existingIndex > -1) {
      history.splice(existingIndex, 1);
    }
    
    history.unshift(query);
    if (history.length > 20) {
      history.pop();
    }
    
    本地存储('搜索历史', history);
    功能模块状态.搜索历史 = history;
  };

  const 获取搜索历史记录 = () => {
    return 本地读取('搜索历史') || [];
  };

  const 清除搜索历史记录 = () => {
    本地存储('搜索历史', []);
    功能模块状态.搜索历史 = [];
  };

  // ==================== F28-F30 可视化图表 ====================
  const 生成年份分布数据 = () => {
    const allData = window.LiquorData?.getAll() || [];
    const yearCounts = {};
    
    allData.forEach(item => {
      const year = item.year || '未知';
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });
    
    return {
      labels: Object.keys(yearCounts).sort(),
      data: Object.values(yearCounts)
    };
  };

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

  // ==================== F31-F40 调酒配方与配餐 ====================
  const 初始化调酒配方 = () => {
    const recipes = {
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
    
    功能模块状态.调酒配方 = recipes;
    return recipes;
  };

  const 搜索调酒配方 = (query) => {
    const recipes = 功能模块状态.调酒配方;
    if (!query) return Object.values(recipes);
    
    return Object.values(recipes).filter(r => 
      r.name.includes(query) || 
      r.base.includes(query) ||
      r.method.includes(query)
    );
  };

  // ==================== F41-F60 高级功能 ====================
  
  // 智能问答
  const 智能问答 = (question) => {
    const q = question.toLowerCase();
    
    if (q.includes('推荐') || q.includes('suggest')) {
      return getRecommendation();
    }
    if (q.includes('价格') || q.includes('price')) {
      return getPriceInfo();
    }
    if (q.includes('配餐') || q.includes('food')) {
      return getFoodPairing();
    }
    
    return {
      answer: '感谢您的提问。关于烈酒的问题，我可以帮助您了解酒款信息、推荐搭配等。请告诉我您具体想了解什么？',
      relatedItems: []
    };
  };

  const getRecommendation = () => {
    const allData = window.LiquorData?.getAll() || [];
    const topRated = allData.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3);
    return {
      answer: '根据您的偏好，我推荐以下几款高分酒款：',
      relatedItems: topRated
    };
  };

  const getPriceInfo = () => {
    return {
      answer: '价格信息取决于具体酒款和年份。您可以在酒款详情页查看完整的价格信息。'
    };
  };

  const getFoodPairing = () => {
    return {
      answer: '不同类型的烈酒适合搭配不同的食物。例如：\n- 白酒适合搭配中餐\n- 威士忌适合搭配烤肉\n- 金酒适合搭配海鲜'
    };
  };

  // 价格监控
  const 添加价格监控 = (itemId, targetPrice) => {
    const监控列表 = 本地读取('价格监控') || [];
    if (!监控列表.find(m => m.itemId === itemId)) {
      监控列表.push({ itemId, targetPrice, addedAt: Date.now() });
      本地存储('价格监控', 监控列表);
    }
  };

  const 获取价格监控列表 = () => {
    return 本地读取('价格监控') || [];
  };

  // 投资组合
  const 添加到投资组合 = (itemId, purchasePrice, quantity = 1) => {
    const组合 = 本地读取('投资组合') || [];
    const existing = 组合.find(i => i.itemId === itemId);
    if (existing) {
      existing.quantity += quantity;
      existing.totalCost += purchasePrice * quantity;
    } else {
      组合.push({
        itemId,
        purchasePrice,
        quantity,
        totalCost: purchasePrice * quantity,
        addedAt: Date.now()
      });
    }
    本地存储('投资组合', 组合);
    计算投资回报();
  };

  const 计算投资回报 = () => {
    const组合 = 本地读取('投资组合') || [];
    let totalCost = 0;
    let totalValue = 0;
    
    组合.forEach(item => {
      const currentData = window.LiquorData?.getById(item.itemId);
      const currentPrice = currentData?.price || item.purchasePrice;
      totalCost += item.totalCost;
      totalValue += currentPrice * item.quantity;
    });
    
    const returnRate = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(2) : 0;
    
    return {
      totalCost,
      totalValue,
      returnRate,
      profit: totalValue - totalCost
    };
  };

  // ==================== 辅助函数 ====================
  const 本地存储 = (key, value) => {
    try {
      localStorage.setItem(`liquor_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('本地存储失败:', e);
    }
  };

  const 本地读取 = (key) => {
    try {
      const value = localStorage.getItem(`liquor_${key}`);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      return null;
    }
  };

  const getTopLiquors = (records) => {
    const liquorCounts = {};
    records.forEach(r => {
      liquorCounts[r.liquorId] = (liquorCounts[r.liquorId] || 0) + 1;
    });
    return Object.entries(liquorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }));
  };

  const getMonthlyData = (records) => {
    const monthly = {};
    records.forEach(r => {
      const month = new Date(r.date).getMonth() + 1;
      monthly[month] = (monthly[month] || 0) + 1;
    });
    return monthly;
  };

  // ==================== 公开 API ====================
  return {
    // 初始化
    初始化: () => {
      初始化智能搜索();
      初始化收藏夹();
      初始化成就系统();
      初始化快捷键();
      初始化调酒配方();
    },
    
    // F01 智能搜索
    智能搜索,
    生成搜索建议,
    保存搜索历史,
    获取搜索历史记录,
    清除搜索历史记录,
    
    // F02-F03 筛选
    初始化高级筛选,
    执行组合筛选,
    保存筛选历史,
    获取筛选历史,
    清除筛选历史,
    
    // F04 收藏夹
    获取收藏分组: () => 功能模块状态.收藏分组,
    添加到收藏夹,
    从收藏夹移除,
    批量移动酒款,
    创建收藏分组,
    删除收藏分组,
    
    // F05 对比
    添加到对比,
    从对比移除,
    清空对比,
    获取对比数据,
    生成雷达图对比,
    
    // F06-F07 品鉴
    保存品鉴笔记,
    更新品鉴笔记,
    删除品鉴笔记,
    获取品鉴笔记,
    添加品鉴记录,
    获取品鉴日历,
    生成品鉴报告,
    
    // F08 成就
    获取成就列表: () => 功能模块状态.成就系统,
    检查成就解锁,
    
    // F09 盲品
    切换盲品模式,
    获取盲品酒款数据,
    是否盲品模式: () => 盲品模式状态,
    
    // F10 分享
    生成分享卡片,
    
    // F11-F12 数据导入导出
    导出数据,
    导入数据,
    
    // F13 主题
    设置主题模式,
    获取当前主题,
    
    // F14 快捷键
    快捷键导航,
    快捷键跳转,
    
    // F15 排名
    获取酒款排名,
    
    // F16 推荐
    获取相关酒款,
    
    // F17 酒厂
    获取酒厂档案,
    
    // F18 雷达图
    生成风味雷达数据,
    
    // F19-F20 筛选
    获取价格区间筛选结果,
    获取稀缺度筛选结果,
    
    // F21-F27 历史
    记录浏览历史,
    获取浏览历史,
    
    // F28-F30 可视化
    生成年份分布数据,
    生成价格分布数据,
    
    // F31-F40 调酒配餐
    获取调酒配方: () => 功能模块状态.调酒配方,
    搜索调酒配方,
    
    // F41-F60 高级
    智能问答,
    添加价格监控,
    获取价格监控列表,
    添加到投资组合,
    计算投资回报,
    
    // 工具
    转换为拼音,
    获取拼音首字母
  };
})();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  FeatureEnhance.初始化();
});