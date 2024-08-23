// POLYFILLS
import 'core-js'
import 'regenerator-runtime/runtime'

import {
  ObjectLoaderConfigurationError,
  ObjectLoaderRuntimeError
} from './errors/index.js'
import { polyfillReadableStreamForAsyncIterator } from './helpers/stream.js'
import { chunk, isString } from '#lodash'
/**
 * Simple client that streams object info from a Speckle Server.
 * TODO: Object construction progress reporting is weird.
 */

class ObjectLoader {
  /**
   * Creates a new object loader instance.
   * @param {*} param0
   */
  constructor({
    serverUrl,
    streamId,
    token,
    objectId,
    options = {
      enableCaching: true,
      fullyTraverseArrays: false,
      excludeProps: [],
      fetch: null,
      customLogger: undefined,
      customWarner: undefined
    }
  }) {
    this.logger = options.customLogger || console.log
    this.warner = options.customWarner || console.warn

    this.INTERVAL_MS = 20
    this.TIMEOUT_MS = 180000 // three mins

    this.serverUrl = serverUrl || globalThis?.location?.origin
    if (!this.serverUrl) {
      throw new ObjectLoaderConfigurationError('Invalid serverUrl specified!')
    }

    this.streamId = streamId
    this.objectId = objectId
    if (!this.streamId) {
      throw new ObjectLoaderConfigurationError('Invalid streamId specified!')
    }
    if (!this.objectId) {
      throw new ObjectLoaderConfigurationError('Invalid objectId specified!')
    }

    this.logger('Object loader constructor called!')

    /** I don't think the object-loader should read the token from local storage, since there is no
     *  builtin mechanism that sets it in the first place. So you're reading a key from the local storage
     *  and hoping it will magically be there.
     */
    // try {
    //   this.token = token || SafeLocalStorage.get('AuthToken')
    // } catch (error) {
    //   // Accessing localStorage may throw when executing on sandboxed document, ignore.
    // }
    this.token = token

    this.headers = {
      Accept: 'text/plain'
    }

    if (this.token) {
      this.headers['Authorization'] = `Bearer ${this.token}`
    }

    this.requestUrlRootObj = `${this.serverUrl}/objects/${this.streamId}/${this.objectId}/single`
    this.requestUrlChildren = `${this.serverUrl}/api/getobjects/${this.streamId}`
    this.promises = []
    this.intervals = {}
    this.buffer = []
    this.isLoading = false
    this.totalChildrenCount = 0
    this.traversedReferencesCount = 0
    this.options = options
    this.options.numConnections = this.options.numConnections || 4

    /** @type {IDBDatabase | null} */
    this.cacheDB = null

    this.lastAsyncPause = Date.now()
    this.existingAsyncPause = null

    // we can't simply bind fetch to this.fetch, so instead we have to do some acrobatics:
    // https://stackoverflow.com/questions/69337187/uncaught-in-promise-typeerror-failed-to-execute-fetch-on-workerglobalscope#comment124731316_69337187
    this.preferredFetch = options.fetch

    /** @type {globalThis.fetch} */
    this.fetch = function (...args) {
      const currentFetch = this.preferredFetch || fetch
      if (!currentFetch) {
        throw new ObjectLoaderRuntimeError(
          "Couldn't find fetch implementation! If running in a node environment, make sure you pass it in through the constructor!"
        )
      }

      return currentFetch(...args)
    }
  }

  async asyncPause() {
    // Don't freeze the UI
    // while ( this.existingAsyncPause ) {
    //   await this.existingAsyncPause
    // }
    if (Date.now() - this.lastAsyncPause >= 100) {
      this.lastAsyncPause = Date.now()
      this.existingAsyncPause = new Promise((resolve) => setTimeout(resolve, 0))
      await this.existingAsyncPause
      this.existingAsyncPause = null
      if (Date.now() - this.lastAsyncPause > 500)
        this.logger('Loader Event loop lag: ', Date.now() - this.lastAsyncPause)
    }
  }

  dispose() {
    this.buffer = []
    this.promises = []
    Object.values(this.intervals).forEach((i) => clearInterval(i.interval))
  }

