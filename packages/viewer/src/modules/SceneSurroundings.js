import * as THREE from 'three'
import * as Geo from 'geo-three'
import InteractionHandler from './InteractionHandler'
import { Units, getConversionFactor } from './converter/Units'
import { AnimationObjectGroup } from 'three'

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
    this.buildingsAmount = 0
    this.buildingGroup = null
    
    // adding map tiles
    this.map_providers = [
      [ 'No map' ],
      [ 'Mapbox Light', new Geo.MapBoxProvider( this.DEV_MAPBOX_API_KEY, 'kat-speckle/ckz59opgu003y15p4hi2fib4d', Geo.MapBoxProvider.STYLE ), 0xa6a6a6 ], //works (custom token)
      [ 'Mapbox Dark', new Geo.MapBoxProvider( this.DEV_MAPBOX_API_KEY, 'kat-speckle/ckz59co9z002414nkyty48va3', Geo.MapBoxProvider.STYLE ), 0x2b2b2b ] //works (custom token)
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
    //this.addBuildings()
    // example building https://latest.speckle.dev/streams/8b29ca2b2e/objects/288f67a0a45b2a4c3bd01f7eb3032495

    let selectedMap = this.selectedMap()
    let coords = this.getCoords()[0]
    let scale = this.getScale()
    let rotationNorth = this.rotationNorth()
    let build = this.getBuildings3d()

    this.removeMap()
    this.hideBuild()

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
    let scale = 1 //m
    let scale_units = 'm'
    if ( document.getElementById( 'mapUnits' ) ) {
      scale_units = document.getElementById( 'mapUnits' ).value
      scale = getConversionFactor( scale_units )
    }
    return scale // set 1 for meters
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

  async removeMap() {
    let selectedObject = this.viewer.scene.getObjectByName( 'Base map' )
    this.viewer.scene.remove( selectedObject )    
    this.viewer.render()
  }

  async removeBuild() {
    this.viewer.scene.remove( this.buildingGroup )
    this.viewer.render()
  }

  hideBuild() {
    console.log( 'hide buildings' )
    let objects = this.viewer.scene.children 
    this.viewer.scene.traverse( function( child ) {
    //for ( let i = 0, len = objects.length; i < len; i++ ) {
      if ( child.name === 'OSM 3d buildings' ) child.visible = false
    } )
    this.viewer.render()
  }
  showBuild() {
    console.log( 'show buildings' )
    console.log( this.viewer.scene.children )
    let selectedMap = this.selectedMap()
    let c = this.map_providers[selectedMap][2]
    let mat = this.viewer.sceneManager.solidMaterial.clone()
    mat.color = new THREE.Color( c )
    //let rotationNorth = this.rotationNorth()
    //let scale = this.getScale()

    if ( this.buildings3d === true && selectedMap !== 0 ) {
      this.viewer.scene.traverse( function( child ) {
        if ( child.name === 'OSM 3d buildings' ) {
          child.visible = true // visibility of entire group
          let meshes = child.children
          for ( let i = 0; i < meshes.length; i++ ) {
            meshes[i].material = mat
          }

        }
      } )
    }
    this.viewer.render()
  }
  
  changeMapOpacity( val = 0.5 ) {
    let selectedObject = this.viewer.scene.getObjectByName( 'Base map' )
    selectedObject.material.opacity = val
  }


  async addBuildings() {
    // TODO: get building height units; fix some complex Relations (e.g. palace building)
    //EPSG:900913
    console.log( 'Get Json' )
    this.buildingGroup = new THREE.Group()

    let coord_lat = this.getCoords()[1]
    let coord_lon = this.getCoords()[2]
    // calculate meters per degree ratio for lat&lon - to get bbox RADxRAD (m) for API expressed in degrees
    let coords_world_origin = Geo.UnitsUtils.datumsToSpherical( coord_lat, coord_lon )        //{x: -9936.853648995217, y: 6711437.084992493}
    let coords_world_origin_lat = Geo.UnitsUtils.datumsToSpherical( coord_lat + 1, coord_lon ).y
    let coords_world_origin_lon = Geo.UnitsUtils.datumsToSpherical( coord_lat, coord_lon + 1 ).x
    let lat_coeff = Math.abs( coords_world_origin_lat - coords_world_origin.y )               // 111319.49079327358
    let lon_coeff = Math.abs( coords_world_origin_lon - coords_world_origin.x )               // 180850.16131539177

    let rad = 1500 // in selected units. e.g. meters
    //let bbox1 = [ coord_lon - rad / lon_coeff, coord_lat - rad / lat_coeff, coord_lon + rad / lon_coeff, coord_lat + rad / lat_coeff ]
    let y0 = coord_lat - rad / lat_coeff
    let y1 = coord_lat + rad / lat_coeff
    let x0 = coord_lon - rad / lon_coeff
    let x1 = coord_lon + rad / lon_coeff

    let bbox = y0.toString() + ',' + x0.toString() + ',' + y1.toString() + ',' + x1.toString()
    let query_start = 'https://overpass-api.de/api/interpreter?data=[out:json][timeout:500];('
    let query1 = 'node["building"](' + bbox + ');way["building"](' + bbox + ');relation["building"](' + bbox + ');'
    let query2 = 'node["man_made"="bridge"](' + bbox + ');way["man_made"="bridge"](' + bbox + ');relation["man_made"="bridge"](' + bbox + ');'
    let query_end = ');out body;>;out skel qt;'

    let url = query_start + query1 + query_end
    console.log( url )
    let client = new XMLHttpRequest()
    let thisContext = this

    client.onreadystatechange = async function() {
    if ( this.readyState === 4 && this.status === 200 ) {
        // Action to be performed when the document is ready:
        let features = JSON.parse( client.responseText ).elements
        let objGroup = thisContext.jsonAnalyse( features )

        // add to scene, rotate to XY plane and scale
        for ( let i = 0; i < objGroup.length; i++ ) {
          thisContext.buildingGroup.add( objGroup[i] )
        }
        thisContext.viewer.scene.add( thisContext.buildingGroup )
        thisContext.buildingGroup.name = 'OSM 3d buildings'

        // rotation, scale and visibility
        let scale = thisContext.getScale()
        let visibility = thisContext.getBuildings3d()
        let rotationNorth = thisContext.rotationNorth()
        
        thisContext.buildingGroup.visible = visibility
        thisContext.buildingGroup.rotation.x += Math.PI / 2
        thisContext.buildingGroup.rotation.y -= Math.PI / 2
        thisContext.buildingGroup.scale.set( 1 / scale, 1 / scale, 1 / scale )

        // bring mesh to zero coord and rotate
        let movingVector = new THREE.Vector3( thisContext.buildingGroup.position.x, thisContext.buildingGroup.position.y, 0 ) //get vector to correct location on the map
        thisContext.buildingGroup.position.x -= movingVector.x
        thisContext.buildingGroup.position.y -= movingVector.y
        thisContext.buildingGroup.rotation.y += rotationNorth //rotate around (0,0,0)

        // move mesh back, but rotate the initial vector as well
        let rotatedVector = movingVector.applyAxisAngle( new THREE.Vector3( 0,0,1 ), rotationNorth ) //rotate vector same as the map
        thisContext.buildingGroup.position.x += rotatedVector.x
        thisContext.buildingGroup.position.y += rotatedVector.y

      }
    }
    client.open( 'GET', url )
    client.send()
  }

  jsonAnalyse ( features ) {
    let ways = []
    let tags = []

    let rel_outer_ways = []
    let rel_outer_ways_tags = []

    let ways_part = []
    let nodes = []
    
    let origin = this.getCoords()[0]

    for ( let i = 0; i < features.length;  i++ ) {
      let feature = features[i]
      // get ways
      if ( feature.type === 'way' ) {
        if ( feature.tags ) {
          ways.push( { id: feature.id, nodes: feature.nodes } )
          tags.push( { building: feature.tags['building'], layer: feature.tags['layer'], levels: feature.tags['building:levels'], height: feature.tags['height'] } )
        }
        else ways_part.push( { id: feature.id, nodes: feature.nodes } )
      }
      // get relations
        if ( feature.type === 'relation' ) {
          let outer_ways = []
          let outer_ways_tags = { building: feature.tags['building'], layer: feature.tags['layer'], levels: feature.tags['building:levels'], height: feature.tags['height'] }
          for ( let n = 0; n < feature.members.length; n++ ) {
            // if several Outer ways, combine them
            if ( feature.members[n].type === 'way' && feature.members[n].role === 'outer' ) {
              outer_ways.push( { id:feature.id, ref: feature.members[n].ref } )
            }
          }
          rel_outer_ways.push( outer_ways )
          rel_outer_ways_tags.push( outer_ways_tags )
        }
      // get nodes (that don't have tags)
      if ( feature.type === 'node' && !feature.tags ) nodes.push( { id: feature.id, lat: feature.lat, lon: feature.lon } )
    }
    /////////////////// turn relations_OUTER into ways
    console.log( rel_outer_ways )
    for ( let n = 0; n < rel_outer_ways.length; n++ ) { 
      console.log( '________________Relations list #' + n.toString() )
      // there will be a list of "ways" in each of rel_outer_ways
      let full_node_list = []
      let loop_prevention = 0
      let local_list_ways = [ ...rel_outer_ways[n] ]
      let max_loops = 2 * local_list_ways.length
      for ( let m = local_list_ways.length - 1; m >= 0; m-- ) {
        for ( let k = 0; k < ways_part.length; k++ ) { // find ways_parts with corresponding ID
          if ( k === ways_part.length ) break
          if ( local_list_ways[m].ref === ways_part[k].id ) {
            if ( full_node_list.length === 0 ) {
              Array.prototype.push.apply( full_node_list, ways_part[k].nodes )
            } else {
              
              if ( ways_part[k].nodes[0] === full_node_list[ full_node_list.length - 1 ] ) { // if first node in list equals last node in full list
                console.log( '---connect directly' )
                ways_part[k].nodes.splice( 0, 1 )
                Array.prototype.push.apply( full_node_list, ways_part[k].nodes )
                ways_part.splice( k, 1 ) // remove used ways_parts
                local_list_ways.splice( m, 1 )
                break
                
              } else if ( ways_part[k].nodes[ ways_part[k].nodes.length - 1 ] === full_node_list[ full_node_list.length - 1 ] ) { // if last node in list equals last node in full list
                console.log( '---reverse and connect' )
                ways_part[k].nodes.reverse()
                ways_part[k].nodes.splice( 0, 1 )
                Array.prototype.push.apply( full_node_list, ways_part[k].nodes )
                ways_part.splice( k, 1 ) // remove used ways_parts
                local_list_ways.splice( m, 1 )
                break
                
              } else {
                console.log( '---push nodes to the beginning of the list' )
                loop_prevention += 1
                if ( loop_prevention < max_loops ) {
                  local_list_ways.unshift( [ ...local_list_ways ][m] ) // add to the beginning of the list
                  m += 1
                }
              }
            }

          }
        }
      }
      ways.push( { nodes: full_node_list } ), tags.push( { building: rel_outer_ways_tags[n].building, layer: rel_outer_ways_tags[n].layer, levels: rel_outer_ways_tags[n].levels, height: rel_outer_ways_tags[n].height } )

    }
    this.buildingsAmount = ways.length
    
    ////////////////////////get coords of Ways
    let objectGroup = []
    for ( let i = 0; i < ways.length;  i++ ) { // go through each Way: 2384
      
      let ids = ways[i].nodes
      let coords = [] //replace node IDs with actual coords for each Way
      let height = 3
      if ( tags[i].building ) height = 9
      if ( tags[i].levels ) height = Number( tags[i].levels.split( ',' )[0].split( ';' )[0].replace( /[^\d.-]/g, '' ) ) * 3
      else if ( tags[i].height ) height = Number( tags[i].height.split( ',' )[0].split( ';' )[0].replace( /[^\d.-]/g, '' ) )
      if ( tags[i].layer < 0 ) height = -1 * height
      
      for ( let k = 0; k < ids.length;  k++ ) { // go through each node of the Way
        for ( let n = 0; n < nodes.length;  n++ ) { // go though all nodes
          if ( ids[k] === nodes[n].id ) {
            coords.push( { x: Geo.UnitsUtils.datumsToSpherical( nodes[n].lat, nodes[n].lon ).x - origin.x, y: Geo.UnitsUtils.datumsToSpherical( nodes[n].lat, nodes[n].lon ).y - origin.y } )
            break
          }
        }
      }
      let obj = this.extrudeBuildings( coords, height )
      objectGroup.push( obj )
      coords = null
      height = null
    }    
    return objectGroup
  }

  extrudeBuildings( coords, height ) { 
    let path = new THREE.ShapePath()
    if ( coords.length > 1 ) {
      path.moveTo( coords[0].x, coords[0].y )
      for ( let i = 1; i < coords.length; i++ ) {
        path.lineTo( coords[i].x, coords[i].y )
      }
    }
    let shapes = path.toShapes() 
    let extrudePath = new THREE.CurvePath()
		extrudePath.add( new THREE.LineCurve3( new THREE.Vector3( 0,0,0 ), new THREE.Vector3( 0,height,0 ) ) )
    let geom = new THREE.ExtrudeGeometry( shapes, { extrudePath: extrudePath } )

    /////// get model data and create Mesh
    //let scale = this.getScale()
    let coord_lat = this.getCoords()[1]
    let coord_lon = this.getCoords()[2]
    let selectedMap = this.selectedMap()
    //let visibility = this.getBuildings3d()
    //let rotationNorth = this.rotationNorth()

    let color = 0x8D9194 //grey
    if ( selectedMap > 0 ) color = this.map_providers[selectedMap][2]
    let material = this.viewer.sceneManager.solidMaterial.clone()
    material.color = new THREE.Color( color )
    
    let m = new THREE.Mesh( geom, material )
    
    return m
    
  }

}