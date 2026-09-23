# Theme System Documentation

## Centralized Theme Management

All theme colors, spacing, and design tokens are centralized in one place for easy maintenance.

## File Structure

```
src/theme/
├── theme.constants.js    # Centralized theme constants (USE THIS)
├── theme.provider.jsx     # Theme context provider
├── theme.config.js        # Theme configuration
├── themes/
│   ├── custom.theme.js   # Main theme definition
│   ├── light.theme.js    # Light theme
│   └── dark.theme.js     # Dark theme
└── README.md             # This file
```

## Usage

### Import Theme Constants

```javascript
import { theme } from '../theme/theme.constants';

// Use in inline styles
<div style={{ backgroundColor: theme.colors.primary }}>
<div style={{ color: theme.colors.textPrimary }}>

// Use in Tailwind classes (via CSS variables)
<div className="bg-primary text-white">
```

### Available Theme Colors

```javascript
theme.colors.primary          // #1e6262 (Main teal)
theme.colors.primaryDark      // #104848
theme.colors.primaryLight      // #2d767f
theme.colors.background       // #ffffff
theme.colors.backgroundSecondary  // #f1f1f1
theme.colors.textPrimary      // #1a1a1a
theme.colors.textSecondary    // #4a4a4a
theme.colors.textInverse      // #ffffff
theme.colors.white            // #ffffff
theme.colors.black            // #000000
theme.colors.success          // #28a745
theme.colors.error            // #dc3545
theme.colors.warning          // #ffc107
```

### Changing Theme Colors

To change theme colors, edit **only** these files:

1. **`src/theme/themes/custom.theme.js`** - Main theme definition
   - Change `primary.DEFAULT` to change main teal color
   - All other colors will update automatically

2. **`src/theme/theme.constants.js`** - Exported constants
   - This file imports from custom.theme.js
   - Update if you add new color constants

### Example: Change Primary Color

```javascript
// In src/theme/themes/custom.theme.js
primary: {
  DEFAULT: '#YOUR_NEW_COLOR',  // Change this
  dark: '#DARKER_SHADE',
  light: '#LIGHTER_SHADE',
}
```

All pages will automatically use the new color!

## Best Practices

1. ✅ **DO**: Use `theme.colors.primary` in inline styles
2. ✅ **DO**: Use Tailwind classes like `bg-primary` when possible
3. ✅ **DO**: Import from `theme.constants.js` for consistency
4. ❌ **DON'T**: Hardcode colors like `#1e6262` directly
5. ❌ **DON'T**: Use different color values in different files

## Files Updated

All these files now use centralized theme:
- ✅ HomePage.jsx
- ✅ LoginPage.jsx
- ✅ RegisterPage.jsx
- ✅ VerifyOTPPage.jsx
- ✅ ProfileDashboardPage.jsx
- ✅ ProfileCompletePage.jsx
- ✅ BottomNavbar.jsx
- ✅ Button.jsx
- ✅ Input.jsx
- ✅ PageLayout.jsx
- ✅ ProtectedRoute.jsx

## Quick Reference

```javascript
// Import
import { theme } from '../theme/theme.constants';

// Use primary color
style={{ backgroundColor: theme.colors.primary }}
style={{ color: theme.colors.primary }}
className="bg-primary"  // Tailwind (via CSS variables)

// Use text colors
style={{ color: theme.colors.textPrimary }}
className="text-text-primary"  // Tailwind

// Use background colors
style={{ backgroundColor: theme.colors.background }}
className="bg-background-primary"  // Tailwind
```

