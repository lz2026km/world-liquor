# 世界烈酒图鉴 v5 · 极暗奢华 · 琥珀流光
## SPEC.md 规格说明书

---

## 一、版本概述

| 项目 | 说明 |
|------|------|
| **版本** | v5.0.0 |
| **方向** | 极暗奢华 · 琥珀流光 (Dark Luxury · Amber Glow) |
| **定位** | 华丽、震撼、视觉冲击力 |
| **数据规模** | 300款酒，9大品类，293张图片 |
| **设计系统参考** | Open Design Luxury / 现有 v4.1 CSS变量系统 |

---

## 二、视觉规范

### 2.1 色彩系统

#### 主背景色（继承）
```
--bg-deepest:  #080706   ← 极深黑（页面底色）
--bg-deep:     #0f0d0a   ← 深黑（卡片区）
--bg-card:     #151310   ← 卡片背景
--bg-elevated: #1c1813   ← 悬浮层背景
```

#### 强调色-琥珀金（继承 + 新增渐变）
```
--accent-50:   #fdf8f0   ← 琥珀亮色
--accent-100:  #f5ebd0   ← 琥珀浅
--accent-200:  #e8d4a0   ← 琥珀中浅
--accent-300:  #d8b87a   ← 琥珀中
--accent-400:  #cfa85e   ← 琥珀标准
--accent-500:  #c6a15b   ← 琥珀金（主强调色）
--accent-600:  #b08a42   ← 琥珀深
--accent-700:  #9a7a3f   ← 琥珀暗

/* v5 新增 */
--amber-glow:        rgba(198, 161, 91, 0.15)   ← 琥珀光晕
--amber-shimmer:    rgba(212, 168, 75, 0.6)    ← 流光效果色
--amber-gradient:    linear-gradient(135deg, #c6a15b 0%, #9a7a3f 100%)  ← 琥珀渐变
```

#### 文字色（继承）
```
--text-primary:   #fff8ea   ← 主文字（暖白）
--text-secondary: #d8cdb7   ← 次要文字
--text-muted:     #9f927c   ← 辅助文字
--text-subtle:    #6a5f4e   ← 淡化文字
```

#### 边框色（继承）
```
--border-subtle:  rgba(198, 161, 91, 0.08)   ← 微光边框
--border-default: #282217   ← 默认边框
--border-hover:   #3a3020   ← 悬浮边框
--border-accent:  rgba(198, 161, 91, 0.2)   ← 琥珀边框
```

### 2.2 动效规范（v5 核心升级）

#### 2.2.1 卡片流光动画（Scan Line Effect）
```css
/* 基础流光 */
.card-shimmer {
  position: relative;
  overflow: hidden;
}

.card-shimmer::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(198, 161, 91, 0.08) 40%,
    rgba(198, 161, 91, 0.15) 50%,
    rgba(198, 161, 91, 0.08) 60%,
    transparent 100%
  );
  animation: shimmer 1.8s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { left: -100%; }
  100% { left: 200%; }
}

/* 悬浮增强流光 */
.liquor-card:hover::before {
  animation-duration: 1.2s;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(198, 161, 91, 0.12) 40%,
    rgba(212, 168, 75, 0.25) 50%,
    rgba(198, 161, 91, 0.12) 60%,
    transparent 100%
  );
}
```

#### 2.2.2 悬浮动效
```css
.liquor-card {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.liquor-card:hover {
  transform: translateY(-6px);
  border-color: var(--accent-500);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.7),
    0 0 30px rgba(198, 161, 91, 0.15),
    inset 0 1px 0 rgba(198, 161, 91, 0.1);
}
```

#### 2.2.3 雷达图发光填充
```css
.radar-fill {
  fill: rgba(198, 161, 91, 0.25);
  filter: drop-shadow(0 0 8px rgba(198, 161, 91, 0.4));
  transition: all 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

.radar-fill-animate {
  animation: radarReveal 600ms ease-out forwards;
  transform-origin: center;
}

@keyframes radarReveal {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.radar-stroke {
  stroke: var(--accent-500);
  stroke-width: 2;
  filter: drop-shadow(0 0 4px rgba(198, 161, 91, 0.5));
}
```

