/**
 * Similar to URL, except without the requirement of having a valid origin/baseUrl
 */
export class RelativeURL extends URL {
  static #fakeOrigin = 'http://fakeorigin.com'

  constructor(url: string) {
    super(url, RelativeURL.#fakeOrigin)
  }

  /**
   * @deprecated Not supported in relative URL
   */
  get host(): string {
    throw new Error('host is not supported in a relative URL')
  }

  /**
   * @deprecated Not supported in relative URL
   */
  get hostname(): string {
    throw new Error('hostname is not supported in a relative URL')
  }

  get href(): string {
    return this.pathname + this.search + this.hash
  }

  /**
   * @deprecated Not supported in relative URL
   */
  get origin(): string {
    throw new Error('origin is not supported in a relative URL')
  }

  /**
   * @deprecated Not supported in relative URL
   */
  get password(): string {
    throw new Error('password is not supported in a relative URL')
  }

  /**
   * @deprecated Not supported in relative URL
   */
  get protocol(): string {
    throw new Error('protocol is not supported in a relative URL')
  }

  /**
   * @deprecated Not supported in relative URL
   */
  get port(): string {
    throw new Error('port is not supported in a relative URL')
  }

  /**
   * @deprecated Not supported in relative URL
   */
  get username(): string {
    throw new Error('username is not supported in a relative URL')
  }

  get path(): string {
    return this.pathname
  }

  get pathOnly(): string {
    return this.pathname
  }

  get fullPath(): string {
    return this.href
  }

  toJSON(): string {
    return this.href
  }

  toString(): string {
    return this.href
  }

  static canParse(url: string | URL): boolean {
    return URL.canParse(url, RelativeURL.#fakeOrigin)
  }

  static parse(url: string | URL): RelativeURL | null {
    if (!RelativeURL.canParse(url)) return null
    return new RelativeURL(url.toString())
  }
}
