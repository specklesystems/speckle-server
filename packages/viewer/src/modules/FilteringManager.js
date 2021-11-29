import * as THREE from 'three'
import Rainbow from 'rainbowvis.js'

export default class FilteringManager {
  
  constructor( viewer ) {
    this.viewer = viewer
    this.WireframeMaterial = new THREE.MeshStandardMaterial( {
      color: 0x7080A0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.04,
      wireframe: true
    } )
    // console.log(this.viewer.sectionBox.planes)
    
    this.ColoredMaterial = new THREE.MeshStandardMaterial( {
      color: 0x7080A0,
      side: THREE.DoubleSide,
      transparent: false,
      clippingPlanes: this.viewer.sectionBox.planes
    } )

    this.colorLegend = {}
  }
  
  filterAndColorObject( obj, filter ) {
    if ( !filter )
      return obj.clone()
    
    if ( !this.passesFilter( obj.userData, filter.filterBy ) )
    {
      if ( filter.ghostOthers ) {
        let clone = obj.clone()
        this.ghostObject( clone )
        return clone
      }
      return null
    }

    let clone = obj.clone()
    if ( filter.colorBy ) {
      if ( filter.colorBy.type === 'category' ) {
        let newMaterial = this.colorWithCategory( obj, filter.colorBy )
        this.setMaterial( clone, newMaterial )
      } else if ( filter.colorBy.type === 'gradient' ) {
        let newMaterial = this.colorWithGradient( obj, filter.colorBy )
        this.setMaterial( clone, newMaterial )
      }
    }
    return clone
  }

  ghostObject( clone ) {
    clone.userData = { hidden: true }

    if ( clone.type === 'Group' ) {
      for ( let child of clone.children ) {
        this.ghostObject( child )
      }
    } else if ( clone.type === 'Mesh' ) {
      clone.material = clone.material.clone()
      clone.material.clippingPlanes = null
      clone.material.transparent = true
      clone.material.opacity = 0.05
    } else {
      clone.visible = false
    }
  }

  setMaterial ( clone, material ) {
    if ( clone.type === 'Group' ) {
      for ( let child of clone.children ) {
        this.setMaterial( child, material )
      }
    } else if ( clone.material !== undefined ) {
      clone.material = material
      clone.material.clippingPlanes = this.viewer.sectionBox.planes
    }
  }

  getObjectProperty( obj, property ) {
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
  
  colorWithCategory( threejsObj, colors ) {
    let obj = threejsObj.userData
    let defaultValue = colors.default
    let color = defaultValue
    let objValue = this.getObjectProperty( obj, colors.property )
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
  
    if ( objValue !== undefined && objValue !== null )
      this.colorLegend[ objValue.toString() ] = color

    let material = this.ColoredMaterial.clone()
    material.color = new THREE.Color( color )
    return material
  }
  
  colorWithGradient( threejsObj, colors ) {
    let obj = threejsObj.userData
    let rainbow = new Rainbow( )
    if ( 'minValue' in colors && 'maxValue' in colors )
      rainbow.setNumberRange( colors.minValue, colors.maxValue )
    if ( 'gradientColors' in colors )
    rainbow.setSpectrum( ...colors.gradientColors )
  
    let objValue = this.getObjectProperty( obj, colors.property )
    objValue = Number( objValue )
    if ( Number.isNaN( objValue ) ) {
      return this.WireframeMaterial
    }
    
    let material = this.ColoredMaterial.clone()
    material.color = new THREE.Color( `#${rainbow.colourAt( objValue )}` )
    return material
  }
  
  passesFilter( obj, filterBy ) {
    if ( !filterBy ) return true
    for ( let filterKey in filterBy ) {
      let objValue = this.getObjectProperty( obj, filterKey )
  
      let passesFilter = this.filterValue( objValue, filterBy[ filterKey ] )
      if ( !passesFilter ) return false
    }
    return true
  }
  
  filterValue( objValue, valueFilter ) {
    // Array value filter means it can be any value from the array
    if ( Array.isArray( valueFilter ) )
      return valueFilter.includes( objValue )
  
    // Dictionary value filter can specify ranges with `lte` and `gte` fields (LowerThanOrEqual, GreaterThanOrEqual)
    if ( valueFilter.constructor === Object ) {
      if ( 'not' in valueFilter && Array.isArray( valueFilter.not ) ) {
        if ( valueFilter.not.includes( objValue ) )
          return false
      }
      if ( 'lte' in valueFilter && objValue > valueFilter.lte )
        return false
      if ( 'gte' in valueFilter && objValue < valueFilter.gte )
        return false
      return true
    }
  
    // Can also filter by specific value
    return objValue === valueFilter
  }

  initFilterOperation() {
    this.colorLegend = {}
  }
}