  async getTotalObjectCount() {
    /** This is fine, because it gets cached */
    const rootObjJson = await this.getRawRootObject()
    /** Ideally we shouldn't to a `parse` here since it's going to pointlessly allocate
     *  But doing string gymnastics in order to get closure length is going to be the same
     *  if not even more memory constly
     */
    const rootObj = JSON.parse(rootObjJson)
    const totalChildrenCount = Object.keys(rootObj?.__closure || {}).length
    return totalChildrenCount
  }

  /**
   * Use this method to receive and construct the object. It will return the full, de-referenced and de-chunked original object.
   * @param {*} onProgress
   * @returns
   */
  async getAndConstructObject(onProgress) {
    await this.downloadObjectsInBuffer(onProgress) // Fire and forget; PS: semicolon of doom

    const rootObject = await this.getObject(this.objectId)
    return this.traverseAndConstruct(rootObject, onProgress)
  }

  /**
   * Internal function used to download all the objects in a local buffer.
   * @param {*} onProgress
   */
  async downloadObjectsInBuffer(onProgress) {
    let first = true
    let downloadNum = 0

    for await (const obj of this.getObjectIterator()) {
      if (first) {
        this.totalChildrenCount = obj.totalChildrenCount
        first = false
        this.isLoading = true
      }
      downloadNum++
      if (onProgress)
        onProgress({
          stage: 'download',
          current: downloadNum,
          total: this.totalChildrenCount
        })
    }
    this.isLoading = false
  }

  /**
   * Internal function used to recursively traverse an object and populate its references and dechunk any arrays.
   * @param {*} obj
   * @param {*} onProgress
   * @returns
   */
  async traverseAndConstruct(obj, onProgress) {
    if (!obj) return
    if (typeof obj !== 'object') return obj

    // Handle arrays
    if (Array.isArray(obj) && obj.length !== 0) {
      const arr = []
      for (const element of obj) {
        if (!element) continue
        if (typeof element !== 'object' && !this.options.fullyTraverseArrays) return obj

        // Dereference element if needed
        const deRef = element.referencedId
          ? await this.getObject(element.referencedId)
          : element
        if (element.referencedId && onProgress)
          onProgress({
            stage: 'construction',
            current:
              ++this.traversedReferencesCount > this.totalChildrenCount
                ? this.totalChildrenCount
                : this.traversedReferencesCount,
            total: this.totalChildrenCount
          })

        // Push the traversed object in the array
        arr.push(await this.traverseAndConstruct(deRef, onProgress))
      }

      // De-chunk
      if (arr[0]?.speckle_type?.toLowerCase().includes('datachunk')) {
        return arr.reduce((prev, curr) => prev.concat(curr.data), [])
      }

      return arr
    }

    // Handle objects
    // 1) Purge ignored props
    for (const ignoredProp of this.options.excludeProps) {
      delete obj[ignoredProp]
    }

    // 2) Iterate through obj
    for (const prop in obj) {
      if (typeof obj[prop] !== 'object' || obj[prop] === null) continue // leave alone primitive props

      if (obj[prop].referencedId) {
        obj[prop] = await this.getObject(obj[prop].referencedId)
        if (onProgress)
          onProgress({
            stage: 'construction',
            current:
              ++this.traversedReferencesCount > this.totalChildrenCount
                ? this.totalChildrenCount
                : this.traversedReferencesCount,
            total: this.totalChildrenCount
          })
      }

      obj[prop] = await this.traverseAndConstruct(obj[prop], onProgress)
    }

    return obj
  }

  /**
   * Internal function. Returns a promise that is resolved when the object id is loaded into the internal buffer.
   * @param {*} id
   * @returns
   */
  async getObject(id) {
    if (this.buffer[id]) return this.buffer[id]

    const promise = new Promise((resolve, reject) => {
      this.promises.push({ id, resolve, reject })
      // Only create a new interval checker if none is already present!
      if (this.intervals[id]) {
        this.intervals[id].elapsed = 0 // reset elapsed
      } else {
        const intervalId = setInterval(
          this.tryResolvePromise.bind(this),
          this.INTERVAL_MS,
          id
        )
        this.intervals[id] = { interval: intervalId, elapsed: 0 }
      }
    })
    return promise
  }