#### 2.2.4 成就徽章3D翻转
```css
.achievement-card {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.achievement-card__inner {
  transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.achievement-card:hover .achievement-card__inner,
.achievement-card.flipped .achievement-card__inner {
  transform: rotateY(180deg);
}

.achievement-card__front,
.achievement-card__back {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.achievement-card__back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent-600), var(--accent-700));
  border-radius: var(--radius-lg);
}
```

#### 2.2.5 背景粒子系统
```javascript
// particle.js 参数
const PARTICLE_CONFIG = {
  count: 80,              // 粒子数量（50-100）
  speed: { min: 0.3, max: 0.8 },  // 移动速度 px/frame
  size: { min: 1, max: 3 },        // 粒子大小 px
  opacity: { min: 0.3, max: 0.7 }, // 透明度范围
  color: '#c6a15b',       // 粒子颜色（琥珀金）
  glow: true,             // 启用发光效果
  glowIntensity: 0.4,     // 发光强度
  drift: { x: 0.5, y: -0.3 },  // 漂移趋势
  twinkle: true           // 闪烁效果
};
```

#### 2.2.6 详情页全屏沉浸效果
```css
.detail-modal-fullscreen {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(8, 7, 6, 0.92);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  animation: modalFadeIn 400ms ease-out;
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* 底部琥珀渗透光 */
.detail-modal-fullscreen::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(
    to top,
    rgba(198, 161, 91, 0.08) 0%,
    transparent 100%
  );
  pointer-events: none;
}
```

#### 2.2.7 时间轴酿造故事动效
```css
.timeline-item {
  opacity: 0;
  transform: translateY(20px);
  animation: timelineReveal 500ms ease-out forwards;
}

.timeline-item:nth-child(1) { animation-delay: 100ms; }
.timeline-item:nth-child(2) { animation-delay: 200ms; }
.timeline-item:nth-child(3) { animation-delay: 300ms; }
.timeline-item:nth-child(4) { animation-delay: 400ms; }
.timeline-item:nth-child(5) { animation-delay: 500ms; }

@keyframes timelineReveal {
  to { opacity: 1; transform: translateY(0); }
}
```

### 2.3 阴影系统（继承 + 琥珀发光）
```css
--shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.6);
--shadow-md:   0 4px 16px rgba(0, 0, 0, 0.6);
--shadow-lg:   0 12px 40px rgba(0, 0, 0, 0.7);
--shadow-xl:   0 24px 80px rgba(0, 0, 0, 0.8);

/* v5 新增琥珀发光阴影 */
--shadow-amber-sm:  0 0 15px rgba(198, 161, 91, 0.15);
--shadow-amber-md:  0 0 30px rgba(198, 161, 91, 0.2);
--shadow-amber-lg:  0 0 50px rgba(198, 161, 91, 0.25), 0 0 100px rgba(198, 161, 91, 0.1);
```

### 2.4 布局规范

#### 2.4.1 页面结构
```
┌─────────────────────────────────────────────────────────┐
│ HEADER (sticky, glassmorphism, z-100)                   │
│ ┌──────────┬──────────────────────────┬──────────────┐ │
│ │ LOGO     │ SEARCH BAR               │ ACTIONS      │ │
│ └──────────┴──────────────────────────┴──────────────┘ │
├─────────────────────────────────────────────────────────┤
│ PARTICLE CANVAS LAYER (absolute, z-0, pointer-events:none) │
├───────────┬─────────────────────────────────────────────┤
│ SIDEBAR   │ MAIN CONTENT                               │
│ (390px)   │ ┌─────────────────────────────────────┐    │
│           │ │ HERO TITLE                           │    │
│ Filters   │ └─────────────────────────────────────┘    │
│ Tags      │ ┌─────────────────────────────────────┐    │
│ Stats     │ │ FILTER PANEL (pill tags)            │    │
│           │ └─────────────────────────────────────┘    │
│           │ ┌─────────────────────────────────────┐    │
│           │ │ CARD GRID                           │    │
│           │ │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │    │
│           │ │ │     │ │     │ │     │ │     │    │    │
│           │ │ └─────┘ └─────┘ └─────┘ └─────┘    │    │
│           │ │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │    │
│           │ │ │     │ │     │ │     │ │     │    │    │
│           │ │ └─────┘ └─────┘ └─────┘ └─────┘    │    │
│           │ └─────────────────────────────────────┘    │
└───────────┴─────────────────────────────────────────────┘
│ COMPARE BAR (fixed bottom, slide-up)                     │
└─────────────────────────────────────────────────────────┘
```

