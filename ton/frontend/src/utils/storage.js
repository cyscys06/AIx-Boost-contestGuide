/**
 * LocalStorage utility functions with versioning and error handling
 */

const STORAGE_KEYS = {
  PROFILE: 'contest_guide_profile',
  CONTESTS: 'contest_guide_contests',
  ALL_CONTESTS: 'contest_guide_all_contests',
  ACTIONS: 'contest_guide_actions',
  SETTINGS: 'contest_guide_settings',
  ANALYSES: 'contest_guide_analyses'
}

const CURRENT_VERSION = '1.0'

/**
 * Save data to LocalStorage with version info
 */
export function saveToStorage(key, data) {
  try {
    const wrapped = {
      version: CURRENT_VERSION,
      updatedAt: new Date().toISOString(),
      data
    }
    localStorage.setItem(key, JSON.stringify(wrapped))
    return true
  } catch (error) {
    console.error(`Failed to save to storage [${key}]:`, error)
    return false
  }
}

/**
 * Load data from LocalStorage
 */
export function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    
    const parsed = JSON.parse(raw)
    // Handle versioned and non-versioned data
    if (parsed.version && parsed.data !== undefined) {
      return parsed.data
    }
    return parsed
  } catch (error) {
    console.error(`Failed to load from storage [${key}]:`, error)
    return null
  }
}

/**
 * Remove data from LocalStorage
 */
export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Failed to remove from storage [${key}]:`, error)
    return false
  }
}

// Profile-specific functions
export const profileStorage = {
  save: (profile) => saveToStorage(STORAGE_KEYS.PROFILE, profile),
  load: () => loadFromStorage(STORAGE_KEYS.PROFILE),
  clear: () => removeFromStorage(STORAGE_KEYS.PROFILE)
}

// Contests-specific functions
export const contestsStorage = {
  save: (contests) => saveToStorage(STORAGE_KEYS.CONTESTS, contests),
  load: () => loadFromStorage(STORAGE_KEYS.CONTESTS) || [],
  clear: () => removeFromStorage(STORAGE_KEYS.CONTESTS)
}

// All contests (saved + unsaved) for "전체 공모전" page
export const allContestsStorage = {
  save: (contests) => saveToStorage(STORAGE_KEYS.ALL_CONTESTS, contests),
  load: () => loadFromStorage(STORAGE_KEYS.ALL_CONTESTS) || [],
  clear: () => removeFromStorage(STORAGE_KEYS.ALL_CONTESTS)
}

// Actions-specific functions
export const actionsStorage = {
  save: (actions) => saveToStorage(STORAGE_KEYS.ACTIONS, actions),
  load: () => loadFromStorage(STORAGE_KEYS.ACTIONS) || [],
  clear: () => removeFromStorage(STORAGE_KEYS.ACTIONS)
}

// Settings-specific functions
export const settingsStorage = {
  save: (settings) => saveToStorage(STORAGE_KEYS.SETTINGS, settings),
  load: () => loadFromStorage(STORAGE_KEYS.SETTINGS),
  clear: () => removeFromStorage(STORAGE_KEYS.SETTINGS)
}

export { STORAGE_KEYS }
