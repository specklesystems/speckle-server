import { Nullable } from '@/helpers/typeHelpers'

function checkLocalStorageAvailability(): boolean {
  try {
    const testKey = '___localStorageAvailabilityTest'
    const storage = window.localStorage
    storage.setItem(testKey, testKey)
    storage.getItem(testKey)
    storage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Whether or not the local storage is available in this session
 */
const isLocalStorageAvailable = checkLocalStorageAvailability()

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
 * Utility for nicer reads/writes from/to LocalStorage without having to worry about the browser
 * throwing a hissy fit because the page is opened in Incognito mode or whatever
 */
export class SpeckleLocalStorage {
  #storage: Storage

  constructor() {
    if (isLocalStorageAvailable) {
      this.#storage = window.localStorage
    } else {
      const fakeStorage: Storage = window.fakeLocalStorage || new FakeStorage()
      window.fakeLocalStorage = fakeStorage
      this.#storage = fakeStorage
    }
  }

  get(key: string): Nullable<string> {
    return this.#storage.getItem(key)
  }

  set(key: string, value: string): void {
    this.#storage.setItem(key, value)
  }

  remove(key: string): void {
    this.#storage.removeItem(key)
  }
}