#### 2.4.2 响应式断点
```
Desktop:  ≥1200px  (4列卡片)
Tablet:   768-1199px (2-3列卡片)
Mobile:   <768px (1列卡片，侧栏折叠为Drawer)
```

---

## 三、数据架构

### 3.1 数据源
- **主数据文件**: `/baijiu_data.json` (83,557行，~2.8MB)
- **字段结构**: id/name/ename/type/abv/origin/region/price/score/aroma/body/taste/afterglow/tasting/pairing/awards/flavor_tags/brewing/cocktail 等

### 3.2 数据压缩方案
```
方案: lz-string 压缩后内联
效果: ~2.8MB → ~800KB (压缩率 ~70%)

实现方式:
1. 构建时使用 lz-string 库压缩 JSON
2. 压缩数据以字符串形式内联到 data.js
3. 运行前解压: LZString.decompressFromUTF16(compressedData)
4. 缓存在 localStorage 或内存中
```

### 3.3 懒加载策略
```
首屏加载: 20张卡片
滚动加载: 每次 20张
图片懒加载: IntersectionObserver + loading="lazy"
总卡片数: 300款
总加载次数: 15次（300/20）
```

### 3.4 数据模块接口
```javascript
// data.js 模块
const DataManager = {
  // 初始化（加载+解压）
  async init(): Promise<void>
  
  // 获取所有酒品
  getAll(): Liquor[]
  
  // 按类型筛选
  filterByType(type: string): Liquor[]
  
  // 按产区筛选
  filterByRegion(region: string): Liquor[]
  
  // 按价格区间筛选
  filterByPriceRange(min: number, max: number): Liquor[]
  
  // 搜索（name/ename/type）
  search(query: string): Liquor[]
  
  // 获取单条详情
  getById(id: string): Liquor | null
  
  // 获取分页数据
  getPage(page: number, pageSize: number): Liquor[]
  
  // 导出选中对比
  exportCompare(ids: string[]): Liquor[]
}
```

---

## 四、模块化拆分

### 4.1 文件结构
```
world-liquor/
├── index.html           # 入口页面
├── styles.css           # 主样式（v4.1继承 + v5增量）
├── data.js              # 数据层：加载/解压/状态管理
├── ui.js                # 渲染层：卡片/详情/雷达图/成就
├── particle.js          # 背景粒子系统
├── animations.css       # v5专用动效类（shimmer/flip/glow）
└── SPEC.md              # 本规格文档
```

### 4.2 模块职责

#### data.js - 数据层
```javascript
// 职责：数据加载、解压、缓存、过滤、状态管理
export class DataManager {
  constructor() { /* ... */ }
  
  async loadData(): Promise<void>
  compressData(data: object): string
  decompressData(compressed: string): object
  filter(options: FilterOptions): Liquor[]
  search(query: string): Liquor[]
}
```

#### ui.js - 渲染层
```javascript
// 职责：UI渲染逻辑，与数据层解耦
export const UIRenderer = {
  // 渲染卡片网格
  renderCardGrid(liquors: Liquor[], container: HTMLElement): void
  
  // 渲染单个卡片
  renderCard(liquor: Liquor): string  // 返回HTML
  
  // 渲染详情弹窗
  renderDetailModal(liquor: Liquor): void
  
  // 渲染雷达图
  renderRadarChart(liquor: Liquor, canvas: HTMLCanvasElement): void
  
  // 渲染成就徽章
  renderAchievements(achievements: Achievement[]): string
  
  // 渲染筛选面板
  renderFilterPanel(filters: FilterConfig[]): string
  
  // 绑定事件委托
  bindEvents(): void
}
```

#### particle.js - 背景粒子系统
```javascript
// 职责：Canvas粒子动画
export class ParticleSystem {
  constructor(canvas: HTMLCanvasElement, config: ParticleConfig)
  start(): void      // 开始动画
  stop(): void       // 停止动画
  pause(): void      // 暂停
  resume(): void     // 恢复
  destroy(): void    // 销毁
  setIntensity(level: number): void  // 0-1调整粒子密度
}
```

