
export function filterAndColorObject( obj, filter ) {
    if ( !filter )
      return obj.clone()
    
    if ( filter.speckle_type && obj.userData?.speckle_type !== filter.speckle_type )
      return null
    
    return obj.clone()
}
