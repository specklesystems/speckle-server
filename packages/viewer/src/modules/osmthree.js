const { RAD2DEG } = require("three/src/math/MathUtils");

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Copyright (c) 2011, Sun Ning.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

var BASE32_CODES = "0123456789bcdefghjkmnpqrstuvwxyz";
var BASE32_CODES_DICT = {};
for (var i = 0; i < BASE32_CODES.length; i++) {
  BASE32_CODES_DICT[BASE32_CODES.charAt(i)] = i;
}

var ENCODE_AUTO = 'auto';
/**
 * Significant Figure Hash Length
 *
 * This is a quick and dirty lookup to figure out how long our hash
 * should be in order to guarantee a certain amount of trailing
 * significant figures. This was calculated by determining the error:
 * 45/2^(n-1) where n is the number of bits for a latitude or
 * longitude. Key is # of desired sig figs, value is minimum length of
 * the geohash.
 * @type Array
 */
//     Desired sig figs:  0  1  2  3  4   5   6   7   8   9  10
var SIGFIG_HASH_LENGTH = [0, 5, 7, 8, 11, 12, 13, 15, 16, 17, 18];
/**
 * Encode
 *
 * Create a Geohash out of a latitude and longitude that is
 * `numberOfChars` long.
 *
 * @param {Number|String} latitude
 * @param {Number|String} longitude
 * @param {Number} numberOfChars
 * @returns {String}
 */
var encode = function (latitude, longitude, numberOfChars) {
  if (numberOfChars === ENCODE_AUTO) {
    if (typeof(latitude) === 'number' || typeof(longitude) === 'number') {
      throw new Error('string notation required for auto precision.');
    }
    var decSigFigsLat = latitude.split('.')[1].length;
    var decSigFigsLong = longitude.split('.')[1].length;
    var numberOfSigFigs = Math.max(decSigFigsLat, decSigFigsLong);
    numberOfChars = SIGFIG_HASH_LENGTH[numberOfSigFigs];
  } else if (numberOfChars === undefined) {
    numberOfChars = 9;
  }

  var chars = [],
  bits = 0,
  bitsTotal = 0,
  hash_value = 0,
  maxLat = 90,
  minLat = -90,
  maxLon = 180,
  minLon = -180,
  mid;
  while (chars.length < numberOfChars) {
    if (bitsTotal % 2 === 0) {
      mid = (maxLon + minLon) / 2;
      if (longitude > mid) {
        hash_value = (hash_value << 1) + 1;
        minLon = mid;
      } else {
        hash_value = (hash_value << 1) + 0;
        maxLon = mid;
      }
    } else {
      mid = (maxLat + minLat) / 2;
      if (latitude > mid) {
        hash_value = (hash_value << 1) + 1;
        minLat = mid;
      } else {
        hash_value = (hash_value << 1) + 0;
        maxLat = mid;
      }
    }

    bits++;
    bitsTotal++;
    if (bits === 5) {
      var code = BASE32_CODES[hash_value];
      chars.push(code);
      bits = 0;
      hash_value = 0;
    }
  }
  return chars.join('');
};

/**
 * Encode Integer
 *
 * Create a Geohash out of a latitude and longitude that is of 'bitDepth'.
 *
 * @param {Number} latitude
 * @param {Number} longitude
 * @param {Number} bitDepth
 * @returns {Number}
 */
