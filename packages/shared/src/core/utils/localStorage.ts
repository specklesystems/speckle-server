import type { Nullable } from '../helpers/utilityTypes.js'

function checkLocalStorageAvailability(): boolean {
  try {
    const testKey = '___localStorageAvailabilityTest'
    const storage = globalThis.localStorage
    storage.setItem(testKey, testKey)
    storage.getItem(testKey)
    storage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

/**
 * In memory implementation of the Storage interface, for use when LocalStorage
 * isn't available
 */
class FakeStorage implements Storage {
  #internalStorage = new Map<string, string>()

  clear(): void {
    this.#internalStorage.clear()
  }

  getItem(key: string): string | null {
    return this.#internalStorage.get(key) || null
  }

  key(index: number): string | null {
    return [...this.#internalStorage.keys()][index] || null
  }

  removeItem(key: string): void {
    this.#internalStorage.delete(key)
  }

  setItem(key: string, value: string): void {
    this.#internalStorage.set(key, value)
  }

  get length(): number {
    return this.#internalStorage.size
  }
}

/**
 * Whether or not the local storage is available in this session
 */
const isLocalStorageAvailable = checkLocalStorageAvailability()

/**
 * Localstorage (real or faked) to use in this session
 */
const internalStorage: Storage = isLocalStorageAvailable
  ? globalThis.localStorage
  : new FakeStorage()

/**
 * Utility for nicer reads/writes from/to LocalStorage without having to worry about the browser
 * throwing a hissy fit because the page is opened in Incognito mode or node not having localStorage at all
 */
export const SafeLocalStorage = {
  get(key: string): Nullable<string> {
    return internalStorage.getItem(key)
  },

  set(key: string, value: string): void {
    internalStorage.setItem(key, value)
  },

  remove(key: string): void {
    internalStorage.removeItem(key)
  },

  /**
   * Flag for telling if we're using a real localStorage or faking it with a basic in-memory collection
   */
  isRealLocalStorage: isLocalStorageAvailable
}
