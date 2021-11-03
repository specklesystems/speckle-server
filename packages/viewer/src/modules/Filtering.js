import * as THREE from 'three'
import Rainbow from 'rainbowvis.js'
import { cloneUniforms } from 'three'

const WireframeMaterial = new THREE.MeshStandardMaterial( {
  color: 0x7080A0,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.04,
  wireframe: true
} )

const ColoredMaterial = new THREE.MeshStandardMaterial( {
  color: 0x7080A0,
  side: THREE.DoubleSide,
  transparent: false
} )


export function filterAndColorObject( obj, filter ) {
    if ( !filter )
      return obj.clone()
    if ( !passesAndFilter( obj.userData, filter.and ) )
    {
      if ( filter.wireframeFilter && obj.type === 'Mesh' ) {
        let clone = obj.clone()
        // clone.material = WireframeMaterial
        clone.material = obj.material.clone()
        clone.material.transparent = true
        clone.material.opacity = 0.05
        clone.userData = null
        return clone
      }
      return null
    }

    let clone = obj.clone()
    if ( filter.colors ) {
      if ( filter.colors.type === 'category' ) {
        clone.material = colorWithCategory( obj.userData, filter.colors )
      } else if ( filter.colors.type === 'gradient' ) {
        clone.material = colorWithGradient( obj.userData, filter.colors )
      }
    }

    return clone
}

function getObjectProperty( obj, property ) {
  if ( !property ) return
  let keyParts = property.split( '.' )
    let crtObj = obj
    for ( let i = 0; i < keyParts.length - 1; i++ ) {
      if ( !( keyParts[i] in crtObj ) ) return
      crtObj = crtObj[ keyParts[i] ]
      if ( crtObj.constructor !== Object ) return
    }
    let attributeName = keyParts[ keyParts.length - 1 ]
    return crtObj[ attributeName ]
}

function colorWithCategory( obj, colors ) {
  let defaultValue = colors.default
  let color = defaultValue
  let objValue = getObjectProperty( obj, colors.property )
  let customPallete = colors.values || {}
  if ( objValue in customPallete ) {
    color = customPallete[ objValue ]
  }

  if ( !color ) {
    // compute value hash
    let objValueAsString = '' + objValue
    let hash = 0
    for( let i = 0; i < objValueAsString.length; i++ ) {
      let chr = objValueAsString.charCodeAt( i )
      hash = ( ( hash << 5 ) - hash ) + chr
      hash |= 0 // Convert to 32bit integer
    }
    hash = Math.abs( hash )
    let colorHue = hash % 360
    color = `hsl(${colorHue}, 50%, 30%)`
  }

  let material = ColoredMaterial.clone()
  material.color = new THREE.Color( color )
  return material
}

function colorWithGradient( obj, colors ) {
  let rainbow = new Rainbow( )
  if ( 'minValue' in colors && 'maxValue' in colors )
    rainbow.setNumberRange( colors.minValue, colors.maxValue )
  if ( 'gradientColors' in colors )
  rainbow.setSpectrum( ...colors.gradientColors )

  let objValue = getObjectProperty( obj, colors.property )
  objValue = Number( objValue )
  if ( Number.isNaN( objValue ) ) {
    // TODO: have different behaviour for missing values?
    objValue = 0
  }
  
  let material = ColoredMaterial.clone()
  material.color = new THREE.Color( `#${rainbow.colourAt( objValue )}` )
  return material
}

function passesAndFilter( obj, andFilter ) {
  if ( !andFilter ) return true
  for ( let filterKey in andFilter ) {
    let objValue = getObjectProperty( obj, filterKey )

    // let keyParts = filterKey.split( '.' )
    // let crtObj = obj
    // for ( let i = 0; i < keyParts.length - 1; i++ ) {
    //   if ( !( keyParts[i] in crtObj ) ) return false
    //   crtObj = crtObj[ keyParts[i] ]
    //   if ( crtObj.constructor !== Object ) return false
    // }
    // let attributeName = keyParts[ keyParts.length - 1 ]
    let passesFilter = filterValue( objValue, andFilter[ filterKey ] )
    if ( !passesFilter ) return false
  }
  return true
}

function filterValue( objValue, valueFilter ) {
  // Array value filter means it can be any value from the array
  if ( Array.isArray( valueFilter ) )
    return valueFilter.includes( objValue )

  // Dictionary value filter can specify ranges with `lte` and `gte` fields (LowerThanOrEqual, GreaterThanOrEqual)
  if ( valueFilter.constructor === Object ) {
    if ( 'lte' in valueFilter && objValue > valueFilter.lte )
      return false
    if ( 'gte' in valueFilter && objValue < valueFilter.gte )
      return false
    return true
  }

  // Can also filter by specific value
  return objValue === valueFilter
}
