# World Liquor Gallery v3.2.0 — SPEC

> 黑髪漆面 · 香槟金蕴 · 奢华酒款图鉴
> Black Lacquer · Champagne Gold · Premium Liquor Encyclopedia

---

## 1. Design Tokens (Luxury Adaptation)

| Token | Value | Usage |
|---|---|---|
| `--bg-deepest` | `#080706` | Page background (black lacquer) |
| `--bg-deep` | `#0f0d0a` | Elevated surfaces |
| `--bg-card` | `#151310` | Card / panel backgrounds |
| `--bg-elevated` | `#1c1813` | Hover / active surfaces |
| `--bg-glass` | `rgba(8, 7, 6, 0.88)` | Glassmorphism overlays |
| `--accent` | `#c6a15b` | Champagne gold — primary accent |
| `--accent-soft` | `#d8b87a` | Gold hover / lighter variant |
| `--accent-dim` | `#9a7a3f` | Gold muted / darker variant |
| `--accent-bg` | `rgba(198, 161, 91, 0.10)` | Gold background on dark |
| `--accent-border` | `rgba(198, 161, 91, 0.25)` | Gold border on dark |
| `--text-primary` | `#fff8ea` | Warm off-white body text |
| `--text-secondary` | `#d8cdb7` | Soft cream secondary text |
| `--text-muted` | `#9f927c` | Muted neutral text |
| `--text-subtle` | `#6a5f4e` | Subtle / placeholder text |
| `--border-subtle` | `rgba(198, 161, 91, 0.08)` | Subtle gold tinted border |
| `--border-default` | `#282217` | Default border |
| `--border-hover` | `#3a3020` | Hover border |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.6)` | Small shadow |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.6)` | Medium shadow |
| `--shadow-lg` | `0 12px 40px rgba(0,0,0,0.7)` | Large shadow |
| `--shadow-xl` | `0 24px 80px rgba(0,0,0,0.8)` | XL shadow |
| `--glow-accent` | `0 0 20px rgba(198,161,91,0.2)` | Gold glow |
| `--glow-accent-strong` | `0 0 40px rgba(198,161,91,0.25), 0 0 80px rgba(198,161,91,0.1)` | Strong gold glow |

## 2. Typography

| Element | Font | Weight | Size |
|---|---|---|---|
| Page title / H1 | `Playfair Display` | 700 | 2.5rem |
| Card name / H3 | `Playfair Display` | 600 | 1.2rem |
| Modal title / H2 | `Playfair Display` | 700 | 1.8rem |
| Sidebar section | `Playfair Display` | 600 | 0.8rem |
| Body / labels | `Avenir Next`, `Inter`, sans-serif | 400 | 0.9rem |
| English names | `Playfair Display`, italic | 400 | 0.8rem |
| Data values | `Playfair Display` | 600 | 1.4rem |

## 3. Spacing (8pt baseline, generous)

| Token | Value |
|---|---|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 36px |
| `--space-2xl` | 56px |
| `--space-3xl` | 80px |

## 4. Radius

| Token | Value |
|---|---|
| `--radius-sm` | 8px |
| `--radius-md` | 12px |
| `--radius-lg` | 18px |
| `--radius-xl` | 24px |
| `--radius-2xl` | 36px |
| `--radius-full` | 9999px |

## 5. Animation

| Token | Value |
|---|---|
| `--ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--ease-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` |
| `--transition-fast` | 180ms ease |
| `--transition-normal` | 300ms ease |
| `--transition-slow` | 500ms ease |

## 6. Component Design

### Cards
- Background: `#151310` with `1px` gold-tinted border (`rgba(198,161,91,0.15)`)
- Border-radius: `--radius-xl` (24px)
- Hover: translateY(-6px), border color `rgba(198,161,91,0.4)`, box-shadow with gold glow
- Image area: 200px height, warm gradient from `#1c1813` to `#0f0d0a`
- Badge: gold background (`linear-gradient(135deg, #c6a15b, #9a7a3f)`), dark text
- Fav button: dark circular, gold on active

### Header
- Sticky, glassmorphism background `rgba(8, 7, 6, 0.92)` with 20px blur
- Gold accent bottom border `rgba(198,161,91,0.15)`
- Large Playfair Display brand title
- Search bar: dark background, gold border on focus

### Sidebar
- 260px width, gold-tinted `rgba(198,161,91,0.06)` border-right
- Section titles in Playfair Display uppercase, gold color
- Tag chips: dark background, gold border, gold hover

### Filter Panel
- Glassmorphism background with gold border
- Filter chips: gold gradient active state
- Gold accent on selects and interactive elements

### Modal
- Dark card background, gold border
- Gold accent section dividers
- Playfair Display for titles
- Gold gradient for primary buttons

### Radar Chart
- Gold grid lines (`rgba(198,161,91,0.15)`)
- Gold data polygon fill (`rgba(198,161,91,0.1)`) with gold stroke
- Gold labels

### Buttons
- Primary: gold gradient (`#c6a15b` → `#9a7a3f`)
- Secondary: dark with gold border
- Hover: stronger gold glow

## 7. Page Structure (unchanged from v3.1.0)

- `initial-loading` → splash screen
- `header` → sticky nav with brand, search, actions
- `app-layout` → flex container
  - `sidebar` → filters, stats, rankings
  - `main-content` → hero, filter-bar, card-grid, empty-state
- `notes-panel` → right-side tasting notes
- `favorites-bar` → left fixed fav/compare/folder
- Multiple modals: detail, compare, tasting, achievements, radar, pairing, feedback, video, timeline, region-chart, price-history
- `toast` notifications
- Bottom mobile tabs
- Compare bar

## 8. Features Preserved (no changes)

- 300+ liquor entries (loaded from `baijiu_data.json`)
- Full-text search with autocomplete & history
- Multi-type, region, price-tier, flavor filtering
- Sort: default, price, score, ABV, favorites, region, name
- Grid / list view toggle
- Favorites with folders
- Tasting notes with CRUD
- 6-axis radar flavor charts
- Compare up to 4 liquors
- Achievement system
- Keyboard navigation
- URL param sharing
- Social share / poster export
- Image lazy loading
- Virtual scrolling (for >100 items)
- Auto dark mode by time
- LocalStorage persistence
- Data export/import
- Theme toggle (light/dark)
- 5-element (Wu Xing) classification
- Detail modal with 6 tabs
- Pairing suggestions
- Feedback form
- Video / timeline / price-history / region-chart modals

## 9. Version Bumps

| File | From | To |
|---|---|---|
| `index.html` inline style comment | v3.1.0 | v3.2.0 |
| `index.html` script comment | v3.0.6 | v3.2.0 |
| `index.html` header version | v2.6.0 | v3.2.0 |
| `index.html` about dialog | v3.0.1 | v3.2.0 |
| `styles.css` file header | v3.1.0 | v3.2.0 |
| `SPEC.md` | new | v3.2.0 |
