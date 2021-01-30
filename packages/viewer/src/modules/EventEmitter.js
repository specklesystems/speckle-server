/*
 * https://medium.com/better-programming/how-to-create-your-own-event-emitter-in-javascript-fbd5db2447c4
 */
export default class EventEmitter {
  constructor() {
    this._events = {}
  }

  on( name, listener ) {
    if ( !this._events[name] ) {
      this._events[name] = []
    }

    this._events[name].push( listener )
  }

  removeListener( name, listenerToRemove ) {
    if ( !this._events[name] ) return

    const filterListeners = ( listener ) => listener !== listenerToRemove

    this._events[name] = this._events[name].filter( filterListeners )
  }

  emit( name, data ) {
    if ( !this._events[name] ) return

    const fireCallbacks = ( callback ) => {
      callback( data )
    }

    this._events[name].forEach( fireCallbacks )
  }
}
