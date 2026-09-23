import { useTheme } from '../../theme/theme.provider';

/**
 * Theme Switcher Component
 * Allows users to switch between available themes
 * Mobile-optimized with touch-friendly buttons
 */
const ThemeSwitcher = () => {
  const { currentTheme, switchTheme, availableThemes } = useTheme();

  return (
    <div className="flex items-center gap-2 p-2 bg-background-secondary rounded-lg">
      <span className="text-sm text-text-secondary hidden sm:inline">Theme:</span>
      <div className="flex gap-1">
        {availableThemes.map((themeName) => (
          <button
            key={themeName}
            onClick={() => switchTheme(themeName)}
            className={`
              px-3 py-2 rounded-md text-sm font-medium transition-colors
              min-h-[44px] min-w-[44px] touch-target
              ${currentTheme === themeName
                ? 'bg-primary text-white'
                : 'bg-background-primary text-text-primary hover:bg-background-tertiary'
              }
            `}
            aria-label={`Switch to ${themeName} theme`}
          >
            {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher;

