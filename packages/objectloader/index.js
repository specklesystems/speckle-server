/**
 * Simple client that streams object info from a Speckle Server. 
 * TODO: Object construction progress reporting is weird.
 */



export default class ObjectLoader {

  /**
   * Creates a new object loader instance.
   * @param {*} param0 
   */
  constructor( { serverUrl, streamId, token, objectId, options = { fullyTraverseArrays: false, excludeProps: [ ] } } ) {
    this.INTERVAL_MS = 20
    this.TIMEOUT_MS = 180000 // three mins

    this.serverUrl = serverUrl || window.location.origin
    this.streamId = streamId
    this.objectId = objectId
    this.token = token || localStorage.getItem( 'AuthToken' )

    this.headers = {
      'Accept': 'text/plain'
    }

    if( token ) {
      this.headers['Authorization'] = `Bearer ${this.token}`
    }

    this.requestUrl = `${this.serverUrl}/objects/${this.streamId}/${this.objectId}`
    this.promises = []
    this.intervals = {}
    this.buffer = []
    this.isLoading = false
    this.totalChildrenCount = 0
    this.traversedReferencesCount = 0
    this.options = options
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
    for await ( let line of this.getRawObjectIterator() ) {
      let { id, obj } = this.processLine( line )
      this.buffer[ id ] = obj
      yield obj
    }
  }

  processLine( chunk ) {
    var pieces = chunk.split( '\t' )
    return { id: pieces[0], obj: JSON.parse( pieces[1] ) }
  }

  async * getRawObjectIterator() {
    const decoder = new TextDecoder()
    const response = await fetch( this.requestUrl, { headers: this.headers } )
    const reader = response.body.getReader()
    let { value: chunk, done: readerDone } = await reader.read()
    chunk = chunk ? decoder.decode( chunk ) : ''

    let re = /\r\n|\n|\r/gm
    let startIndex = 0

    while ( true ) {
      let result = re.exec( chunk )
      if ( !result ) {
        if ( readerDone ) break
        let remainder = chunk.substr( startIndex ) 
        ;( { value: chunk, done: readerDone } = await reader.read() ) // PS: semicolon of doom
        chunk = remainder + ( chunk ? decoder.decode( chunk ) : '' )
        startIndex = re.lastIndex = 0
        continue
      }
      yield chunk.substring( startIndex, result.index )
      startIndex = re.lastIndex
    }

    if ( startIndex < chunk.length ) {
      yield chunk.substr( startIndex )
    }
  }
}