var encode_int = function (latitude, longitude, bitDepth) {

  bitDepth = bitDepth || 52;

  var bitsTotal = 0,
  maxLat = 90,
  minLat = -90,
  maxLon = 180,
  minLon = -180,
  mid,
  combinedBits = 0;

  while (bitsTotal < bitDepth) {
    combinedBits *= 2;
    if (bitsTotal % 2 === 0) {
      mid = (maxLon + minLon) / 2;
      if (longitude > mid) {
        combinedBits += 1;
        minLon = mid;
      } else {
        maxLon = mid;
      }
    } else {
      mid = (maxLat + minLat) / 2;
      if (latitude > mid) {
        combinedBits += 1;
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    bitsTotal++;
  }
  return combinedBits;
};

/**
 * Decode Bounding Box
 *
 * Decode hashString into a bound box matches it. Data returned in a four-element array: [minlat, minlon, maxlat, maxlon]
 * @param {String} hash_string
 * @returns {Array}
 */
var decode_bbox = function (hash_string) {
  var isLon = true,
  maxLat = 90,
  minLat = -90,
  maxLon = 180,
  minLon = -180,
  mid;

  var hashValue = 0;
  for (var i = 0, l = hash_string.length; i < l; i++) {
    var code = hash_string[i].toLowerCase();
    hashValue = BASE32_CODES_DICT[code];

    for (var bits = 4; bits >= 0; bits--) {
      var bit = (hashValue >> bits) & 1;
      if (isLon) {
        mid = (maxLon + minLon) / 2;
        if (bit === 1) {
          minLon = mid;
        } else {
          maxLon = mid;
        }
      } else {
        mid = (maxLat + minLat) / 2;
        if (bit === 1) {
          minLat = mid;
        } else {
          maxLat = mid;
        }
      }
      isLon = !isLon;
    }
  }
  return [minLat, minLon, maxLat, maxLon];
};

/**
 * Decode Bounding Box Integer
 *
 * Decode hash number into a bound box matches it. Data returned in a four-element array: [minlat, minlon, maxlat, maxlon]
 * @param {Number} hashInt
 * @param {Number} bitDepth
 * @returns {Array}
 */
var decode_bbox_int = function (hashInt, bitDepth) {

  bitDepth = bitDepth || 52;

  var maxLat = 90,
  minLat = -90,
  maxLon = 180,
  minLon = -180;

  var latBit = 0, lonBit = 0;
  var step = bitDepth / 2;

  for (var i = 0; i < step; i++) {

    lonBit = get_bit(hashInt, ((step - i) * 2) - 1);
    latBit = get_bit(hashInt, ((step - i) * 2) - 2);

    if (latBit === 0) {
      maxLat = (maxLat + minLat) / 2;
    }
    else {
      minLat = (maxLat + minLat) / 2;
    }

    if (lonBit === 0) {
      maxLon = (maxLon + minLon) / 2;
    }
    else {
      minLon = (maxLon + minLon) / 2;
    }
  }
  return [minLat, minLon, maxLat, maxLon];
};

function get_bit(bits, position) {
  return (bits / Math.pow(2, position)) & 0x01;
}

/**
 * Decode
 *
 * Decode a hash string into pair of latitude and longitude. A javascript object is returned with keys `latitude`,
 * `longitude` and `error`.
 * @param {String} hashString
 * @returns {Object}
 */
var decode = function (hashString) {
  var bbox = decode_bbox(hashString);
  var lat = (bbox[0] + bbox[2]) / 2;
  var lon = (bbox[1] + bbox[3]) / 2;
  var latErr = bbox[2] - lat;
  var lonErr = bbox[3] - lon;
  return {latitude: lat, longitude: lon,
          error: {latitude: latErr, longitude: lonErr}};
};

/**
 * Decode Integer
 *
 * Decode a hash number into pair of latitude and longitude. A javascript object is returned with keys `latitude`,
 * `longitude` and `error`.
 * @param {Number} hash_int
 * @param {Number} bitDepth
 * @returns {Object}
 */
var decode_int = function (hash_int, bitDepth) {
  var bbox = decode_bbox_int(hash_int, bitDepth);
  var lat = (bbox[0] + bbox[2]) / 2;
  var lon = (bbox[1] + bbox[3]) / 2;
  var latErr = bbox[2] - lat;
  var lonErr = bbox[3] - lon;
  return {latitude: lat, longitude: lon,
          error: {latitude: latErr, longitude: lonErr}};
};

/**
 * Neighbor
 *
 * Find neighbor of a geohash string in certain direction. Direction is a two-element array, i.e. [1,0] means north, [-1,-1] means southwest.
 * direction [lat, lon], i.e.
 * [1,0] - north
 * [1,1] - northeast
 * ...
 * @param {String} hashString
 * @param {Array} Direction as a 2D normalized vector.
 * @returns {String}
 */
var neighbor = function (hashString, direction) {
  var lonLat = decode(hashString);
  var neighborLat = lonLat.latitude
    + direction[0] * lonLat.error.latitude * 2;
  var neighborLon = lonLat.longitude
    + direction[1] * lonLat.error.longitude * 2;
  return encode(neighborLat, neighborLon, hashString.length);
};

/**
 * Neighbor Integer
 *
 * Find neighbor of a geohash integer in certain direction. Direction is a two-element array, i.e. [1,0] means north, [-1,-1] means southwest.
 * direction [lat, lon], i.e.
 * [1,0] - north
 * [1,1] - northeast
 * ...
 * @param {String} hash_string
 * @returns {Array}
*/
var neighbor_int = function(hash_int, direction, bitDepth) {
    bitDepth = bitDepth || 52;
    var lonlat = decode_int(hash_int, bitDepth);
    var neighbor_lat = lonlat.latitude + direction[0] * lonlat.error.latitude * 2;
    var neighbor_lon = lonlat.longitude + direction[1] * lonlat.error.longitude * 2;
    return encode_int(neighbor_lat, neighbor_lon, bitDepth);
};

/**
 * Neighbors
 *
 * Returns all neighbors' hashstrings clockwise from north around to northwest
 * 7 0 1
 * 6 x 2
 * 5 4 3
 * @param {String} hash_string
 * @returns {encoded neighborHashList|Array}
 */
var neighbors = function(hash_string){

    var hashstringLength = hash_string.length;

    var lonlat = decode(hash_string);
    var lat = lonlat.latitude;
    var lon = lonlat.longitude;
    var latErr = lonlat.error.latitude * 2;
    var lonErr = lonlat.error.longitude * 2;

    var neighbor_lat,
        neighbor_lon;

    var neighborHashList = [
                            encodeNeighbor(1,0),
                            encodeNeighbor(1,1),
                            encodeNeighbor(0,1),
                            encodeNeighbor(-1,1),
                            encodeNeighbor(-1,0),
                            encodeNeighbor(-1,-1),
                            encodeNeighbor(0,-1),
                            encodeNeighbor(1,-1)
                            ];

    function encodeNeighbor(neighborLatDir, neighborLonDir){
        neighbor_lat = lat + neighborLatDir * latErr;
        neighbor_lon = lon + neighborLonDir * lonErr;
        return encode(neighbor_lat, neighbor_lon, hashstringLength);
    }

    return neighborHashList;
};

/**
 * Neighbors Integer
 *
 * Returns all neighbors' hash integers clockwise from north around to northwest
 * 7 0 1
 * 6 x 2
 * 5 4 3
 * @param {Number} hash_int
 * @param {Number} bitDepth
 * @returns {encode_int'd neighborHashIntList|Array}
 */
var neighbors_int = function(hash_int, bitDepth){

    bitDepth = bitDepth || 52;

    var lonlat = decode_int(hash_int, bitDepth);
    var lat = lonlat.latitude;
    var lon = lonlat.longitude;
    var latErr = lonlat.error.latitude * 2;
    var lonErr = lonlat.error.longitude * 2;

    var neighbor_lat,
        neighbor_lon;

    var neighborHashIntList = [
                            encodeNeighbor_int(1,0),
                            encodeNeighbor_int(1,1),
                            encodeNeighbor_int(0,1),
                            encodeNeighbor_int(-1,1),
                            encodeNeighbor_int(-1,0),
                            encodeNeighbor_int(-1,-1),
                            encodeNeighbor_int(0,-1),
                            encodeNeighbor_int(1,-1)
                            ];

    function encodeNeighbor_int(neighborLatDir, neighborLonDir){
        neighbor_lat = lat + neighborLatDir * latErr;
        neighbor_lon = lon + neighborLonDir * lonErr;
        return encode_int(neighbor_lat, neighbor_lon, bitDepth);
    }

    return neighborHashIntList;
};


/**
 * Bounding Boxes
 *
 * Return all the hashString between minLat, minLon, maxLat, maxLon in numberOfChars
 * @param {Number} minLat
 * @param {Number} minLon
 * @param {Number} maxLat
 * @param {Number} maxLon
 * @param {Number} numberOfChars
 * @returns {bboxes.hashList|Array}
 */
var bboxes = function (minLat, minLon, maxLat, maxLon, numberOfChars) {
  numberOfChars = numberOfChars || 9;

  var hashSouthWest = encode(minLat, minLon, numberOfChars);
  var hashNorthEast = encode(maxLat, maxLon, numberOfChars);

  var latLon = decode(hashSouthWest);

  var perLat = latLon.error.latitude * 2;
  var perLon = latLon.error.longitude * 2;

  var boxSouthWest = decode_bbox(hashSouthWest);
  var boxNorthEast = decode_bbox(hashNorthEast);

  var latStep = Math.round((boxNorthEast[0] - boxSouthWest[0]) / perLat);
  var lonStep = Math.round((boxNorthEast[1] - boxSouthWest[1]) / perLon);

  var hashList = [];

  for (var lat = 0; lat <= latStep; lat++) {
    for (var lon = 0; lon <= lonStep; lon++) {
      hashList.push(neighbor(hashSouthWest, [lat, lon]));
    }
  }

  return hashList;
};

/**
 * Bounding Boxes Integer
 *
 * Return all the hash integers between minLat, minLon, maxLat, maxLon in bitDepth
 * @param {Number} minLat
 * @param {Number} minLon
 * @param {Number} maxLat
 * @param {Number} maxLon
 * @param {Number} bitDepth
 * @returns {bboxes_int.hashList|Array}
 */
var bboxes_int = function(minLat, minLon, maxLat, maxLon, bitDepth){
    bitDepth = bitDepth || 52;

    var hashSouthWest = encode_int(minLat, minLon, bitDepth);
    var hashNorthEast = encode_int(maxLat, maxLon, bitDepth);

    var latlon = decode_int(hashSouthWest, bitDepth);

    var perLat = latlon.error.latitude * 2;
    var perLon = latlon.error.longitude * 2;

    var boxSouthWest = decode_bbox_int(hashSouthWest, bitDepth);
    var boxNorthEast = decode_bbox_int(hashNorthEast, bitDepth);

    var latStep = Math.round((boxNorthEast[0] - boxSouthWest[0])/perLat);
    var lonStep = Math.round((boxNorthEast[1] - boxSouthWest[1])/perLon);

    var hashList = [];

    for(var lat = 0; lat <= latStep; lat++){
        for(var lon = 0; lon <= lonStep; lon++){
            hashList.push(neighbor_int(hashSouthWest,[lat, lon], bitDepth));
        }
    }

    return hashList;
};

var geohash = {
  'ENCODE_AUTO': ENCODE_AUTO,
  'encode': encode,
  'encode_uint64': encode_int, // keeping for backwards compatibility, will deprecate
  'encode_int': encode_int,
  'decode': decode,
  'decode_int': decode_int,
  'decode_uint64': decode_int, // keeping for backwards compatibility, will deprecate
  'decode_bbox': decode_bbox,
  'decode_bbox_uint64': decode_bbox_int, // keeping for backwards compatibility, will deprecate
  'decode_bbox_int': decode_bbox_int,
  'neighbor': neighbor,
  'neighbor_int': neighbor_int,
  'neighbors': neighbors,
  'neighbors_int': neighbors_int,
  'bboxes': bboxes,
  'bboxes_int': bboxes_int
};

module.exports = geohash;

},{}],2:[function(require,module,exports){


function constructor( scene, scale, origin, options ) {
  //console.log(options)
  /*
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(200, 500, 300);
  scene.add(directionalLight); 
  */
	var 
		options = options || {},
		_readyCallback = scene,
		_scale = scale,
    _color = options.color || 0xf0f0f0,
    _name = options.name,
    _material = options.material,
    _rotation = options.rotation,
		_origin = lonLatToWorld( (origin[2]+origin[0])/2, (origin[3]+origin[1])/2 ),
		_meshCallback = options.meshCallback || createMesh,
		_defaultColor = options.defaultColor || 0xf0f0f0;


	this.build = function( items ) {

		var bldg, currVerLen,
			mats = [],
			ids = [];
			//geom = new THREE.Geometry();

		for ( var i=0, len=items.length; i < len; i++ ) {
			bldg = makeBldgGeom( items[i] );
      //console.log(bldg)
			if (bldg) { 
				//if (_readyCallback) _readyCallback( _meshCallback.call( this, bldg, items[i] ) );
        createMesh( bldg, [(origin[3]+origin[1])/2, (origin[2]+origin[0])/2], scene, scale, _name, _material, _rotation );
			}
			//currVerLen = geom.vertices.length;
			//geom.vertices = geom.vertices.concat( bldg.vertices );
			//geom.faces = geom.faces.concat( updateFaces( bldg.faces, currVerLen ) );
			//mats = mats.concat( bldg.materials );
			// Is this really necessary?
			//for ( var j = 0, fLen = bldg.faces.length; j < fLen; j++ ) {
				//ids.push( i );
			//}
		}

		// TODO Create the mesh object and any necessary material objects
		//_scene.add( new THREE.Mesh( geom, new THREE.MeshNormalMaterial() ) );

	}


	function updateFaces( faces, len ) {
		for ( var i=0, flen = faces.length; i < flen; i++ ) {
			faces[i].a += len;
			faces[i].b += len;
			faces[i].c += len;
			if ( faces[i].d ) {
				faces[i].d += len;
			}
		}
		return faces;
	}


	function createMesh( geom, origin, scene, scale, name, material, rotation ) {
		//	return new THREE.Mesh( geom, new THREE.MeshLambertMaterial() );
    /*
		var face,
			mats = [],
			wci = 0,
			rci = 0;
		if ( osmData.wallColor ) {
			mats.push( new THREE.MeshLambertMaterial( {color: osmData.wallColor }) );
		} else {
			mats.push( new THREE.MeshLambertMaterial( {color: _defaultColor } ) );
		}
		if ( osmData.roofColor ) {
			mats.push( new THREE.MeshLambertMaterial( {color: osmData.roofColor }) );
			rci = 1;
		}
    //console.log(geom)
    
		for ( var i=0, len=geom.faces.length; i < len; i++ ) {
			face = geom.faces[i];
			( face.normal.y === 1 ) ? face.materialIndex = rci
								    : face.materialIndex = wci;
		}
		//m.footprint = osmData.footprint;
    */
    //console.log(geom)
		//var m = new THREE.Mesh( geom, new THREE.MeshBasicMaterial( { color: 0x00ff00 } ) ); ShadowMaterial();
    //var material = new THREE.MeshBasicMaterial({ color: color });
		var m = new THREE.Mesh( geom, material );
    m.name = name
    m.userData.coords = new THREE.Vector3(origin[0],origin[1],0)

    scene.add(m)
    m.rotation.x += Math.PI/2;
    m.scale.set(1/scale, 1/scale, 1/scale)

    // bring mesh to zero coord and rotate
    var movingVector = new THREE.Vector3(m.position.x, m.position.y, 0) //get vector to correct location on the map
    m.position.x -= movingVector.x
    m.position.y -= movingVector.y
    m.rotation.y += rotation; //rotate around (0,0,0)

    // move mesh back, but rotate the initial vector as well
    var rotatedVector = movingVector.applyAxisAngle( new THREE.Vector3(0,0,1), rotation) //rotate vector same as the map
    m.position.x += rotatedVector.x
    m.position.y += rotatedVector.y

    //m.geometry.computeBoundingBox();
    //console.log( m.geometry.boundingBox );

		return m;
	}


	function lonLatToWorld( lon, lat ) {
		var x, y, pointX, pointY, latRad, mercN,
			worldWidth = 40075000,
			worldHeight = 40008000;

		x = ( lon + 180 ) * ( worldWidth / 360);
		latRad = lat*Math.PI/180;
		mercN = Math.log( Math.tan((Math.PI/4)+(latRad/2)));
		y = (worldHeight/2)-(worldHeight*mercN/(2*Math.PI));
		return [ x, y ]
	}


	function lonLatToScene( lon, lat ) {
		var point = lonLatToWorld( lon, lat );
		// This looks weird, and it is kind of a hack, but it's done because of the way THREE.ExtrudeGeometry converts
		// Vector2 x,y coordinates into x,z coordinates in Vector3 objects.  +x +y goes to -z,-x.  This effectively rotates
		// the geometries, putting them in the correct quadrant.   Doing an actual rotation might be cleaner, but, well.
		return new THREE.Vector2( _origin[1] - point[1], _origin[0] - point[0] );
	}


	function makeBldgGeom( item ) {
		// Create a path
		var pointX, pointY, extrudePath, eg,
			path, shapes,
			bldgHeight = item.height,
			pathPoints = [];
		
		for ( var i = 0, last = item.footprint.length-1; i < last; i+=2 ) {
			pathPoints.push( lonLatToScene( item.footprint[i+1], item.footprint[i] ) );
		}

    //pathPoints.reverse()
		path = new THREE.ShapePath();
    //console.log(pathPoints)
    if (pathPoints.length>1) {
      path.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (var i = 0, il = pathPoints.length; i < il; i++) {
        if (i<pathPoints.length-1) path.lineTo(pathPoints[i+1].x, pathPoints[i+1].y);
        else path.lineTo(pathPoints[0].x, pathPoints[0].y)
      }
    }
    //console.log(path)
		shapes = path.toShapes(); // isCCW, noHoles
    //console.log(shapes)

		extrudePath = new THREE.CurvePath();
		extrudePath.add( new THREE.LineCurve3( new THREE.Vector3(0,0,0), new THREE.Vector3(0,bldgHeight,0) ) );

		eg = new THREE.ExtrudeGeometry( shapes, {
			extrudePath: extrudePath
			//steps: 2,
      //depth: 16,
      //bevelEnabled: true,
      //bevelThickness: 1,
      //bevelSize: 1,
      //bevelOffset: 0,
      //bevelSegments: 1
		})
    //console.log(eg)

		return eg;

	}

}

module.exports = constructor;
},{}],3:[function(require,module,exports){

var YARD_TO_METER = 0.9144,
    FOOT_TO_METER = 0.3048,
    INCH_TO_METER = 0.0254,
    METERS_PER_LEVEL = 3,
    DEFAULT_HEIGHT = 5,

    clockwise = 'CW',
    counterClockwise = 'CCW';


module.exports = {

  YARD_TO_METER: YARD_TO_METER,
  FOOT_TO_METER: FOOT_TO_METER,
  INCH_TO_METER: INCH_TO_METER,
  METERS_PER_LEVEL: METERS_PER_LEVEL,
  DEFAULT_HEIGHT: DEFAULT_HEIGHT,

  clockwise: clockwise,
  counterClockwise: counterClockwise,

  // detect winding direction: clockwise or counter clockwise
  getWinding: function(points) {
    var x1, y1, x2, y2,
      a = 0,
      i, il;
    for (i = 0, il = points.length-3; i < il; i += 2) {
      x1 = points[i];
      y1 = points[i+1];
      x2 = points[i+2];
      y2 = points[i+3];
      a += x1*y2 - x2*y1;
    }
    return (a/2) > 0 ? this.clockwise : this.counterClockwise;
  },

  // enforce a polygon winding direcetion. Needed for proper backface culling.
  makeWinding: function(points, direction) {
    var winding = this.getWinding(points);
    if (winding === direction) {
      return points;
    }
    var revPoints = [];
    for (var i = points.length-2; i >= 0; i -= 2) {
      revPoints.push(points[i], points[i+1]);
    }
    return revPoints;
  },

  toMeters: function(str) {
    str = '' + str;
    var value = parseFloat(str);
    if (value === str) {
      return value <<0;
    }
    if (~str.indexOf('m')) {
      return value <<0;
    }
    if (~str.indexOf('yd')) {
      return value*this.YARD_TO_METER <<0;
    }
    if (~str.indexOf('ft')) {
      return value*this.FOOT_TO_METER <<0;
    }
    if (~str.indexOf('\'')) {
      var parts = str.split('\'');
      var res = parts[0]*this.FOOT_TO_METER + parts[1]*this.INCH_TO_METER;
      return res <<0;
    }
    return value <<0;
  },

  getRadius: function(points) {
    var minLat = 90, maxLat = -90;
    for (var i = 0, il = points.length; i < il; i += 2) {
      minLat = Math.min(minLat, points[i]);
      maxLat = Math.max(maxLat, points[i]);
    }
    //sconsole.log(RAD2DEG)
    return (maxLat-minLat) / RAD2DEG * 6378137 / 2 <<0; // 6378137 = Earth radius
  },

  materialColors: {
    brick:'#cc7755',
    bronze:'#ffeecc',
    canvas:'#fff8f0',
    concrete:'#999999',
    copper:'#a0e0d0',
    glass:'#e8f8f8',
    gold:'#ffcc00',
    plants:'#009933',
    metal:'#aaaaaa',
    panel:'#fff8f0',
    plaster:'#999999',
    roof_tiles:'#f08060',
    silver:'#cccccc',
    slate:'#666666',
    stone:'#996666',
    tar_paper:'#333333',
    wood:'#deb887'
  },

  baseMaterials: {
    asphalt:'tar_paper',
    bitumen:'tar_paper',
    block:'stone',
    bricks:'brick',
    glas:'glass',
    glassfront:'glass',
    grass:'plants',
    masonry:'stone',
    granite:'stone',
    panels:'panel',
    paving_stones:'stone',
    plastered:'plaster',
    rooftiles:'roof_tiles',
    roofingfelt:'tar_paper',
    sandstone:'stone',
    sheet:'canvas',
    sheets:'canvas',
    shingle:'tar_paper',
    shingles:'tar_paper',
    slates:'slate',
    steel:'metal',
    tar:'tar_paper',
    tent:'canvas',
    thatch:'plants',
    tile:'roof_tiles',
    tiles:'roof_tiles'
  },

  // cardboard
  // eternit
  // limestone
  // straw

  getMaterialColor: function(str) {
    str = str.toLowerCase();
    if (str[0] === '#') {
      return str;
    }
    return this.materialColors[this.baseMaterials[str] || str] || null;
  },

  // aligns and cleans up properties in place
  alignProperties: function(prop) {
    var item = {};

    prop = prop || {};

    item.height = this.toMeters(prop.height);
    if (!item.height) {
      if (prop['building:height']) {
        item.height = this.toMeters(prop['building:height']);
      }
      if (prop.levels) {
        item.height = prop.levels*this.METERS_PER_LEVEL <<0;
      }
      if (prop['building:levels']) {
        item.height = prop['building:levels']*this.METERS_PER_LEVEL <<0;
      }
      if (!item.height) {
        item.height = DEFAULT_HEIGHT;
      }
    }

    item.minHeight = this.toMeters(prop.min_height);
    if (!item.min_height) {
      if (prop['building:min_height']) {
        item.minHeight = this.toMeters(prop['building:min_height']);
      }
      if (prop.min_level) {
        item.minHeight = prop.min_level*this.METERS_PER_LEVEL <<0;
      }
      if (prop['building:min_level']) {
        item.minHeight = prop['building:min_level']*this.METERS_PER_LEVEL <<0;
      }
    }

    item.wallColor = prop.wallColor || prop.color;
    if (!item.wallColor) {
      if (prop.color) {
        item.wallColor = prop.color;
      }
      if (prop['building:material']) {
        item.wallColor = this.getMaterialColor(prop['building:material']);
      }
      if (prop['building:facade:material']) {
        item.wallColor = this.getMaterialColor(prop['building:facade:material']);
      }
      if (prop['building:cladding']) {
        item.wallColor = this.getMaterialColor(prop['building:cladding']);
      }
      // wall color
      if (prop['building:color']) {
        item.wallColor = prop['building:color'];
      }
      if (prop['building:colour']) {
        item.wallColor = prop['building:colour'];
      }
    }

    item.roofColor = prop.roofColor;
    if (!item.roofColor) {
      if (prop['roof:material']) {
        item.roofColor = this.getMaterialColor(prop['roof:material']);
      }
      if (prop['building:roof:material']) {
        item.roofColor = this.getMaterialColor(prop['building:roof:material']);
      }
      // roof color
      if (prop['roof:color']) {
        item.roofColor = prop['roof:color'];
      }
      if (prop['roof:colour']) {
        item.roofColor = prop['roof:colour'];
      }
      if (prop['building:roof:color']) {
        item.roofColor = prop['building:roof:color'];
      }
      if (prop['building:roof:colour']) {
        item.roofColor = prop['building:roof:colour'];
      }
    }

    switch (prop['building:shape']) {
      case 'cone':
      case 'cylinder':
        item.shape = prop['building:shape'];
      break;

      case 'dome':
        item.shape = 'dome';
      break;

      case 'sphere':
        item.shape = 'cylinder';
      break;
    }

    if ((prop['roof:shape'] === 'cone' || prop['roof:shape'] === 'dome') && prop['roof:height']) {
      item.shape = 'cylinder';
      item.roofShape = prop['roof:shape'];
      item.roofHeight = this.toMeters(prop['roof:height']);
    }

    if (item.roofHeight) {
      item.height = Math.max(0, item.height-item.roofHeight);
    } else {
      item.roofHeight = 0;
    }

    return item;
  }
};

},{}],4:[function(require,module,exports){


// Loader is responsible for fetching data from the Overpass API

function constructor() {

	var OSM_XAPI_URL = 'http://overpass-api.de/api/interpreter?data=[out:json];(way[%22building%22]({s},{w},{n},{e});node(w);way[%22building:part%22=%22yes%22]({s},{w},{n},{e});node(w);relation[%22building%22]({s},{w},{n},{e});way(r);node(w););out;';
  // http://overpass-api.de/api/interpreter?data=[out:json];(way[%22building%22](-0.0892642750895124,51.506810732490656,-0.09,51.6);node(w);way[%22building:part%22=%22yes%22](-0.0892642750895124,51.506810732490656,-0.09,51.6);node(w);relation[%22building%22](-0.0892642750895124,51.506810732490656,-0.09,51.6);way(r);node(w););out;
	var req = new XMLHttpRequest();

	function xhr(url, param, callback) {

		url = url.replace(/\{ *([\w_]+) *\}/g, function(tag, key) {
			return param[key] || tag;
		});

		req.onerror = function() {
			req.status = 500;
			req.statusText = 'Error';
		};

		req.ontimeout = function() {
			req.status = 408;
			req.statusText = 'Timeout';
		};

		req.onprogress = function() {
		};

		req.onload = function() {
			req.status = 200;
			req.statusText = 'Ok';
		};

		req.onreadystatechange = function() {
			if (req.readyState !== 4) {
			  return;
			}
			if (!req.status || req.status < 200 || req.status > 299) {
			  return;
			}
			if (callback && req.responseText) {
			  callback( JSON.parse(req.responseText) );
			}
		}

		req.open('GET', url);
		req.send(null);

	};


	// load fetches data from the Overpass API for the given bounding box
	// PARAMETERS:
	// 	bbox 		--> a four float array consisting of [ <min lon>, <min lat>, <max lon>, <max lat> ], 
	// 	callback 	--> a callback function to be called when the data is returned
	this.load = function( bbox, callback ) {
    //console.log(bbox)
		var params = {
			e: bbox[2],
			n: bbox[3],
			s: bbox[1],
			w: bbox[0]
		}
		xhr( OSM_XAPI_URL, params, callback );
	}

}

module.exports = constructor;
},{}],5:[function(require,module,exports){

var Loader = require("./loader.js"),
	Parser = require("./parser.js"),
	Builder = require("./builder.js"),
	ngeo = require('ngeohash');   // TEMPORARY!  Or maybe not?

// makeBuildings fetches data from the Overpass API and builds three.js 3d models of buildings for everything
// found within the given bounding box.
// PARAMETERS:
//	callback --> a function that gets called when a building mesh is completely built and ready to be added to a scene
//	bbox 	 --> a four float array specifying the min and max latitude and longitude coordinates whithin which to fetch
//				 buildings.  [ <min_lon>, <min_lat>, <max_lon>, <max_lat> ] (Note: It's lon,lat not lat,lon)
//	params 	 --> an object that contains optional parameters to further control how the buildings are created.  See the source code.
function makeBuildings( callback, bbox, params ) {
	
	var 
		buildOpts = {},
		params = params || {}, 
		origin = params.origin || [ bbox[0], bbox[1], bbox[2], bbox[3] ],  		// an array, [ lon, lat ], describing the poisition of the scene's origin
		units = params.units || 'meter', 						// 'meter', 'foot', 'inch', or 'millimeter'
		scale = params.scale || 1.0,  						// float describing how much to scale the units for the scene
		onDataReady = params.onDataReady || false;				// called when data is loaded from Overpass, before THREE objects are created

	buildOpts.mergeGeometry = params.mergeGeometry || false;  	// create one big Geometry and Mesh with all the buildings
	buildOpts.defaultColor = params.defaultColor || false;		// most buildings will be this color - default is 0xF0F0F0
	buildOpts.meshFunction = params.meshFunction || false;		// custom function for creating the THREE.Mesh objects
  buildOpts.color = params.color || 0xffffff;
  buildOpts.material = params.material;
  buildOpts.name = params.name;
  buildOpts.rotation = params.rotation;

	var 
		builder = new Builder( callback, scale, origin, buildOpts ),
		parser = new Parser( builder.build, onDataReady ),
		loader = new Loader();
	
	loader.load( bbox, parser.parse );

}


// Just gets the building data from the Overpass API and calls the callback, passing in the building data.
function fetchBldgData( callback, bbox, params ) {

	var onDataReady = params.onDataReady || false,
		parser = new Parser( callback, onDataReady ),
		loader = new Loader();

	loader.load( bbox, parser.parse );

}


// Given some building data, creates meshes and calls the callback when it's done
function buildBldgs( callback, buildingData, params ) {

	var buildOpts = {},
		scale = params.scale || 1.0,
		origin = params.origin || findDefaultOrigin( buildingData );
	
	buildOpts.mergeGeometry = params.mergeGeometry || false;
	buildOpts.defaultColor = params.defaultColor || false;
	buildOpts.meshFunction = params.meshFunction || false;
		
	var builder = new Builder( callback, scale, origin, buildOpts );

	builder.build( buildingData );

}


// 
function findDefaultOrigin( bldgs ) {
	console.log( bldgs );
	return [ 0, 0 ];
}


module.exports = {
	makeBuildings: makeBuildings,
	fetchBldgData: fetchBldgData,
	buildBldgs: buildBldgs
}

// Maybe put this in a separte wrapper file, included in a version for use in a non-NPM context
window.OSM3 = {
	makeBuildings: makeBuildings,
	fetchBldgData: fetchBldgData,
	buildBldgs: buildBldgs
}

window.ngeo = ngeo // TEMPORARY!!!!!

// TODO  Go back to making the first argument to makeBuildings a callback instead of a THREE.Scene object.
//		 Accept a THREE.Plane object as an optional argument, and then geohash from its XZ values (instead of lat-lon) to its Y values.
// 	     Export more fine-grained functions/modules within OSMthree that allow control over what happens and when, e.g. with Promises.
//		 	(should these maintain state?  Probably not, they should accept arguments, I think. ) 

},{"./builder.js":2,"./loader.js":4,"./parser.js":6,"ngeohash":1}],6:[function(require,module,exports){

var importer = require('./importer.js' );

function constructor( finalCallback, filterCallback ) {

	var _nodes = {},
		_ways = {},
		_relations = {},
		MAP_DATA = [];


	function isBuilding(data) {
		var tags = data.tags;
		return (tags && !tags.landuse &&
		  (tags.building || tags['building:part']) && (!tags.layer || tags.layer >= 0));
	}


	function getRelationWays(members) {
		var m, outer, inner = [];
		for (var i = 0, il = members.length; i < il; i++) {
		  m = members[i];
		  if (m.type !== 'way' || !_ways[m.ref]) {
		    continue;
		  }
		  if (!m.role || m.role === 'outer') {
		    outer = _ways[m.ref];
		    continue;
		  }
		  if (m.role === 'inner' || m.role === 'enclave') {
		    inner.push(_ways[m.ref]);
		    continue;
		  }
		}

		//  if (outer && outer.tags) {
		if (outer) { // allows tags to be attached to relation - instead of outer way
		  return { outer:outer, inner:inner };
		}
	}


	function getFootprint(points) {
	    if (!points) {
	      return;
	    }

	    var footprint = [], p;
	    for (var i = 0, il = points.length; i < il; i++) {
	      	p = _nodes[ points[i] ];
	      	footprint.push(p[0], p[1]);
	    }

	    // do not close polygon yet
	    if (footprint[footprint.length-2] !== footprint[0] && footprint[footprint.length-1] !== footprint[1]) {
	      	footprint.push(footprint[0], footprint[1]);
	    }

	    // can't span a polygon with just 2 points (+ start & end)
	    if (footprint.length < 8) {
	      	return;
	    }

	    return footprint;
	}



	function mergeItems(dst, src) {
	    for (var p in src) {
	      if (src.hasOwnProperty(p)) {
	        dst[p] = src[p];
	      }
	    }
	    return dst;
	}


	function filterItem(item, footprint) {
	    var res = importer.alignProperties(item.tags);
	    res.tags = item.tags;  // Keeping the raw tags too
	    if (item.id) {
	      res.id = item.id;
	    }

	    if (footprint) {
	      res.footprint = importer.makeWinding(footprint, importer.clockwise);
	    }

	    if (res.shape === 'cone' || res.shape === 'cylinder') {
	      res.radius = importer.getRadius(res.footprint);
	    }

	    return res;
	}


	function processNode(node) {
		_nodes[node.id] = [node.lat, node.lon];
	}


	function processWay(way) {
		if (isBuilding(way)) {
		  	var item, footprint;
		  	if ( footprint = getFootprint(way.nodes) ) {
		    	item = filterItem(way, footprint);
		    	MAP_DATA.push(item);
		  	}
		  	return;
		}

		var tags = way.tags;
		if (!tags || (!tags.highway && !tags.railway && !tags.landuse)) { // TODO: add more filters
		  	_ways[way.id] = way;
		}
	}


	function processRelation(relation) {
		var relationWays, outerWay, holes = [],
		  	item, relItem, outerFootprint, innerFootprint;
		if (!isBuilding(relation) ||
		  	(relation.tags.type !== 'multipolygon' && relation.tags.type !== 'building') ) {
		  	return;
		}

		if ((relationWays = getRelationWays(relation.members))) {
		  	relItem = filterItem(relation);
		  	if ((outerWay = relationWays.outer)) {
		    	if (outerFootprint = getFootprint(outerWay.nodes)) {
			      	item = filterItem(outerWay, outerFootprint);
			      	for (var i = 0, il = relationWays.inner.length; i < il; i++) {
			        	if ((innerFootprint = getFootprint(relationWays.inner[i].nodes))) {
			          		holes.push( importer.makeWinding(innerFootprint, importer.counterClockwise) );
			        	}
			      	}
			      	if (holes.length) {
			        	item.holes = holes;
			      	}
			      	MAP_DATA.push( mergeItems(item, relItem) );
		    	}
		  	}
		}
	}


	this.parse = function( osmData ) {
		var item, buildData;
		for ( var i = 0, len = osmData.elements.length; i < len; i++ ) {
			item = osmData.elements[i];
			switch ( item.type ) {
				case 'node': processNode( item ); break;
				case 'way': processWay( item ); break;
				case 'relation': processRelation( item ); break;
			}
		}
		( filterCallback ) ? buildData = filterCallback.call( this, MAP_DATA )
						   : buildData = MAP_DATA;
		finalCallback.apply( this, [ buildData ] );
	}


}

module.exports = constructor;
},{"./importer.js":3}]},{},[5])