#### animations.css - 动效类
```css
/* 流光类 */
.shimmer { /* 基础流光 */ }
.shimmer-intense { /* 强化流光 */ }

/* 悬浮类 */
.hover-lift { /* 悬浮上移+阴影 */ }
.hover-glow { /* 悬浮发光 */ }

/* 翻转类 */
.flip-card { /* 3D翻转容器 */ }
.flip-card__inner { /* 翻转内容 */ }
.flip-card:hover .flip-card__inner { /* 触发翻转 */ }

/* 渐入类 */
.fade-in { animation: fadeIn 400ms ease-out; }
.fade-in-up { animation: fadeInUp 500ms ease-out; }
.slide-in-left { animation: slideInLeft 400ms ease-out; }
```

---

## 五、交互流程

### 5.1 筛选交互

#### 类型筛选
```
酒类型: [全部] [酱香] [浓香] [清香] [威士忌] [白兰地] [伏特加] [金酒] [朗姆] [龙舌兰]
        ↓ 点击标签
        ↓ 更新 active 状态
        ↓ 过滤 data.js 中的数据
        ↓ 调用 UIRenderer.renderCardGrid() 重绘
```

#### 多维筛选
```
产区: 黔/川/苏/皖/鲁/豫 等
价位: 💰 ~ 💰💰💰💰💰 (5级)
酒精度: 按slider选择区间
排序: 综合评分/价格/年份
```

### 5.2 搜索交互
```
输入框获取焦点 → 显示搜索历史下拉 → 用户输入 → 实时过滤(300ms debounce) 
→ 显示匹配结果(高亮关键词) → 点击或回车 → 定位到该酒卡片 → 展开详情
```

### 5.3 详情页全屏沉浸
```
点击卡片 → 全屏Modal淡入(400ms) → 背景blur(20px) → 底部琥珀光渐显 
→ 雷达图从中心展开(600ms) → 时间轴逐条滑入(100ms间隔)
     ↓
关闭 → 全屏Modal淡出(300ms) → 返回列表
```

### 5.4 对比流程
```
点击卡片上的「对比」按钮 → 添加到Compare Bar → 最多4款 
→ 点击Compare Bar的「开始对比」 → 展开对比视图
→ 侧边栏显示雷达图叠加对比
```

### 5.5 成就系统
```
浏览的酒品达到条件 → 成就徽章解锁动画
→ 徽章翻转显示详情 → 通知提示(Toast)
→ 成就数据持久化(localStorage)
```

---

## 六、关键组件规格

### 6.1 卡片组件 (liquor-card)
```
尺寸: minmax(280px, 1fr) 宽度自适应
高度: 
  - 网格视图: auto (image 180px + body padding)
  - 列表视图: 140px (image 160px 宽)

结构:
┌────────────────────────────┐
│ [IMG 180px]         [TYPE] │
│                    [FAV]  │
├────────────────────────────┤
│ REGION ──────────────────  │
│ 酒名 Name                  │
│ English Name               │
│ [TAG1] [TAG2] [TAG3]      │
├────────────────────────────┤
│ ABV: 53%        ¥1,499    │
│ [COMPARE] [DETAIL]        │
└────────────────────────────┘

动效:
- 默认: 微流光(scan line, 1.8s周期)
- 悬浮: 流光加速(1.2s) + translateY(-6px) + 琥珀阴影
- 点击: scale(0.98) 反馈
```

### 6.2 雷达图组件 (radar-chart)
```
维度: 5维 (aroma香气, body酒体, taste味道, afterglow回味, score综合)
范围: 0-20分
尺寸: 320x320px

动效:
- 加载: 从中心向外扩展(600ms ease-out)
- 数据更新: 平滑过渡(newVal → oldVal, 300ms)
- 悬浮: 对应维度高亮 + tooltip显示数值
- 发光: 填充区域外发光(drop-shadow)
```

