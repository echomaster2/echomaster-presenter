# Echomasters Design System

Use this guide to replicate the Echomasters "Medical Dark Mode" aesthetic in other projects.

## 1. Typography

*   **Headings / Brand:** `Oswald` (Weights: 500, 700) - Used for titles, technical labels, and buttons.
*   **Body / UI:** `Inter` (Weights: 300, 400, 500, 600) - Used for long form text and data.

**Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Oswald:wght@500;700&display=swap" rel="stylesheet">
```

## 2. Color Palette

### Backgrounds
*   **App Background:** `#0b1120` (Deep Navy)
*   **Panel/Card Background:** `#0f172a` (Slate 900)
*   **Element Border:** `#334155` (Slate 700)

### Accents
*   **Primary (Medical Cyan):** `#06b6d4` (Cyan 500)
*   **Secondary (Alert Orange):** `#f97316` (Orange 500)
*   **Text (Muted):** `#94a3b8` (Slate 400)
*   **Text (Highlight):** `#f8fafc` (Slate 50)

## 3. Tailwind Configuration (Copy & Paste)

Add this to your `tailwind.config.js` or inside the `<script>` tag for CDN usage.

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        'echo-dark': '#0b1120',
        'echo-panel': '#0f172a',
        'echo-cyan': '#06b6d4',
        'echo-orange': '#f97316',
      },
      fontFamily: {
        brand: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      }
    }
  }
}
```

## 4. Common UI Component Styles

**Technical Card:**
```html
<div class="bg-echo-panel border border-slate-700 rounded-sm shadow-xl relative">
  <!-- Content -->
</div>
```

**Primary Button (Orange):**
```html
<button class="bg-echo-orange hover:bg-orange-600 text-white font-brand font-bold uppercase tracking-wider px-6 py-3 rounded-sm shadow-lg transition-all">
  Start Action
</button>
```

**Secondary Button (Ghost/Outline):**
```html
<button class="border border-slate-700 text-slate-400 hover:text-white hover:border-echo-cyan transition-colors font-brand uppercase tracking-wider px-6 py-3 rounded-sm">
  Cancel
</button>
```

**CRT Overlay Effect (CSS):**
```css
.scanlines {
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
              linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 2px, 3px 100%;
  pointer-events: none;
}
```