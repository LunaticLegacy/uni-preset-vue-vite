const THEME_KEY = 'app_theme'
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
}
const THEME_COLORS = {
  LIGHT: {
    navBg: '#F8F8F8',
    navText: '#000000',
    pageBg: '#F8F8F8'
  },
  DARK: {
    navBg: '#121212',
    navText: '#ffffff',
    pageBg: '#121212'
  }
}
const THEME_VARS = {
  LIGHT: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8f8f8',
    '--bg-tertiary': '#f5f5f5',
    '--text-primary': '#333333',
    '--text-secondary': '#666666',
    '--text-tertiary': '#999999',
    '--border-color': 'rgba(0, 0, 0, 0.06)',
    '--border-color-subtle': 'rgba(0, 0, 0, 0.04)'
  },
  DARK: {
    '--bg-primary': '#0a0a0a',
    '--bg-secondary': '#121212',
    '--bg-tertiary': '#1f1f1f',
    '--text-primary': '#ffffff',
    '--text-secondary': '#e0e0e0',
    '--text-tertiary': '#b0b0b0',
    '--border-color': 'rgba(255, 255, 255, 0.15)',
    '--border-color-subtle': 'rgba(255, 255, 255, 0.08)'
  }
}

function getTheme() {
  try {
    const stored = uni.getStorageSync(THEME_KEY)
    if (stored && (stored === THEMES.LIGHT || stored === THEMES.DARK)) {
      return stored
    }
  } catch (e) {
    // ignore storage errors
  }
  
  // Default to light theme
  return THEMES.LIGHT
}

function setTheme(theme) {
  try {
    if (theme === THEMES.LIGHT || theme === THEMES.DARK) {
      uni.setStorageSync(THEME_KEY, theme)
      applyTheme(theme)
    }
  } catch (e) {
    // ignore storage errors
  }
}

function toggleTheme() {
  const current = getTheme()
  const next = current === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
  setTheme(next)
  return next
}

function applyTheme(theme) {
  const root = typeof document !== 'undefined' ? document.documentElement : null
  const body = typeof document !== 'undefined' ? document.body : null
  const isDark = theme === THEMES.DARK
  const themeAttr = isDark ? 'dark' : 'light'
  const vars = isDark ? THEME_VARS.DARK : THEME_VARS.LIGHT
  const targets = [
    root,
    body,
    typeof document !== 'undefined' ? document.querySelector('uni-app') : null,
    typeof document !== 'undefined' ? document.getElementById('app') : null
  ].filter(Boolean)
  targets.forEach((target) => {
    target.setAttribute('data-theme', themeAttr)
    Object.entries(vars).forEach(([key, value]) => {
      target.style.setProperty(key, value)
    })
  })

  if (typeof uni !== 'undefined') {
    const colors = isDark ? THEME_COLORS.DARK : THEME_COLORS.LIGHT
    try {
      if (typeof uni.setNavigationBarColor === 'function') {
        uni.setNavigationBarColor({
          frontColor: colors.navText,
          backgroundColor: colors.navBg
        })
      }
      if (typeof uni.setBackgroundColor === 'function') {
        uni.setBackgroundColor({
          backgroundColor: colors.pageBg,
          backgroundColorTop: colors.pageBg,
          backgroundColorBottom: colors.pageBg
        })
      }
    } catch (e) {
      // ignore theme application errors
    }
  }
}

// Apply theme on module load
if (typeof uni !== 'undefined') {
  applyTheme(getTheme())
}

export { getTheme, setTheme, toggleTheme, applyTheme, THEMES }
