import * as THREE from 'three'
import * as Geo from 'geo-three'
import { OSM3 } from './osmthree'
import InteractionHandler from './InteractionHandler'
import { Units, getConversionFactor } from './converter/Units'

export default class SceneSurroundings {

  constructor( viewer, index, lat, lon, north, api, build ) {
    this.viewer = viewer
    this.interactions = new InteractionHandler( this.viewer )

        
    this.DEV_MAPBOX_API_KEY = api
    this.north = north
    this.selectedMapIndex = index
    this.lat = lat
    this.lon = lon
    this.buildings3d = build
    
    // adding map tiles
    this.map_providers = [
      [ 'No map' ],
      [ 'Mapbox Light', new Geo.MapBoxProvider( this.DEV_MAPBOX_API_KEY, 'kat-speckle/ckz59opgu003y15p4hi2fib4d', Geo.MapBoxProvider.STYLE ), 0xa6a6a6 ], //works (custom token)
      [ 'Mapbox Dark', new Geo.MapBoxProvider( this.DEV_MAPBOX_API_KEY, 'kat-speckle/ckz59co9z002414nkyty48va3', Geo.MapBoxProvider.STYLE ), 0x2b2b2b ] //works (custom token)
      //[ 'Mapbox Satellite', new Geo.MapBoxProvider( this.DEV_MAPBOX_API_KEY, 'mapbox.satellite', Geo.MapBoxProvider.MAP_ID, 'jpg70', false ),0x595755 ], //works (custom token)
      //[ 'Mapbox Streets 3D Buildings', new Geo.MapBoxProvider( this.DEV_MAPBOX_API_KEY, 'mapbox/streets-v10', Geo.MapBoxProvider.STYLE ), 0x8D9194 ], //works (custom token)
      //[ 'Mapbox Monochrome 3D Buildings', new Geo.MapBoxProvider( this.DEV_MAPBOX_API_KEY, 'kat-speckle/ckyse56qx2w4h14pe0555b6mt', Geo.MapBoxProvider.STYLE ), 0xa4adbf ], //works (custom token)
      //[ 'Mapbox Satellite 3D Buildings', new Geo.MapBoxProvider( this.DEV_MAPBOX_API_KEY, 'mapbox.satellite', Geo.MapBoxProvider.MAP_ID, 'jpg70', false ),0x595755 ] //works (custom token)
      ]
    
    this.map_modes = [
      [ 'Planar', Geo.MapView.PLANAR ],
      [ 'Height', Geo.MapView.HEIGHT ],
      // ["Martini", Geo.MapView.MARTINI],
      [ 'Height Shader', Geo.MapView.HEIGHT_SHADER ],
      [ 'Spherical', Geo.MapView.SPHERICAL ]
    ]
    
    this.addUnitsList()
    this.addMapsList()

  }

