# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Planneo
**Generated:** 2026-07-21 17:21:03
**Category:** E-commerce Luxury

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#7B2CBF` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#C77DFF` | `--color-secondary` |
| Accent mint | `#06D6A0` | `--color-planneo-mint` (éxito, precios, disponibilidad) |
| Accent gold | `#FFC727` | `--color-planneo-gold` (Destacado, ratings) |
| Primary hover | `#8E44D6` | `--color-planneo-500` (hover ACLARA, nunca oscurece) |
| Background | `#0E0B1A` | `--color-background` |
| Foreground | `#F5F0FF` | `--color-foreground` |
| Muted | `rgba(245,240,255,0.6)` | `--color-muted` |
| Border | `rgba(245,240,255,0.1)` | `--color-border` |
| Destructive | `#F87171` (red-400 sobre oscuro) | `--color-destructive` |
| Ring | `#C77DFF` | `--color-ring` |

**Color Notes:** OVERRIDE DE MARCA (2026-07-21) — Planneo usa el morado de marca (#4A148C → #7B2CBF → #C77DFF, gradiente `--v4-brand-gradient`) con acento verde #06D6A0 sobre tema oscuro "V4" (#0E0B1A / superficie #15101F, vidrio `v4-glass`). La paleta rosa generada por el engine NO aplica: Planneo cubre bodas, XV años, corporativos y graduaciones, no solo bodas. Rojos/ámbar en variantes -300/-400 para contraste sobre oscuro. Refinado 2026-07-21: oro #FFC727 reservado para "Destacado"/ratings (jerarquía: morado = acción, oro = destacado, mint = dinero/disponibilidad); hovers de CTA aclaran a #8E44D6; piso de contraste para texto tenue = white/50 (AA), white/35 solo placeholders. Ramp completo en @theme de globals.css como --color-planneo-*.

### Typography

- **Heading Font:** Space Grotesk (utilidad `v4-display`, tracking -0.04em); serif de acento: Fraunces itálica (`v4-serif`); etiquetas mono: `v4-mono`
- **Body Font:** Inter
- **Mood:** premium, moderno, celebración, marketplace oscuro con Liquid Glass
- **Google Fonts:** [Great Vibes + Cormorant Infant](https://fonts.googleapis.com/css2?family=Cormorant+Infant:wght@300;400;500;600;700&family=Great+Vibes&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Infant:wght@300;400;500;600;700&family=Great+Vibes&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #A16207;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #DB2777;
  border: 2px solid #DB2777;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #FDF2F8;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #DB2777;
  outline: none;
  box-shadow: 0 0 0 3px #DB277720;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Liquid Glass

**Keywords:** Flowing glass, morphing, smooth transitions, fluid effects, translucent, animated blur, iridescent, chromatic aberration

**Best For:** Premium SaaS, high-end e-commerce, creative platforms, branding experiences, luxury portfolios

**Key Effects:** Morphing elements (SVG/CSS), fluid animations (400-600ms curves), dynamic blur (backdrop-filter), color transitions

### Page Pattern

**Pattern Name:** Marketplace / Directory

- **Conversion Strategy:** Search bar is the CTA. Reduce friction to search. Popular searches suggestions.
- **CTA Placement:** Hero Search Bar + Navbar 'List your item'
- **Section Order:** 1. Hero (Search focused), 2. Categories, 3. Featured Listings, 4. Trust/Safety, 5. CTA (Become a host/seller)

---

## Anti-Patterns (Do NOT Use)

- ❌ Vibrant & Block-based
- ❌ Playful colors

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
