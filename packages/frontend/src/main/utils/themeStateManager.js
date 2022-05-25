import Vue from 'vue'

/**
 * Global theme state manager with persistance to localStorage
 */

const LOCAL_STORAGE_KEY = 'darkModeEnabled'
const THEME_DARK = 'dark'
const THEME_LIGHT = 'light'

const themeState = Vue.observable({
  dark: false
})

export function setDarkTheme(val, save = false) {
  themeState.dark = !!val

  if (!save) return
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, val ? THEME_DARK : THEME_LIGHT)
  } catch (e) {
    // Suppressing missing localStorage errors
  }
}

export function isDarkTheme() {
  return !!themeState.dark
}

export function initialize() {
  try {
    const storageSetting = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (storageSetting) {
      setDarkTheme(storageSetting === THEME_DARK)
      return
    }
  } catch (e) {
    // Suppressing missing localStorage errors
  }

  const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (darkMediaQuery) {
    setDarkTheme(true)
    return
  }
}