  addUnitsList() {
    if ( document.getElementById( 'mapUnits' ) ) {
      let mapUnits = document.getElementById( 'mapUnits' )

      for ( let key of Object.keys( Units ) ) {
      let option = document.createElement( 'option' )
      option.innerHTML = Units[key]
      mapUnits.appendChild( option )
      }
    }
  }
  addMapsList() {
    if ( document.getElementById( 'providerColor' ) ) {
      let providerColor = document.getElementById( 'providerColor' )

      for ( let i = 0; i < this.map_providers.length;  i++ ) {
      let option = document.createElement( 'option' )
      option.innerHTML = this.map_providers[i][0]
      providerColor.appendChild( option )
      }
    }
  }
  selectedMap( index = -1 ) {
    let selected = 0
    let providerColor = document.getElementById( 'providerColor' )
    if ( index >= 0 ) this.selectedMapIndex = index
    if ( this.selectedMapIndex ) selected = this.selectedMapIndex
    else if ( providerColor ) selected = providerColor.selectedIndex
    return selected
  }
  getBuildings3d( build = null ) {
    if ( build !== null ) this.buildings3d = build
    return this.buildings3d
  }
  async addMap() {
    // example building https://latest.speckle.dev/streams/8b29ca2b2e/objects/288f67a0a45b2a4c3bd01f7eb3032495

    let selectedMap = this.selectedMap()
    let coords = this.getCoords()[0]
    let scale = this.getScale()
    let rotationNorth = this.rotationNorth()
    let build = this.getBuildings3d()

    this.removeMap()
    this.hideBuild()
    console.log( selectedMap )
    console.log( build )

    if ( !this.viewer.scene.getObjectByName( 'OSM 3d buildings' ) )  await this.addBuildings() // add if there are no buildings in the scene yet
    if ( this.viewer.scene.getObjectByName( 'OSM 3d buildings' ) && ( build === true && selectedMap !== 0 ) )  this.showBuild() // if there are buildings in the scene: if toggle is TRUE and map is not 0: show and change color, scale, rotation 

    if ( selectedMap > 0 ) {
      //create and add map to scene
      let map = new Geo.MapView( this.map_modes[0][1], this.map_providers[selectedMap][1], this.map_providers[selectedMap][1] )
      map.name = 'Base map'
      this.viewer.scene.add( map )
      map.rotation.x += Math.PI / 2

      //set selected map provider
      map.setProvider( this.map_providers[selectedMap][1] )
          
      map.scale.set( map.scale.x / scale, map.scale.y / scale, map.scale.z / scale )

      map.rotation.y += rotationNorth //rotate around (0,0,0)

      let movingVector = new THREE.Vector3( coords.x / scale, coords.y / scale, 0 ) //get vector to correct location on the map
      let rotatedVector = movingVector.applyAxisAngle( new THREE.Vector3( 0,0,1 ), rotationNorth ) //rotate vector same as the map
      map.position.x -= rotatedVector.x
      map.position.y -= rotatedVector.y
      
      this.interactions.rotateCamera( 0.001 ) //to activate map loading
    }
  }
  getScale() {
    let scale = 1 //mm
    let scale_units = 'm'
    if ( document.getElementById( 'mapUnits' ) ) {
      scale_units = document.getElementById( 'mapUnits' ).value
      scale = getConversionFactor( scale_units )
    }
    return scale
  }
  getCoords() {
    let coord_lat = 51.499268
    let coord_lon = -0.122141
    let coords_transformed = Geo.UnitsUtils.datumsToSpherical( coord_lat,coord_lon )
    if ( this.lat && this.lon ) {
      coord_lat = this.lat
      coord_lon = this.lon
      coords_transformed = Geo.UnitsUtils.datumsToSpherical( coord_lat,coord_lon )
    }
    else if ( document.getElementById( 'zeroCoordInputX' ) && document.getElementById( 'zeroCoordInputY' ) ) {
      coord_lat = Number( document.getElementById( 'zeroCoordInputX' ).value )
      coord_lon = Number( document.getElementById( 'zeroCoordInputY' ).value )
      coords_transformed = Geo.UnitsUtils.datumsToSpherical( coord_lat,coord_lon )
    }
    return [ coords_transformed, coord_lat, coord_lon ]
  }
  rotationNorth() {
    if ( this.north ) return this.north
    else if ( document.getElementById( 'North angle' ) ) {
      let angle = Number( document.getElementById( 'North angle' ).value )
      return -angle * Math.PI / 180
    }
    else return 0
  }
  async addBuildings() {
    
    console.log( 'ADD buildings' )
    let scale = this.getScale()

    let coord_lat = this.getCoords()[1]
    let coord_lon = this.getCoords()[2]
    let selectedMap = this.selectedMap()
    let build = this.getBuildings3d()

    // calculate meters per degree ratio for lat&lon - to get bbox RADxRAD (m) for API expressed in degrees
    let coords_world_origin = Geo.UnitsUtils.datumsToSpherical( coord_lat, coord_lon )        //{x: -9936.853648995217, y: 6711437.084992493}
    let coords_world_origin_lat = Geo.UnitsUtils.datumsToSpherical( coord_lat + 1, coord_lon ).y
    let coords_world_origin_lon = Geo.UnitsUtils.datumsToSpherical( coord_lat, coord_lon + 1 ).x
    let lat_coeff = Math.abs( coords_world_origin_lat - coords_world_origin.y )               // 111319.49079327358
    let lon_coeff = Math.abs( coords_world_origin_lon - coords_world_origin.x )               // 180850.16131539177

    let rad = 1500 // in selected units. e.g. meters

    let color = 0x8D9194 //grey
    //color = 0xa3a3a3 //light grey
    //color = 0x4287f5 //blue
    color = this.map_providers[selectedMap][2]
    let material = this.viewer.sceneManager.solidMaterial.clone()
    material.color = new THREE.Color( color )

    let rotationNorth = this.rotationNorth()

    window.OSM3.makeBuildings( this.viewer.scene, [ coord_lon - rad / lon_coeff, coord_lat - rad / lat_coeff, coord_lon + rad / lon_coeff, coord_lat + rad / lat_coeff ], { scale: scale, color: color, material: material, rotation: rotationNorth, name: 'OSM 3d buildings', visibility: build } )
    console.log( 'buildings ADDED!' )
    this.viewer.render()
  }
  async removeMap() {
    let selectedObject = this.viewer.scene.getObjectByName( 'Base map' )
    this.viewer.scene.remove( selectedObject )    
    this.viewer.render()
  }
  async removeBuild() {
    let objects = this.viewer.scene.children 
    for ( let i = 0, len = objects.length; i < len; i++ ) {
      if ( objects[i].name === 'OSM 3d buildings' ) this.viewer.scene.remove( objects[i] )
    }
    this.viewer.render()
  }
  hideBuild() {
    console.log( 'hide buildings' )
    let objects = this.viewer.scene.children 
    for ( let i = 0, len = objects.length; i < len; i++ ) {
      if ( objects[i].name === 'OSM 3d buildings' ) objects[i].visible = false
    }
    this.viewer.render()
  }
  showBuild() {
    console.log( 'show buildings' )
    let selectedMap = this.selectedMap()
    let c = this.map_providers[selectedMap][2]
    let mat = this.viewer.sceneManager.solidMaterial.clone()
    let rotationNorth = this.rotationNorth()
    let scale = this.getScale()

    if ( this.buildings3d === true && selectedMap !== 0 ) {
      this.viewer.scene.traverse( function( child ) {
        if ( child.name === 'OSM 3d buildings' ) {
          mat.color = new THREE.Color( c )
          child.material = mat
          child.visible = true

          let movingVector = new THREE.Vector3( 0, 0, 0 )
          let rotatedVector = new THREE.Vector3( 0, 0, 0 )
          
          // bring mesh to zero coord and rotate
          movingVector = new THREE.Vector3( child.position.x, child.position.y, 0 ) //get vector to correct location on the map
          child.position.x -= movingVector.x
          child.position.y -= movingVector.y
          child.rotation.y += rotationNorth - child.rotation.y //rotate around (0,0,0)

          // move mesh back, but rotate the initial vector as well
          rotatedVector = movingVector.applyAxisAngle( new THREE.Vector3( 0,0,1 ), rotationNorth - child.rotation.y ) //rotate vector same as the map
          child.position.x += rotatedVector.x
          child.position.y += rotatedVector.y

          // DOESNT MOVE WITH CHANGE OF COORDS YET
          /*
          let old_origin = Geo.UnitsUtils.datumsToSpherical(child.userData.coords.x, child.userData.coords.y) 
          let new_origin = Geo.UnitsUtils.datumsToSpherical(coord_lat, coord_lon) 
          console.log(old_origin, new_origin)
          child.position.x += new_origin.x-old_origin.x
          child.position.y += new_origin.y-old_origin.y

          //child.userData.coords = new THREE.Vector3(child.position.x, child.position.y, 0) //change to degrees
          */

          //adjust scale
          child.scale.set( 1 / scale, 1 / scale, 1 / scale )

        }
      } )
    }
    this.viewer.render()
  }
  changeMapOpacity( val = 0.5 ) {
    let selectedObject = this.viewer.scene.getObjectByName( 'Base map' )
    selectedObject.material.opacity = val
  }

}