  tryResolvePromise(id) {
    this.intervals[id].elapsed += this.INTERVAL_MS
    if (this.buffer[id]) {
      for (const p of this.promises.filter((p) => p.id === id)) {
        p.resolve(this.buffer[id])
      }

      clearInterval(this.intervals[id].interval)
      delete this.intervals[id]
      // this.promises = this.promises.filter( p => p.id !== p.id ) // clearing out promises too early seems to nuke loading
      return
    }

    if (this.intervals[id].elapsed > this.TIMEOUT_MS) {
      this.warner(`Timeout resolving ${id}. HIC SVNT DRACONES.`)
      clearInterval(this.intervals[id].interval)
      this.promises.filter((p) => p.id === id).forEach((p) => p.reject())
      this.promises = this.promises.filter((p) => p.id !== p.id) // clear out
    }
  }

  async *getObjectIterator() {
    const t0 = Date.now()
    let count = 0
    for await (const line of this.getRawObjectIterator()) {
      const { id, obj } = this.processLine(line)
      this.buffer[id] = obj
      count += 1
      yield obj
    }
    this.logger(`Loaded ${count} objects in: ${(Date.now() - t0) / 1000}`)
  }

  processLine(chunk) {
    const pieces = chunk.split('\t')
    const [id, unparsedObj] = pieces

    let obj
    try {
      obj = JSON.parse(unparsedObj)
    } catch (e) {
      throw new Error(`Error parsing object ${id}: ${e.message}`)
    }

    return {
      id,
      obj
    }
  }

  supportsCache() {
    return !!(this.options.enableCaching && globalThis.indexedDB)
  }

  async setupCacheDb() {
    if (!this.supportsCache() || this.cacheDB !== null) return

    // Initialize
    await safariFix()
    const idbOpenRequest = indexedDB.open('speckle-object-cache', 1)
    idbOpenRequest.onupgradeneeded = () =>
      idbOpenRequest.result.createObjectStore('objects')
    this.cacheDB = await this.promisifyIdbRequest(idbOpenRequest)
  }

