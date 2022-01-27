import * as THREE from 'three'
import * as Geo from 'geo-three'
import {OSM3} from './osmthree'
import InteractionHandler from './InteractionHandler'
import { Units, getConversionFactor } from './converter/Units'

export default class SceneSurroundings {

    constructor( viewer ) {
        this.viewer = viewer
        this.interactions = new InteractionHandler( this.viewer )
        
        //Speckle token for localhost only
        var DEV_MAPBOX_API_KEY = "pk.eyJ1Ijoia2F0LXNwZWNrbGUiLCJhIjoiY2t5cm1oZDZmMHZkbTJxbzVhdnkxeGYzaCJ9.JXufxeNiDCDDi5JgzUrsbQ"; 

        // adding map tiles
        this.map_providers = [
            ["No map"],
            ["Mapbox Streets", new Geo.MapBoxProvider(DEV_MAPBOX_API_KEY, "mapbox/streets-v10", Geo.MapBoxProvider.STYLE), 0x8D9194], //works (custom token)
            ["Mapbox Monochrome", new Geo.MapBoxProvider(DEV_MAPBOX_API_KEY, "kat-speckle/ckyse56qx2w4h14pe0555b6mt", Geo.MapBoxProvider.STYLE), 0xa4adbf], //works (custom token)
            ["Mapbox Satellite", new Geo.MapBoxProvider(DEV_MAPBOX_API_KEY, "mapbox.satellite", Geo.MapBoxProvider.MAP_ID, "jpg70", false),0x595755], //works (custom token)

            ["Mapbox Streets 3D Buildings", new Geo.MapBoxProvider(DEV_MAPBOX_API_KEY, "mapbox/streets-v10", Geo.MapBoxProvider.STYLE), 0x8D9194], //works (custom token)
            ["Mapbox Monochrome 3D Buildings", new Geo.MapBoxProvider(DEV_MAPBOX_API_KEY, "kat-speckle/ckyse56qx2w4h14pe0555b6mt", Geo.MapBoxProvider.STYLE), 0xa4adbf], //works (custom token)
            ["Mapbox Satellite 3D Buildings", new Geo.MapBoxProvider(DEV_MAPBOX_API_KEY, "mapbox.satellite", Geo.MapBoxProvider.MAP_ID, "jpg70", false),0x595755], //works (custom token)

            ];
        
        this.map_modes = [
                ["Planar", Geo.MapView.PLANAR],
                ["Height", Geo.MapView.HEIGHT],
                // ["Martini", Geo.MapView.MARTINI],
                ["Height Shader", Geo.MapView.HEIGHT_SHADER],
                ["Spherical", Geo.MapView.SPHERICAL]
            ];
        
        this.addUnitsList()
        this.addMapsList()

    }

    addUnitsList(){
        if (document.getElementById("mapUnits")){
            var mapUnits = document.getElementById("mapUnits");

            for (var key of Object.keys(Units) ) {
            var option = document.createElement("option");
            option.innerHTML = Units[key];
            mapUnits.appendChild(option);
            }
        }
    }