### 6.3 成就徽章组件 (achievement-card)
```
尺寸: 180x140px (网格布局自适应)
结构:
┌────────────────────────────┐
│         [ICON 36px]        │
│       成就名称              │
│       成就描述             │
└────────────────────────────┘
背面(翻转后):
┌────────────────────────────┐
│    解锁条件/日期           │
│    进度: 12/20             │
└────────────────────────────┘

动效:
- 悬浮: rotateY(180deg), 400ms cubic-bezier(0.4, 0, 0.2, 1)
- 未解锁: grayscale(1) + opacity(0.5)
- 解锁动画: scale弹跳 + 发光脉冲
```

### 6.4 筛选标签组件 (filter-pill)
```
样式: pill形, padding: 5px 12px, border-radius: 9999px
状态:
- default: bg-card, border-default, text-secondary
- hover: bg-elevated, border-hover
- active: bg-accent-600, border-accent-500, text-primary
动效: 状态切换 180ms ease
```

### 6.5 价格段位可视化 (price-tier)
```
5级阶梯条: 每格 32x6px, 圆角3px
激活: 琥珀金填充
交互: 点击选择价格上限
```

---

## 七、动画时间线汇总

| 动效名称 | 时长 | 缓动函数 | 触发时机 |
|---------|------|---------|---------|
| 流光(scan line) | 1800ms | ease-in-out | 循环(默认) / 1200ms(悬浮) |
| 卡片悬浮 | 300ms | cubic-bezier(0.4,0,0.2,1) | 鼠标悬停 |
| 雷达图展开 | 600ms | ease-out | 详情页加载 |
| 徽章翻转 | 400ms | cubic-bezier(0.4,0,0.2,1) | 悬浮/激活 |
| Modal淡入 | 400ms | ease-out | 打开详情 |
| Modal淡出 | 300ms | ease-in | 关闭详情 |
| 时间轴滑入 | 500ms | ease-out | 每条100ms延迟 |
| Toast通知 | 300ms | ease-out | 成就解锁 |
| 加载指示器 | 1400ms | ease-in-out | 循环 |
| 粒子漂浮 | 持续 | requestAnimationFrame | 页面加载后 |

---

## 八、技术待解决问题清单

### 8.1 数据层
- [ ] lz-string 压缩库引入方式(CDN/npm)
- [ ] 大数据解压性能测试(移动端)
- [ ] localStorage 缓存策略(容量限制 5MB)

### 8.2 渲染层
- [ ] Canvas雷达图 vs SVG性能对比
- [ ] 长列表虚拟滚动方案(300卡片)
- [ ] 图片 WebP格式转换(293张图)

### 8.3 动效层
- [ ] prefers-reduced-motion 降级处理
- [ ] 低性能设备(移动端)粒子系统关闭
- [ ] 60fps保真度测试

### 8.4 兼容性
- [ ] iOS Safari backdrop-filter 支持
- [ ] Safari CSS filter drop-shadow
- [ ] Firefox CSS transform preserve-3d

### 8.5 性能优化
- [ ] 首屏加载优化(代码分割)
- [ ] 内存泄漏检测(粒子系统destroy)
- [ ] Lighthouse 性能评分目标 >90

---

## 九、验收标准

### 9.1 视觉验收
- [ ] 极深黑背景 #080706 无色偏
- [ ] 琥珀金 #c6a15b 在各场景下一致性
- [ ] 流光动画流畅无卡顿
- [ ] 3D翻转无撕裂

### 9.2 功能验收
- [ ] 筛选即时响应 <100ms
- [ ] 详情页加载 <500ms
- [ ] 雷达图动效完整播放
- [ ] 成就翻转可交互

### 9.3 性能验收
- [ ] 首屏 FCP < 2s
- [ ] 交互响应 < 100ms
- [ ] 内存占用 < 150MB
- [ ] 60fps 稳定

---

## 十、版本规划

```
v5.0.0 (本版)
  ├── 极暗奢华主题
  ├── 琥珀流光动效
  ├── 全屏沉浸详情
  └── 粒子背景系统

v5.1.0 (规划)
  ├── 虚拟滚动长列表
  ├── 图片WebP优化
  └── 成就系统完善

v5.2.0 (规划)
  ├── 对比视图升级
  ├── 数据离线缓存
  └── PWA支持
```

---

*文档版本: v5.0.0*
*创建日期: 2026-05-26*
*负责人: 世界烈酒图鉴开发组*