  async *getRawObjectIterator() {
    await this.setupCacheDb()

    const rootObjJson = await this.getRawRootObject()
    // this.logger("Root in: ", Date.now() - tSTART)

    yield `${this.objectId}\t${rootObjJson}`

    const rootObj = JSON.parse(rootObjJson)
    if (!rootObj.__closure) return

    let childrenIds = Object.keys(rootObj.__closure)
      .filter((id) => !id.includes('blob'))
      .sort((a, b) => rootObj.__closure[a] - rootObj.__closure[b])

    if (childrenIds.length === 0) return

    let splitHttpRequests = []

    if (childrenIds.length > 50) {
      // split into 5%, 15%, 40%, 40% (5% for the high priority children: the ones with lower minDepth)
      const splitBeforeCacheCheck = [[], [], [], []]
      let crtChildIndex = 0

      for (; crtChildIndex < 0.05 * childrenIds.length; crtChildIndex++) {
        splitBeforeCacheCheck[0].push(childrenIds[crtChildIndex])
      }
      for (; crtChildIndex < 0.2 * childrenIds.length; crtChildIndex++) {
        splitBeforeCacheCheck[1].push(childrenIds[crtChildIndex])
      }
      for (; crtChildIndex < 0.6 * childrenIds.length; crtChildIndex++) {
        splitBeforeCacheCheck[2].push(childrenIds[crtChildIndex])
      }
      for (; crtChildIndex < childrenIds.length; crtChildIndex++) {
        splitBeforeCacheCheck[3].push(childrenIds[crtChildIndex])
      }

      this.logger('Cache check for: ', splitBeforeCacheCheck)

      const newChildren = []
      let nextCachePromise = this.cacheGetObjects(splitBeforeCacheCheck[0])

      for (let i = 0; i < 4; i++) {
        const cachedObjects = await nextCachePromise
        if (i < 3) nextCachePromise = this.cacheGetObjects(splitBeforeCacheCheck[i + 1])

        const sortedCachedKeys = Object.keys(cachedObjects).sort(
          (a, b) => rootObj.__closure[a] - rootObj.__closure[b]
        )
        for (const id of sortedCachedKeys) {
          yield `${id}\t${cachedObjects[id]}`
        }
        const newChildrenForBatch = splitBeforeCacheCheck[i].filter(
          (id) => !(id in cachedObjects)
        )
        /** On Safari this would throw a RangeError for large newChildrenForBatch lengths*/
        //newChildren.push(...newChildrenForBatch)
        /** The workaround for the above based off https://stackoverflow.com/a/9650855 */
        const splitN = 500
        const chunked = chunk(newChildrenForBatch, splitN)
        for (let k = 0; k < chunked.length; k++)
          newChildren.push.apply(newChildren, chunked[k])
      }

      if (newChildren.length === 0) return

      if (newChildren.length <= 50) {
        // we have almost all of children in the cache. do only 1 requests for the remaining new children
        splitHttpRequests.push(newChildren)
      } else {
        // we now set up the batches for 4 http requests, starting from `newChildren` (already sorted by priority)
        splitHttpRequests = [[], [], [], []]
        crtChildIndex = 0

        for (; crtChildIndex < 0.05 * newChildren.length; crtChildIndex++) {
          splitHttpRequests[0].push(newChildren[crtChildIndex])
        }
        for (; crtChildIndex < 0.2 * newChildren.length; crtChildIndex++) {
          splitHttpRequests[1].push(newChildren[crtChildIndex])
        }
        for (; crtChildIndex < 0.6 * newChildren.length; crtChildIndex++) {
          splitHttpRequests[2].push(newChildren[crtChildIndex])
        }
        for (; crtChildIndex < newChildren.length; crtChildIndex++) {
          splitHttpRequests[3].push(newChildren[crtChildIndex])
        }
      }
    } else {
      // small object with <= 50 children. check cache and make only 1 request
      const cachedObjects = await this.cacheGetObjects(childrenIds)
      const sortedCachedKeys = Object.keys(cachedObjects).sort(
        (a, b) => rootObj.__closure[a] - rootObj.__closure[b]
      )
      for (const id of sortedCachedKeys) {
        yield `${id}\t${cachedObjects[id]}`
      }
      childrenIds = childrenIds.filter((id) => !(id in cachedObjects))
      if (childrenIds.length === 0) return

      // only 1 http request with the remaining children ( <= 50 )
      splitHttpRequests.push(childrenIds)
    }

    // Starting http requests for batches in `splitHttpRequests`

    const decoders = []
    const readers = []
    const readPromises = []
    const startIndexes = []
    const readBuffers = []
    const finishedRequests = []

    for (let i = 0; i < splitHttpRequests.length; i++) {
      decoders.push(new TextDecoder())
      readers.push(null)
      readPromises.push(null)
      startIndexes.push(0)
      readBuffers.push('')
      finishedRequests.push(false)

      this.fetch(this.requestUrlChildren, {
        method: 'POST',
        headers: { ...this.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ objects: JSON.stringify(splitHttpRequests[i]) })
      }).then((crtResponse) => {
        // Polyfill web streams so that we can work with them the same way we do in Node
        if (crtResponse.body.getReader) {
          polyfillReadableStreamForAsyncIterator(crtResponse.body)
        }

        // Get stream async iterator
        const crtReader = crtResponse.body.iterator()
        readers[i] = crtReader
        const crtReadPromise = crtReader.next().then((x) => {
          x.reqId = i
          return x
        })
        readPromises[i] = crtReadPromise
      })
    }