    addMapsList(){
        if (document.getElementById("providerColor")){
            var providerColor = document.getElementById("providerColor");

            for (var i = 0; i < this.map_providers.length ; i++) {
            var option = document.createElement("option");
            option.innerHTML = this.map_providers[i][0];
            providerColor.appendChild(option);
            }
        }
    }
    addMap() {
        // example building https://latest.speckle.dev/streams/8b29ca2b2e/objects/288f67a0a45b2a4c3bd01f7eb3032495
        var providerColor = document.getElementById("providerColor");
        this.removeMap();

        if (providerColor.selectedIndex <=3 ) this.hideBuild(); // hide if there should NOT be buildings
        if (providerColor.selectedIndex >3 && !this.viewer.scene.getObjectByName("OSM 3d buildings"))  this.addBuildings(); // add if there should be buildings, but not are in the scene yet
        if (providerColor.selectedIndex >3 && this.viewer.scene.getObjectByName("OSM 3d buildings"))   this.showBuild(); // show and change color if there should be buildings, and they are already in the scene

        if (providerColor.selectedIndex >0){
            //create and add map to scene
            var map = new Geo.MapView(this.map_modes[0][1], this.map_providers[providerColor.selectedIndex][1], this.map_providers[providerColor.selectedIndex][1]);
            map.name = "Base map"
            this.viewer.scene.add(map);
            map.rotation.x += Math.PI/2;

            //set selected map provider
            map.setProvider(this.map_providers[providerColor.selectedIndex][1]);

            var coords = this.getCoords()[0];
            var scale = this.getScale();
            var rotationNorth = this.rotationNorth();
                
            map.scale.set(map.scale.x/scale, map.scale.y/scale, map.scale.z/scale)

            map.rotation.y += rotationNorth; //rotate around (0,0,0)

            var movingVector = new THREE.Vector3(coords.x/scale, coords.y/scale, 0) //get vector to location on the map
            var rotatedVector = movingVector.applyAxisAngle( new THREE.Vector3(0,0,1), rotationNorth) //rotate vector same as the map
            map.position.x -= rotatedVector.x
            map.position.y -= rotatedVector.y
            
            this.interactions.rotateCamera(0.001) //to activate map loading
        }
    }
    getScale(){
        if (document.getElementById("mapUnits")){
            var scale = 0.001; //mm
            var scale_units = "mm"
            scale_units = document.getElementById("mapUnits").value;
            scale = getConversionFactor(scale_units);
            return scale
        }
        else return 1
    }
    getCoords(){
        if (document.getElementById("zeroCoordInputX") && document.getElementById("zeroCoordInputY")){
            // get and transform coordinates
            var coord_x = Number(document.getElementById( 'zeroCoordInputX' ).value)
            var coord_y = Number(document.getElementById( 'zeroCoordInputY' ).value)
            var coords_transformed = Geo.UnitsUtils.datumsToSpherical(coord_x,coord_y)
            return [coords_transformed, coord_x, coord_y]; // 51.506810732490656, -0.0892642750895124
        }
        else return [51.506810732490656, -0.0892642750895124]
    }
    rotationNorth(){
        if (document.getElementById("North angle")){
            var angle = Number(document.getElementById("North angle").value);
            return -angle*Math.PI/180
        }
        else return 0
    }
    addBuildings(){
        var scale = this.getScale();
        var coord_x = this.getCoords()[1];
        var coord_y = this.getCoords()[2];

        var color = 0x8D9194; //grey
        //color = 0xa3a3a3; //light grey
        //color = 0x4287f5; //blue
        color = this.map_providers[providerColor.selectedIndex][2]

        //var material = this.sceneManager.solidMaterial;
        let material = this.viewer.sceneManager.solidMaterial.clone()
        material.color = new THREE.Color(color);
        window.OSM3.makeBuildings( this.viewer.scene, [ coord_y-0.01, coord_x-0.01, coord_y+0.01, coord_x+0.01 ], { scale: scale, color: color, material: material, name: "OSM 3d buildings" } );
        
        this.viewer.render();
    }
    removeMap(){
        var selectedObject = this.viewer.scene.getObjectByName("Base map")
        this.viewer.scene.remove( selectedObject );    
        this.viewer.render();
    }
    hideBuild(){
        this.viewer.scene.traverse(function(child) {
        if (child.name === "OSM 3d buildings") {
            child.visible = false;
        }
        });
        this.viewer.render();
    }
    showBuild(){
        var c = this.map_providers[providerColor.selectedIndex][2]
        var mat = this.viewer.sceneManager.solidMaterial.clone()
        this.viewer.scene.traverse(function(child) {
        if (child.name === "OSM 3d buildings") {
            mat.color = new THREE.Color(c);
            child.material = mat;
            child.visible = true;
        }
        });
        this.viewer.render();
    }
}