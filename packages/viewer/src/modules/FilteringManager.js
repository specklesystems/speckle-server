import * as THREE from 'three'
import Rainbow from 'rainbowvis.js'

export default class FilteringManager {
  constructor(viewer) {
    this.viewer = viewer
    this.WireframeMaterial = new THREE.MeshStandardMaterial({
      color: 0x7080a0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
      wireframe: false
    })
    // console.log(this.viewer.sectionBox.planes)

    this.ColoredMaterial = new THREE.MeshStandardMaterial({
      color: 0x7080a0,
      side: THREE.DoubleSide,
      transparent: false,
      clippingPlanes: this.viewer.sectionBox.planes
    })

    this.colorLegend = {}
  }

  filterAndColorObject(obj, filter) {
    if (!filter) return obj.clone()

    if (!this.passesFilter(obj.userData, filter.filterBy)) {
      if (filter.ghostOthers) {
        const clone = obj.clone()
        this.ghostObject(clone)
        return clone
      }
      return null
    }

    const clone = obj.clone()
    if (filter.colorBy) {
      if (filter.colorBy.type === 'category') {
        const newMaterial = this.colorWithCategory(obj, filter.colorBy)
        this.setMaterial(clone, newMaterial)
      } else if (filter.colorBy.type === 'gradient') {
        const newMaterial = this.colorWithGradient(obj, filter.colorBy)
        this.setMaterial(clone, newMaterial)
      }
    }
    return clone
  }

  ghostObject(clone) {
    clone.userData = { hidden: true }

    if (clone.type === 'Group') {
      for (const child of clone.children) {
        this.ghostObject(child)
      }
    } else if (clone.type === 'Mesh') {
      clone.material = clone.material.clone()
      clone.material.clippingPlanes = null
      clone.material.transparent = true
      clone.material.opacity = 0.05
    } else {
      clone.visible = false
    }
  }

  setMaterial(clone, material) {
    if (clone.type === 'Group') {
      for (const child of clone.children) {
        this.setMaterial(child, material)
      }
    } else if (clone.material !== undefined && material !== undefined) {
      clone.material = material
      clone.material.clippingPlanes = this.viewer.sectionBox.planes
    }
  }

  getObjectProperty(obj, property) {
    if (!property) return
    const keyParts = property.split('.')
    let crtObj = obj
    for (let i = 0; i < keyParts.length - 1; i++) {
      if (!(keyParts[i] in crtObj)) return
      crtObj = crtObj[keyParts[i]]
      if (crtObj.constructor !== Object) return
    }
    const attributeName = keyParts[keyParts.length - 1]
    return crtObj[attributeName]
  }

  colorWithCategory(threejsObj, colors) {
    const obj = threejsObj.userData
    const defaultValue = colors.default
    let color = defaultValue
    const objValue = this.getObjectProperty(obj, colors.property)
    const customPallete = colors.values || {}
    if (objValue in customPallete) {
      color = customPallete[objValue]
    }

    if (color === null) {
      return threejsObj.material
    } else if (color === undefined) {
      // compute value hash
      const objValueAsString = '' + objValue
      let hash = 0
      for (let i = 0; i < objValueAsString.length; i++) {
        const chr = objValueAsString.charCodeAt(i)
        hash = (hash << 5) - hash + chr
        hash |= 0 // Convert to 32bit integer
      }
      hash = Math.abs(hash)
      const colorHue = hash % 360
      color = `hsl(${colorHue}, 50%, 30%)`
    }

    if (objValue !== undefined && objValue !== null)
      this.colorLegend[objValue.toString()] = color

    const material = this.ColoredMaterial.clone()
    material.color = new THREE.Color(color)
    return material
  }

  colorWithGradient(threejsObj, colors) {
    const obj = threejsObj.userData
    const rainbow = new Rainbow()
    if ('minValue' in colors && 'maxValue' in colors)
      rainbow.setNumberRange(colors.minValue, colors.maxValue)
    if ('gradientColors' in colors) rainbow.setSpectrum(...colors.gradientColors)

    let objValue = this.getObjectProperty(obj, colors.property)
    objValue = Number(objValue)
    if (Number.isNaN(objValue)) {
      const defaultColor = colors.default
      if (defaultColor === null) return threejsObj.material
      if (defaultColor === undefined) return this.WireframeMaterial

      const material = this.ColoredMaterial.clone()
      material.color = new THREE.Color(defaultColor)
      return material
    }

    const material = this.ColoredMaterial.clone()
    material.color = new THREE.Color(`#${rainbow.colourAt(objValue)}`)
    return material
  }

  passesFilter(obj, filterBy) {
    if (!filterBy) return true
    for (const filterKey in filterBy) {
      const objValue = this.getObjectProperty(obj, filterKey)

      const passesFilter = this.filterValue(objValue, filterBy[filterKey])
      if (!passesFilter) return false
    }
    return true
  }

  filterValue(objValue, valueFilter) {
    // Array value filter means it can be any value from the array
    if (Array.isArray(valueFilter)) return valueFilter.includes(objValue)

    // Dictionary value filter can specify ranges with `lte` and `gte` fields (LowerThanOrEqual, GreaterThanOrEqual)
    if (valueFilter.constructor === Object) {
      if ('not' in valueFilter && Array.isArray(valueFilter.not)) {
        if (valueFilter.not.includes(objValue)) return false
      }

      if ('includes' in valueFilter && Array.isArray(valueFilter.includes)) {
        if (!objValue || !Array.isArray(objValue)) return false
        for (const testValue of valueFilter.includes)
          if (objValue.includes(testValue)) return true
        return false
      }

      if ('excludes' in valueFilter && Array.isArray(valueFilter.excludes)) {
        if (!objValue || !Array.isArray(objValue)) return true
        for (const testValue of valueFilter.excludes)
          if (objValue.includes(testValue)) return false
        return true
      }

      if ('lte' in valueFilter && !(objValue <= valueFilter.lte)) return false
      if ('gte' in valueFilter && !(objValue >= valueFilter.gte)) return false
      return true
    }

    // Can also filter by specific value
    return objValue === valueFilter
  }

  initFilterOperation() {
    this.colorLegend = {}
  }
}