    while (true) {
      const validReadPromises = readPromises.filter((x) => !!x)
      if (validReadPromises.length === 0) {
        // Check if all requests finished
        if (finishedRequests.every((x) => x)) {
          break
        }
        // Sleep 10 ms
        await new Promise((resolve) => {
          setTimeout(resolve, 10)
        })
        continue
      }

      // Wait for data on any running request
      const data = await Promise.any(validReadPromises)
      // eslint-disable-next-line prefer-const
      let { value: crtDataChunk, done: readerDone, reqId } = data
      finishedRequests[reqId] = readerDone

      // Replace read promise on this request with a new `read` call
      if (!readerDone) {
        const crtReadPromise = readers[reqId].next().then((x) => {
          x.reqId = reqId
          return x
        })
        readPromises[reqId] = crtReadPromise
      } else {
        // This request finished. "Flush any non-newline-terminated text"
        if (readBuffers[reqId].length > 0) {
          yield readBuffers[reqId]
          readBuffers[reqId] = ''
        }
        // no other read calls for this request
        readPromises[reqId] = null
      }

      if (!crtDataChunk) continue

      crtDataChunk = decoders[reqId].decode(crtDataChunk)
      const unprocessedText = readBuffers[reqId] + crtDataChunk
      const unprocessedLines = unprocessedText.split(/\r\n|\n|\r/)
      const remainderText = unprocessedLines.pop()
      readBuffers[reqId] = remainderText

      for (const line of unprocessedLines) {
        yield line
      }
      this.cacheStoreObjects(unprocessedLines)
    }
  }

  async getRawRootObject() {
    const cachedRootObject = await this.cacheGetObjects([this.objectId])
    if (cachedRootObject[this.objectId]) return cachedRootObject[this.objectId]
    const response = await this.fetch(this.requestUrlRootObj, { headers: this.headers })
    const responseText = await response.text()
    if ([401, 403].includes(response.status)) {
      throw new ObjectLoaderRuntimeError('You do not have access to the root object!')
    }

    this.cacheStoreObjects([`${this.objectId}\t${responseText}`])
    return responseText
  }

  promisifyIdbRequest(request) {
    return new Promise((resolve, reject) => {
      request.oncomplete = request.onsuccess = () => resolve(request.result)
      request.onabort = request.onerror = () => reject(request.error)
    })
  }

  async cacheGetObjects(ids) {
    if (!this.supportsCache()) {
      return {}
    }

    if (this.cacheDB === null) {
      await this.setupCacheDb()
    }

    const ret = {}

    for (let i = 0; i < ids.length; i += 500) {
      const idsChunk = ids.slice(i, i + 500)

      const store = this.cacheDB
        .transaction('objects', 'readonly')
        .objectStore('objects')
      const idbChildrenPromises = idsChunk.map((id) =>
        this.promisifyIdbRequest(store.get(id)).then((data) => ({ id, data }))
      )
      const cachedData = await Promise.all(idbChildrenPromises)

      // this.logger("Cache check for : ", idsChunk.length, Date.now() - t0)

      for (const cachedObj of cachedData) {
        if (
          !cachedObj.data ||
          (isString(cachedObj.data) && cachedObj.data.startsWith('<html'))
        ) {
          // non-existent/invalid objects are retrieved with `undefined` data
          continue
        }
        ret[cachedObj.id] = cachedObj.data
      }
    }

    return ret
  }

  async cacheStoreObjects(objects) {
    if (!this.supportsCache()) {
      return {}
    }

    if (this.cacheDB === null) {
      await this.setupCacheDb()
    }

    try {
      const store = this.cacheDB
        .transaction('objects', 'readwrite')
        .objectStore('objects')
      for (const obj of objects) {
        const [key, value] = obj.split('\t')
        if (!value || !isString(value) || value.startsWith('<html')) {
          continue
        }

        store.put(value, key)
      }
      return this.promisifyIdbRequest(store.transaction)
    } catch (e) {
      this.logger.error(e)
    }
    return Promise.resolve()
  }
}

/**
 * Fixes a Safari bug where IndexedDB requests get lost and never resolve - invoke before you use IndexedDB
 * @link Credits and more info: https://github.com/jakearchibald/safari-14-idb-fix
 */
function safariFix() {
  const isSafari =
    !navigator.userAgentData &&
    /Safari\//.test(navigator.userAgent) &&
    !/Chrom(e|ium)\//.test(navigator.userAgent)

  // No point putting other browsers or older versions of Safari through this mess.
  if (!isSafari || !indexedDB.databases) return Promise.resolve()

  let intervalId

  return new Promise((resolve) => {
    const tryIdb = () => indexedDB.databases().finally(resolve)
    intervalId = setInterval(tryIdb, 100)
    tryIdb()
  }).finally(() => clearInterval(intervalId))
}

export default ObjectLoader
