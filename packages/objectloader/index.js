/**
 * Simple client that streams object info from a Speckle Server.
 * TODO: Object construction progress reporting is weird.
 */



export default class ObjectLoader {

  /**
   * Creates a new object loader instance.
   * @param {*} param0
   */
  constructor( { serverUrl, streamId, token, objectId, options = { enableCaching: true, fullyTraverseArrays: false, excludeProps: [ ] } } ) {
    this.INTERVAL_MS = 20
    this.TIMEOUT_MS = 180000 // three mins

    this.serverUrl = serverUrl || window.location.origin
    this.streamId = streamId
    this.objectId = objectId
    console.log('Object loader constructor called!')
    try {
      this.token = token || localStorage.getItem( 'AuthToken' )
    } catch (error) {
        // Accessing localStorage may throw when executing on sandboxed document, ignore.
    }

    this.headers = {
      'Accept': 'text/plain'
    }

    if( this.token ) {
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

    this.cacheDB = null
}

  dispose() {
    this.buffer = []
    this.intervals.forEach( i => clearInterval( i.interval ) )
  }

  /**
   * Use this method to receive and construct the object. It will return the full, de-referenced and de-chunked original object.
   * @param {*} onProgress
   * @returns
   */
  async getAndConstructObject( onProgress ) {

    ;( await this.downloadObjectsInBuffer( onProgress ) ) // Fire and forget; PS: semicolon of doom

    let rootObject = await this.getObject( this.objectId )
    return this.traverseAndConstruct( rootObject, onProgress )
  }

  /**
   * Internal function used to download all the objects in a local buffer.
   * @param {*} onProgress
   */
  async downloadObjectsInBuffer( onProgress ) {
    let first = true
    let downloadNum = 0

    for await ( let obj of this.getObjectIterator() ) {
      if( first ) {
        this.totalChildrenCount = obj.totalChildrenCount
        first = false
        this.isLoading = true
      }
      downloadNum++
      if( onProgress ) onProgress( { stage: 'download', current: downloadNum, total: this.totalChildrenCount } )
    }
    this.isLoading = false
  }

  /**
   * Internal function used to recursively traverse an object and populate its references and dechunk any arrays.
   * @param {*} obj
   * @param {*} onProgress
   * @returns
   */
  async traverseAndConstruct( obj, onProgress ) {
    if( !obj ) return
    if ( typeof obj !== 'object' ) return obj

    // Handle arrays
    if ( Array.isArray( obj ) &&  obj.length !== 0 ) {
      let arr = []
      for ( let element of obj ) {
        if ( typeof element !== 'object' && ! this.options.fullyTraverseArrays ) return obj

        // Dereference element if needed
        let deRef = element.referencedId ? await this.getObject( element.referencedId ) : element
        if( element.referencedId && onProgress ) onProgress( { stage: 'construction', current: ++this.traversedReferencesCount > this.totalChildrenCount ? this.totalChildrenCount : this.traversedReferencesCount, total: this.totalChildrenCount } )

        // Push the traversed object in the array
        arr.push( await this.traverseAndConstruct( deRef, onProgress ) )
      }

      // De-chunk
      if( arr[0]?.speckle_type?.toLowerCase().includes('datachunk') ) {
        return arr.reduce( ( prev, curr ) => prev.concat( curr.data ), [] )
      }

      return arr
     }

    // Handle objects
    // 1) Purge ignored props
    for( let ignoredProp of this.options.excludeProps ) {
      delete obj[ ignoredProp ]
    }

    // 2) Iterate through obj
    for( let prop in obj ) {
      if( typeof obj[prop] !== 'object' ) continue // leave alone primitive props

      if( obj[prop].referencedId ) {
        obj[prop] = await this.getObject( obj[prop].referencedId )
        if( onProgress ) onProgress( { stage: 'construction', current: ++this.traversedReferencesCount > this.totalChildrenCount ? this.totalChildrenCount : this.traversedReferencesCount, total: this.totalChildrenCount } )
      }

      obj[prop] = await this.traverseAndConstruct( obj[prop], onProgress )
    }

     return obj
  }

  /**
   * Internal function. Returns a promise that is resolved when the object id is loaded into the internal buffer.
   * @param {*} id
   * @returns
   */
  async getObject( id ){
    if ( this.buffer[id] ) return this.buffer[id]

    let promise = new Promise( ( resolve, reject ) => {
      this.promises.push( { id, resolve, reject } )
      // Only create a new interval checker if none is already present!
      if ( this.intervals[id] ) {
        this.intervals[id].elapsed = 0 // reset elapsed
      } else {
        let intervalId = setInterval( this.tryResolvePromise.bind( this ), this.INTERVAL_MS, id )
        this.intervals[id] = { interval: intervalId, elapsed: 0 }
      }
    } )
    return promise
  }

  tryResolvePromise( id ) {
    this.intervals[id].elapsed += this.INTERVAL_MS
    if ( this.buffer[id] ) {
      for ( let p of this.promises.filter( p => p.id === id ) ) {
        p.resolve( this.buffer[id] )
      }

      clearInterval( this.intervals[id].interval )
      delete this.intervals[id]
      // this.promises = this.promises.filter( p => p.id !== p.id ) // clearing out promises too early seems to nuke loading
      return
    }

    if ( this.intervals[id].elapsed > this.TIMEOUT_MS ) {
      console.warn( `Timeout resolving ${id}. HIC SVNT DRACONES.` )
      clearInterval( this.intervals[id].interval )
      this.promises.filter( p => p.id === id ).forEach( p => p.reject() )
      this.promises = this.promises.filter( p => p.id !== p.id ) // clear out
    }
  }

  async * getObjectIterator(  ) {
    let t0 = Date.now()
    for await ( let line of this.getRawObjectIterator() ) {
      let { id, obj } = this.processLine( line )
      this.buffer[ id ] = obj
      yield obj
    }
    console.log("Loaded in: ", (Date.now() - t0) / 1000)
  }

  processLine( chunk ) {
    var pieces = chunk.split( '\t' )
    return { id: pieces[0], obj: JSON.parse( pieces[1] ) }
  }

  async * getRawObjectIterator() {
    if ( this.options.enableCaching && window.indexedDB && this.cacheDB === null) {
      // TODO: safari issue https://github.com/jakearchibald/idb-keyval
      let idbOpenRequest = indexedDB.open('speckle-object-cache', 1)
      idbOpenRequest.onupgradeneeded = () => idbOpenRequest.result.createObjectStore('objects');
      this.cacheDB = await this.promisifyIdbRequest( idbOpenRequest )
    }

    const rootObjJson = await this.getRawRootObject()
    yield `${this.objectId}\t${rootObjJson}`

    const rootObj = JSON.parse(rootObjJson)
    if ( !rootObj.__closure ) return

    let childrenIds = Object.keys(rootObj.__closure)
    if ( childrenIds.length === 0 ) return

    const cachedObjects = await this.cacheGetObjects( childrenIds )
    for ( let id in cachedObjects ) {
      yield `${id}\t${cachedObjects[ id ]}`
    }
    childrenIds = childrenIds.filter(id => !( id in cachedObjects ) )

    let splitChildrenIds = []
    if ( childrenIds.length <= 10 ){
      splitChildrenIds.push( childrenIds )
    } else {
      for (let i = 0; i < this.options.numConnections; i++) {
        splitChildrenIds.push( [] )
      }
      for (let i = 0; i < childrenIds.length; i++) {
        splitChildrenIds[ i % this.options.numConnections ].push(childrenIds[i])
      }
    }
    
    const decoders = []
    const readers = []
    const readPromisses = []
    const startIndexes = []
    const readBuffers = []
    const finishedRequests = []

    for (let i = 0; i < splitChildrenIds.length; i++) {
      decoders.push(new TextDecoder())
      readers.push( null )
      readPromisses.push( null )
      startIndexes.push( 0 )
      readBuffers.push( '' )
      finishedRequests.push( false )

      fetch(
        this.requestUrlChildren,
        {
          method: 'POST',
          headers: { ...this.headers, 'Content-Type': 'application/json' },
          body: JSON.stringify( { objects: JSON.stringify( splitChildrenIds[i] ) } )
        }
      ).then( crtResponse => {
        let crtReader = crtResponse.body.getReader()
        readers[i] = crtReader
        let crtReadPromise = crtReader.read().then(x => { x.reqId = i; return x })
        readPromisses[i] = crtReadPromise
      })
    }
    
    while ( true ) {
      let validReadPromises = readPromisses.filter(x => x != null)
      if ( validReadPromises.length === 0 ) {
        // Check if all requests finished
        if ( finishedRequests.every(x => x) ) {
          break
        }
        // Sleep 10 ms
        await new Promise( ( resolve ) => {
          setTimeout( resolve, 10 )
        } )
        continue
      }

      // Wait for data on any running request
      let data = await Promise.any( validReadPromises )
      let { value: crtDataChunk, done: readerDone, reqId } = data
      finishedRequests[ reqId ] = readerDone

      // Replace read promise on this request with a new `read` call
      if ( !readerDone ) {
         let crtReadPromise = readers[ reqId ].read().then(x => { x.reqId = reqId; return x })
         readPromisses[ reqId ] = crtReadPromise
      } else {
        // This request finished. "Flush any non-newline-terminated text"
        if ( readBuffers[ reqId ].length > 0 ) {
          yield readBuffers[ reqId ]
          readBuffers[ reqId ] = ''
        }
        // no other read calls for this request
        readPromisses[ reqId ] = null
      }

      if ( !crtDataChunk )
        continue

      crtDataChunk = decoders[ reqId ].decode( crtDataChunk )
      let unprocessedText = readBuffers[ reqId ] + crtDataChunk
      let unprocessedLines = unprocessedText.split(/\r\n|\n|\r/)
      let remainderText = unprocessedLines.pop()
      readBuffers[ reqId ] = remainderText

      for ( let line of unprocessedLines ) {
        yield line
      }
      this.cacheStoreObjects(unprocessedLines)
    }
  }

  async getRawRootObject() {
    const response = await fetch( this.requestUrlRootObj, { headers: this.headers } )
    return response.text()
  }

  promisifyIdbRequest(request) {
    return new Promise((resolve, reject) => {
      request.oncomplete = request.onsuccess = () => resolve(request.result);
      request.onabort = request.onerror = () => reject(request.error);
    })
  }

  async cacheGetObjects(ids) {
    if ( !this.options.enableCaching || !window.indexedDB ) {
      return {}
    }

    let store = this.cacheDB.transaction('objects', 'readonly').objectStore('objects')
    let idbChildrenPromises = ids.map( id => this.promisifyIdbRequest( store.get( id ) ).then( data => ( { id, data } ) ) )
    let cachedData = await Promise.all(idbChildrenPromises)

    let ret = {}
    for ( let cachedObj of cachedData ) {
      if ( !cachedObj.data ) // non-existent objects are retrieved with `undefined` data
        continue
      ret[ cachedObj.id ] = cachedObj.data
    }

    return ret
  }

  cacheStoreObjects(objects) {
    if ( !this.options.enableCaching || !window.indexedDB ) {
      return {}
    }

    let store = this.cacheDB.transaction('objects', 'readwrite').objectStore('objects')
    for ( let obj of objects ) {
      let idAndData = obj.split( '\t' )
      store.put(idAndData[1], idAndData[0])
    }

    return this.promisifyIdbRequest( store.transaction )
  }
}
