const THEME_KEY = 'app_theme'
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
}
const THEME_COLORS = {
  LIGHT: {
    navBg: '#f5f6f8',
    navText: '#1f2329',
    pageBg: '#f5f6f8'
  },
  DARK: {
    navBg: '#12151b',
    navText: '#e5e6eb',
    pageBg: '#12151b'
  }
}
const THEME_VARS = {
  LIGHT: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f5f6f8',
    '--bg-tertiary': '#eef1f5',
    '--text-primary': '#1f2329',
    '--text-secondary': '#4e5969',
    '--text-tertiary': '#86909c',
    '--text-on-accent': '#ffffff',
    '--border-color': '#e5e6eb',
    '--border-color-subtle': '#f0f1f3',
    '--accent-primary': '#2f6bff',
    '--accent-primary-dark': '#1e40af',
    '--accent-secondary': '#3b82f6',
    '--accent-success': '#00b578',
    '--accent-warning': '#ffb200',
    '--accent-error': '#f53f3f',
    '--accent-ink': '#0a1f44',
    '--card-bg': 'rgba(255, 255, 255, 0.92)',
    '--card-bg-strong': '#ffffff',
    '--btn-primary-bg': '#2f6bff',
    '--btn-primary-text': '#ffffff',
    '--btn-secondary-bg': '#f2f3f5',
    '--btn-secondary-text': '#1f2329',
    '--btn-danger-bg': '#f53f3f',
    '--btn-danger-text': '#ffffff',
    '--glass-stroke': 'rgba(31, 35, 41, 0.08)'
  },
  DARK: {
    '--bg-primary': '#0f1115',
    '--bg-secondary': '#12151b',
    '--bg-tertiary': '#1a1f27',
    '--text-primary': '#e5e6eb',
    '--text-secondary': '#c0c4cc',
    '--text-tertiary': '#8f96a3',
    '--text-on-accent': '#0f1115',
    '--border-color': '#2a2f3a',
    '--border-color-subtle': '#1f242e',
    '--accent-primary': '#4c8dff',
    '--accent-primary-dark': '#2f6bff',
    '--accent-secondary': '#3b82f6',
    '--accent-success': '#00b578',
    '--accent-warning': '#ffb200',
    '--accent-error': '#f56c6c',
    '--accent-ink': '#e5e6eb',
    '--card-bg': 'rgba(20, 23, 30, 0.92)',
    '--card-bg-strong': '#1a1f27',
    '--btn-primary-bg': '#4c8dff',
    '--btn-primary-text': '#0b0f17',
    '--btn-secondary-bg': '#1a1f27',
    '--btn-secondary-text': '#e5e6eb',
    '--btn-danger-bg': '#f56c6c',
    '--btn-danger-text': '#1a0b0b',
    '--glass-stroke': 'rgba(229, 230, 235, 0.08)'
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
