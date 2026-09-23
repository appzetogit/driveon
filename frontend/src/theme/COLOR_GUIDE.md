# Premium Color Theme Guide

## 🎨 Centralized Color Management

**All colors are managed from a single source:** `frontend/src/theme/colors.js`

This ensures consistency across the entire application. To change any color, edit only the `colors.js` file.

## 📋 Color Palette Analysis

Based on the provided premium color codes, here's how they're mapped:

| Color Code | Usage | Variable |
|------------|-------|----------|
| `#1c205c` | **Primary** - Main brand color | `primary.DEFAULT` |
| `#1a1c45` | **Primary Dark** - Darker variants | `primary.dark` |
| `#2693b9` | **Primary Light** - Lighter variants | `primary.light` |
| `#21598b` | **Secondary** - Supporting elements | `secondary.DEFAULT` |
| `#25b8d7` | **Accent** - Highlights, CTAs, Focus | `accent.DEFAULT` |
| `#2377a4` | **Info** - Informational elements | `info.DEFAULT` |
| `#283b61` | **Neutral Dark** - Borders, shadows | `neutral.dark` |

## 🚀 Usage

### Import Theme Constants

```javascript
import { theme } from '../theme/theme.constants';

// Use in inline styles
<div style={{ backgroundColor: theme.colors.primary }}>
<div style={{ color: theme.colors.accent }}>

// Use in Tailwind classes (via CSS variables)
<div className="bg-primary text-white">
```

### Import Direct Colors

```javascript
import premiumColors from '../theme/colors';

// Access specific color shades
<div style={{ backgroundColor: premiumColors.primary[500] }}>
<div style={{ borderColor: premiumColors.accent.DEFAULT }}>
```

## 🎯 Color Roles

### Primary Colors (`#1c205c`)
- Main brand color
- Headers, primary buttons
- Main navigation elements
- Brand identity

### Accent Colors (`#25b8d7`)
- Call-to-action buttons
- Focus states
- Highlights
- Interactive elements

### Secondary Colors (`#21598b`)
- Supporting UI elements
- Secondary buttons
- Cards and containers
- Subtle backgrounds

### Info Colors (`#2377a4`)
- Informational messages
- Info badges
- Help text
- Status indicators

## 📁 File Structure

```
frontend/src/theme/
├── colors.js              # ⭐ SINGLE SOURCE OF TRUTH - All colors here
├── theme.constants.js     # Exported theme constants
├── themes/
│   ├── custom.theme.js   # Main theme (imports from colors.js)
│   ├── light.theme.js    # Light theme variant
│   └── dark.theme.js     # Dark theme variant
└── COLOR_GUIDE.md        # This file
```

## 🔧 Changing Colors

### To Change Any Color:

1. **Open** `frontend/src/theme/colors.js`
2. **Find** the color you want to change
3. **Update** the hex value
4. **Save** - Changes apply automatically across the app

### Example:

```javascript
// In colors.js
export const premiumColors = {
  primary: {
    DEFAULT: '#1c205c', // Change this to update primary color everywhere
    // ...
  }
}
```

## ✅ Best Practices

1. ✅ **DO**: Use `theme.colors` from `theme.constants.js`
2. ✅ **DO**: Import colors from `colors.js` for direct access
3. ✅ **DO**: Use CSS variables for Tailwind classes
4. ❌ **DON'T**: Hardcode color values in components
5. ❌ **DON'T**: Create duplicate color definitions

## 🎨 Color Scale System

Each color has a scale from 50 (lightest) to 900 (darkest):

- `50-100`: Very light backgrounds
- `200-300`: Light backgrounds, hover states
- `400-500`: Default/primary shade
- `600-700`: Darker variants
- `800-900`: Darkest shades

## 📱 Responsive Colors

Colors automatically adapt based on theme:
- **Light Theme**: Uses standard color values
- **Dark Theme**: Uses lighter variants for better contrast

## 🔍 Quick Reference

```javascript
// Primary Brand Colors
theme.colors.primary        // #1c205c
theme.colors.primaryDark    // #1a1c45
theme.colors.primaryLight   // #2693b9

// Secondary Colors
theme.colors.secondary      // #21598b
theme.colors.secondaryDark  // #1a4770
theme.colors.secondaryLight // #4d9cbf

// Accent & Highlights
theme.colors.accent         // #25b8d7
theme.colors.accentDark     // #1e93ac
theme.colors.accentLight    // #4dcbe7

// Info Colors
theme.colors.info           // #2377a4

// Backgrounds
theme.colors.background           // #ffffff
theme.colors.backgroundSecondary  // #f8f9fa
theme.colors.backgroundDark       // #1a1c45
```

## 💡 Usage Examples

### Using Primary and Secondary Colors

```javascript
import { theme } from '../theme/theme.constants';

// Primary color (main brand)
<button style={{ backgroundColor: theme.colors.primary }}>Primary Button</button>

// Secondary color (supporting elements)
<button style={{ backgroundColor: theme.colors.secondary }}>Secondary Button</button>

// Accent color (highlights)
<button style={{ backgroundColor: theme.colors.accent }}>Accent Button</button>
```

### Direct Import

```javascript
import { primary, secondary, accent } from '../theme/theme.constants';

<div style={{ backgroundColor: primary }}>Primary</div>
<div style={{ backgroundColor: secondary }}>Secondary</div>
<div style={{ backgroundColor: accent }}>Accent</div>
```

---

**Remember**: All colors are centralized in `colors.js` - this is your single source of truth! 🎯

