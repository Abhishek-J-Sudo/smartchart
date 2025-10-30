// Theme switching functionality

const THEMES = {
  'deep-blue': {
    name: 'Deep Blue',
    colors: {
      primary: '#1e3a8a',
      primaryDark: '#1e40af',
      primaryLight: '#3b82f6',
      shadowPrimary: 'rgba(30, 58, 138, 0.3)',
      shadowLight: 'rgba(30, 58, 138, 0.2)',
      shadowHover: 'rgba(30, 64, 175, 0.4)'
    }
  },
  'indigo': {
    name: 'Indigo Purple',
    colors: {
      primary: '#4338ca',
      primaryDark: '#3730a3',
      primaryLight: '#6366f1',
      shadowPrimary: 'rgba(67, 56, 202, 0.3)',
      shadowLight: 'rgba(67, 56, 202, 0.2)',
      shadowHover: 'rgba(55, 48, 163, 0.4)'
    }
  },
  'teal': {
    name: 'Teal Fresh',
    colors: {
      primary: '#0d9488',
      primaryDark: '#0f766e',
      primaryLight: '#14b8a6',
      shadowPrimary: 'rgba(13, 148, 136, 0.3)',
      shadowLight: 'rgba(13, 148, 136, 0.2)',
      shadowHover: 'rgba(15, 118, 110, 0.4)'
    }
  },
  'slate': {
    name: 'Slate Gray',
    colors: {
      primary: '#334155',
      primaryDark: '#1e293b',
      primaryLight: '#475569',
      shadowPrimary: 'rgba(51, 65, 85, 0.3)',
      shadowLight: 'rgba(51, 65, 85, 0.2)',
      shadowHover: 'rgba(30, 41, 59, 0.4)'
    }
  },
  'emerald': {
    name: 'Emerald Green',
    colors: {
      primary: '#059669',
      primaryDark: '#047857',
      primaryLight: '#10b981',
      shadowPrimary: 'rgba(5, 150, 105, 0.3)',
      shadowLight: 'rgba(5, 150, 105, 0.2)',
      shadowHover: 'rgba(4, 120, 87, 0.4)'
    }
  },
  'violet': {
    name: 'Violet Bold',
    colors: {
      primary: '#7c3aed',
      primaryDark: '#6d28d9',
      primaryLight: '#8b5cf6',
      shadowPrimary: 'rgba(124, 58, 237, 0.3)',
      shadowLight: 'rgba(124, 58, 237, 0.2)',
      shadowHover: 'rgba(109, 40, 217, 0.4)'
    }
  },
  'amber': {
    name: 'Amber Warm',
    colors: {
      primary: '#d97706',
      primaryDark: '#b45309',
      primaryLight: '#f59e0b',
      shadowPrimary: 'rgba(217, 119, 6, 0.3)',
      shadowLight: 'rgba(217, 119, 6, 0.2)',
      shadowHover: 'rgba(180, 83, 9, 0.4)'
    }
  },
  'rose': {
    name: 'Rose Pink',
    colors: {
      primary: '#e11d48',
      primaryDark: '#be123c',
      primaryLight: '#f43f5e',
      shadowPrimary: 'rgba(225, 29, 72, 0.3)',
      shadowLight: 'rgba(225, 29, 72, 0.2)',
      shadowHover: 'rgba(190, 18, 60, 0.4)'
    }
  },
  'cyan': {
    name: 'Cyan Cool',
    colors: {
      primary: '#0891b2',
      primaryDark: '#0e7490',
      primaryLight: '#06b6d4',
      shadowPrimary: 'rgba(8, 145, 178, 0.3)',
      shadowLight: 'rgba(8, 145, 178, 0.2)',
      shadowHover: 'rgba(14, 116, 144, 0.4)'
    }
  },
  'dark': {
    name: 'Dark Mode',
    colors: {
      primary: '#18181b',
      primaryDark: '#09090b',
      primaryLight: '#27272a',
      shadowPrimary: 'rgba(24, 24, 27, 0.5)',
      shadowLight: 'rgba(24, 24, 27, 0.3)',
      shadowHover: 'rgba(9, 9, 11, 0.6)'
    }
  }
};

/**
 * Apply a theme to the application
 */
function applyTheme(themeName) {
  const theme = THEMES[themeName];
  if (!theme) return;

  const root = document.documentElement;

  // Update CSS variables
  root.style.setProperty('--primary-color', theme.colors.primary);
  root.style.setProperty('--primary-dark', theme.colors.primaryDark);
  root.style.setProperty('--primary-light', theme.colors.primaryLight);
  root.style.setProperty('--shadow-primary', theme.colors.shadowPrimary);
  root.style.setProperty('--shadow-light', theme.colors.shadowLight);
  root.style.setProperty('--shadow-hover', theme.colors.shadowHover);
  root.style.setProperty('--text-primary', theme.colors.primary);

  // Save to localStorage
  localStorage.setItem('smartchart-theme', themeName);
}

/**
 * Load saved theme or default theme
 */
function loadSavedTheme() {
  const savedTheme = localStorage.getItem('smartchart-theme') || 'deep-blue';
  const themeSelect = document.getElementById('theme-select');

  if (themeSelect) {
    themeSelect.value = savedTheme;
  }

  applyTheme(savedTheme);
}

/**
 * Initialize theme switcher
 */
function initThemeSwitcher() {
  const themeSelect = document.getElementById('theme-select');

  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      applyTheme(e.target.value);
    });
  }

  // Load saved theme on page load
  loadSavedTheme();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initThemeSwitcher);
