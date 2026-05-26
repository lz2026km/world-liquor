/**
 * 世界烈酒图鉴 v5 - 数据层模块
 * 职责：数据加载、解压、缓存、过滤、状态管理
 */

const DataManager = (() => {
  // 私有状态
  let liquorData = [];
  let isLoaded = false;
  let isLoading = false;
  let loadError = null;

  // LZString 解压函数（内联，避免外部依赖）
  const LZString = (() => {
    const keyStrBase64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const keyStrUriSafe = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';
    const baseReverseDic = {};

    const getBaseValue = (alphabet, character) => {
      if (!baseReverseDic[alphabet]) {
        baseReverseDic[alphabet] = {};
        for (let i = 0; i < alphabet.length; i++) {
          baseReverseDic[alphabet][alphabet.charAt(i)] = i;
        }
      }
      return baseReverseDic[alphabet][character];
    };

    const charToInt = (c) => {
      if (c >= 65 && c <= 90) return c - 65;
      if (c >= 97 && c <= 122) return c - 97 + 26;
      if (c >= 48 && c <= 57) return c - 48 + 52;
      if (c === 43) return 62;
      if (c === 47) return 63;
      return 0;
    };

    const toBase64 = (input) => {
      const output = [];
      let i = 0;
      while (i < input.length * 8) {
        const b = (i / 8 | 0) < input.length ? input[i / 8 | 0] : 0;
        output.push(String.fromCharCode(b));
        i += 8;
      }
      return output.join('');
    };

    return {
      decompressFromUTF16: (compressed) => {
        if (!compressed) return '';
        if (compressed.length === 0) return '';

        const dictionary = [];
        let enlargeIn = 4;
        let dictSize = 4;
        let numBits = 3;
        let remainingBits = 0;
        let buffer = 0;
        let bufferBits = 0;
        let output = [];
        let continueReading = true;

        const getNextValue = () => {
          if (remainingBits <= 0) {
            if (i >= compressed.length) return -1;
            const c = compressed.charCodeAt(i++);
            buffer = charToInt(c);
            remainingBits = 6;
          }
          const value = buffer & (1 << remainingBits) - 1;
          buffer >>= remainingBits;
          remainingBits -= numBits;
          return value;
        };

        let i = 0;
        let local_i = 0;
        let c = '';
        let entry = '';
        let link = 0;
        let bits = 0;
        let maxpower = Math.pow(2, 2);
        let power = 0;
        let powerList = [];
        for (let j = 0; j < 3; j++) powerList[j] = j;

        while (continueReading) {
          power = getNextValue();
          if (power === -1) break;
          link = power + (power === 0 ? 1 : 0) * (power === 1 ? 2 : 0) * (power === 2 ? 4 : 0) * (power === 3 ? 8 : 0);
          c = String.fromCharCode(link);
          output.push(c);
          c = output[output.length - 1];
          dictionary.push(c);

          if (dictSize < link + 1) {
            dictionary[dictSize++] = c + entry;
          } else if (link > 2) {
            const idx = dictSize - enlargeIn;
            dictionary[dictSize++] = dictionary[idx].length > link ? dictionary[idx].charAt(link) : dictionary[idx] + dictionary[idx].charAt(0);
          }
          entry = dictionary[dictSize - 1] || '';
          bits += numBits;
          if (dictSize > (1 << bits)) {
            enlargeIn++;
            bits++;
          }
          if (link === dictSize - 1) {
            if (i >= compressed.length) break;
            entry += compressed.charAt(i++);
            while (entry.length < link + 1) {
              if (i >= compressed.length) break;
              entry += compressed.charAt(i++);
            }
          } else if (link === 2) {
            entry = '';
            while (entry.length < link + 1) {
              if (i >= compressed.length) break;
              entry += compressed.charAt(i++);
            }
          }
        }

        return output.join('');
      },

      decompressFromBase64: (input) => {
        if (!input) return '';
        const output = [];
        let i = 0;
        while (i < input.length) {
          const enc1 = charToInt(input.charCodeAt(i++));
          const enc2 = charToInt(input.charCodeAt(i++));
          const enc3 = charToInt(input.charCodeAt(i++));
          const enc4 = charToInt(input.charCodeAt(i++));
          output.push((enc1 << 2) | (enc2 >> 4));
          if (enc3 !== 64) output.push(((enc2 & 15) << 4) | (enc3 >> 2));
          if (enc4 !== 64) output.push(((enc3 & 3) << 6) | enc4);
        }
        return output.map(c => String.fromCharCode(c)).join('');
      }
    };
  })();

  // 解压数据
  const decompressData = (compressed) => {
    try {
      // 尝试 UTF16 解压
      const decompressed = LZString.decompressFromUTF16(compressed);
      if (decompressed) {
        return JSON.parse(decompressed);
      }
    } catch (e) {
      // UTF16 解压失败，尝试 Base64
      try {
        const base64Decoded = LZString.decompressFromBase64(compressed);
        if (base64Decoded) {
          return JSON.parse(base64Decoded);
        }
      } catch (e2) {
        // Base64 也失败
      }
    }
    return null;
  };

  // 从 localStorage 读取缓存
  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem('liquor_data_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // 缓存有效期 24 小时
        if (Date.now() - timestamp < 86400000) {
          return data;
        }
      }
    } catch (e) {
      // 缓存读取失败
    }
    return null;
  };

  // 保存到 localStorage 缓存
  const saveToCache = (data) => {
    try {
      localStorage.setItem('liquor_data_cache', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      // 缓存保存失败（可能超出配额）
    }
  };

  // 压缩数据为 Base64（用于 localStorage 存储）
  const compressData = (data) => {
    try {
      const jsonStr = JSON.stringify(data);
      // 简单的 Base64 编码（实际项目应使用 lz-string 库）
      return btoa(unescape(encodeURIComponent(jsonStr)));
    } catch (e) {
      return null;
    }
  };

  // 获取所有酒品
  const getAll = () => {
    return [...liquorData];
  };

  // 按类型筛选
  const filterByType = (type) => {
    if (!type || type === '全部') return getAll();
    return liquorData.filter(item => item.type === type);
  };

  // 按产区筛选
  const filterByRegion = (region) => {
    if (!region || region === '全部') return getAll();
    return liquorData.filter(item => item.region === region);
  };

  // 按价格区间筛选
  const filterByPriceRange = (min, max) => {
    return liquorData.filter(item => {
      const price = item.price || 0;
      if (min !== undefined && price < min) return false;
      if (max !== undefined && price > max) return false;
      return true;
    });
  };

  // 搜索（name/ename/type）
  const search = (query) => {
    if (!query || query.trim() === '') return getAll();
    const q = query.toLowerCase().trim();
    return liquorData.filter(item => {
      const name = (item.name || '').toLowerCase();
      const ename = (item.ename || '').toLowerCase();
      const type = (item.type || '').toLowerCase();
      return name.includes(q) || ename.includes(q) || type.includes(q);
    });
  };

  // 综合筛选
  const filter = (options = {}) => {
    let result = getAll();

    if (options.type && options.type !== '全部') {
      result = result.filter(item => item.type === options.type);
    }

    if (options.region && options.region !== '全部') {
      result = result.filter(item => item.region === options.region);
    }

    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      result = result.filter(item => {
        const price = item.price || 0;
        if (options.minPrice !== undefined && price < options.minPrice) return false;
        if (options.maxPrice !== undefined && price > options.maxPrice) return false;
        return true;
      });
    }

    if (options.query && options.query.trim()) {
      const q = options.query.toLowerCase().trim();
      result = result.filter(item => {
        const name = (item.name || '').toLowerCase();
        const ename = (item.ename || '').toLowerCase();
        const type = (item.type || '').toLowerCase();
        return name.includes(q) || ename.includes(q) || type.includes(q);
      });
    }

    if (options.priceTier) {
      result = result.filter(item => item.price_tier === options.priceTier);
    }

    if (options.abvMin !== undefined || options.abvMax !== undefined) {
      result = result.filter(item => {
        const abv = item.abv || 0;
        if (options.abvMin !== undefined && abv < options.abvMin) return false;
        if (options.abvMax !== undefined && abv > options.abvMax) return false;
        return true;
      });
    }

    return result;
  };

  // 获取单条详情
  const getById = (id) => {
    return liquorData.find(item => item.id === id) || null;
  };

  // 获取分页数据
  const getPage = (page = 1, pageSize = 20) => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return liquorData.slice(start, end);
  };

  // 获取总页数
  const getTotalPages = (pageSize = 20) => {
    return Math.ceil(liquorData.length / pageSize);
  };

  // 获取数据总条数
  const getTotalCount = () => {
    return liquorData.length;
  };

  // 导出选中对比
  const exportCompare = (ids) => {
    return ids.map(id => getById(id)).filter(Boolean);
  };

  // 获取所有类型
  const getAllTypes = () => {
    const types = new Set();
    liquorData.forEach(item => {
      if (item.type) types.add(item.type);
    });
    return Array.from(types).sort();
  };

  // 获取所有产区
  const getAllRegions = () => {
    const regions = new Set();
    liquorData.forEach(item => {
      if (item.region) regions.add(item.region);
    });
    return Array.from(regions).sort();
  };

  // 获取价格区间
  const getPriceRange = () => {
    if (liquorData.length === 0) return { min: 0, max: 0 };
    const prices = liquorData.map(item => item.price || 0);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  // 加载数据
  const loadData = async () => {
    if (isLoading) return;
    if (isLoaded) return;

    isLoading = true;
    loadError = null;

    try {
      // 1. 尝试从缓存读取
      const cachedData = loadFromCache();
      if (cachedData && Array.isArray(cachedData)) {
        liquorData = cachedData;
        isLoaded = true;
        isLoading = false;
        return;
      }

      // 2. 尝试从网络加载并解压
      let response;
      try {
        try {
          response = await fetch('./baijiu_data.json');
          if (!response.ok) throw new Error('HTTP ' + response.status);
        } catch(e) {
          // Fallback: load from GitHub API raw (works around GitHub Pages CORS/timeout issues)
          const apiUrl = 'https://raw.githubusercontent.com/lz2026km/world-liquor/master/baijiu_data.json';
          response = await fetch(apiUrl);
        }
      } catch(e) {
        window.__fetch_err = e.message;
        throw new Error('fetch failed: ' + e.message);
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      
      // 判断是否压缩数据（检查是否以 lz-string 特征字符开头）
      if (text.startsWith('PJ@') || text.startsWith('N4@') || text.startsWith('C4@')) {
        // 压缩数据，尝试解压
        const decompressed = decompressData(text);
        if (decompressed && Array.isArray(decompressed)) {
          liquorData = decompressed;
        } else {
          throw new Error('Data decompression failed');
        }
      } else {
        // 未压缩的 JSON 数据
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          liquorData = parsed;
        } else {
          throw new Error('Invalid data format');
        }
      }

      // 3. 保存到缓存
      saveToCache(liquorData);

      isLoaded = true;
    } catch (e) {
      loadError = e.message || 'Failed to load data';
      
      // 降级处理：返回内置的最小数据集
      if (!isLoaded || liquorData.length === 0) {
        liquorData = getFallbackData();
        isLoaded = true;
      }
    } finally {
      isLoading = false;
    }
  };

  // 降级数据（当加载失败时使用）
  const getFallbackData = () => {
    return [
      {
        id: 'MJ001',
        name: '茅台飞天',
        ename: 'Kweichow Moutai',
        type: '酱香型',
        abv: 53,
        origin: '贵州省遵义市仁怀市茅台镇',
        region: '黔',
        price: 1499,
        score: 91.4,
        aroma: 17,
        body: 16,
        taste: 18,
        afterglow: 18,
        image: '/images/茅台飞天.jpg',
        flavor_tags: ['回甘', '焦香', '药香', '酱香', '层次丰富'],
        description: '酱香突出、幽雅细腻、酒体醇厚、回味悠长、空杯留香持久'
      }
    ];
  };

  // 检查加载状态
  const getLoadStatus = () => {
    return {
      isLoaded,
      isLoading,
      loadError,
      count: liquorData.length
    };
  };

  // 清除缓存
  const clearCache = () => {
    try {
      localStorage.removeItem('liquor_data_cache');
    } catch (e) {
      // 忽略
    }
  };

  // 公开 API
  return {
    init: loadData,
    getAll,
    filterByType,
    filterByRegion,
    filterByPriceRange,
    search,
    filter,
    getById,
    getPage,
    getTotalPages,
    getTotalCount,
    exportCompare,
    getAllTypes,
    getAllRegions,
    getPriceRange,
    getStatus: getLoadStatus,
    clearCache
  };
})();

// 全局挂钩（供 index.html 直接调用）
window.LiquorData = DataManager;
window.LiquorData.getTypes = DataManager.getAllTypes;
window.LiquorData.getRegions = DataManager.getAllRegions;
window.LiquorData.getFiltered = async function(options = {}, page = 1, pageSize = 20) {
  const all = DataManager.filter({...options, query: options.query || ''});
  const start = (page - 1) * pageSize;
  return all.slice(start, start + pageSize);
};
window.LiquorData.getPage = DataManager.getPage;