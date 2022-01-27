/**
 * Set of functions to triangulate n-gon faces (i.e. polygon faces with an arbitrary (n) number of vertices).
 * This class is a JavaScript port of https://github.com/specklesystems/speckle-sharp/blob/main/Objects/Objects/Utils/MeshTriangulationHelper.cs
 */
export default class MeshTriangulationHelper {

  /**
   * Calculates the triangulation of the face at given faceIndex.
   * @remarks This implementation is based the ear clipping method proposed by "Christer Ericson (2005) <i>Real-Time Collision Detection</i>.
   * @param {Number}   faceIndex      The index of the face's cardinality indicator `n`
   * @param {Number[]}   faces      The list of faces in the mesh
   * @param {Number[]}   vertices   The list of vertices in the mesh
   * @return {Number[]} flat list of triangle faces (without cardinality indicators)
   */
  static triangulateFace( faceIndex, faces, vertices ) {
    let n = faces[faceIndex]
    if ( n < 3 ) n += 3 // 0 -> 3, 1 -> 4

    //Converts from relative to absolute index (returns index in mesh.vertices list)
    function asIndex( v ) {
      return faceIndex + v + 1
    }

    //Gets vertex from a relative vert index
    function V( v )
    {
      let index = faces[ asIndex( v ) ] * 3
      return new Vector3( vertices[index], vertices[index + 1], vertices[index + 2] )
    }

    let triangleFaces = Array( ( n - 2 ) * 3 )

    //Calculate face normal using the Newell Method
    let faceNormal = new Vector3( 0,0, 0 )
    for ( let ii = n - 1, jj = 0;  jj < n;  ii = jj, jj++ )
    {
      let iPos = V( ii )
      let jPos = V( jj )
      faceNormal.x += ( jPos.y - iPos.y ) * ( iPos.z + jPos.z ) // projection on yz
      faceNormal.y += ( jPos.z - iPos.z ) * ( iPos.x + jPos.x ) // projection on xz
      faceNormal.z += ( jPos.x - iPos.x ) * ( iPos.y + jPos.y ) // projection on xy
    }
    faceNormal.normalize()

    //Set up previous and next links to effectively form a double-linked vertex list
    const prev = Array( n )
    const next = Array( n )
    for ( let j = 0; j < n; j++ )
    {
      prev[j] = j - 1
      next[j] = j + 1
    }
    prev[0] = n - 1
    next[n - 1] = 0


    //Start clipping ears until we are left with a triangle
    let i = 0
    let counter = 0
    while ( n >= 3 )
    {
      let isEar = true

      //If we are the last triangle or we have exhausted our vertices, the below statement will be false
      if ( n > 3 && counter < n )
      {
        const prevVertex = V( prev[i] )
        const earVertex = V( i )
        const nextVertex = V( next[i] )

        if ( this.triangleIsCCW( faceNormal, prevVertex, earVertex, nextVertex ) )
        {
          let k = next[next[i]]

          do
          {
            if ( this.testPointTriangle( V( k ), prevVertex, earVertex, nextVertex ) )
            {
              isEar = false
              break
            }

            k = next[k]
          } while ( k !== prev[i] )
        }
        else
        {
          isEar = false
        }
      }

      if ( isEar )
      {
        const a = faces[asIndex( i )]
        const b = faces[asIndex( next[i] )]
        const c = faces[asIndex( prev[i] )]
        triangleFaces.push( a, b, c )

        next[prev[i]] = next[i]
        prev[next[i]] = prev[i]
        n--
        i = prev[i]
        counter = 0
      }
      else
      {
        i = next[i]
        counter++
      }
    }

    return triangleFaces
  }

  /**
   * Tests if point v is within the triangle *abc*.
   * @param {Vector3} v
   * @param {Vector3} a
   * @param {Vector3} b
   * @param {Vector3} c
   * @returns {boolean} true if v is within triangle.
   */
  static testPointTriangle( v, a, b, c )
  {
    function Test( _v, _a, _b )
    {
      let crossA = _v.cross( _a )
      let crossB = _v.cross( _b )
      let dotWithEpsilon = Number.EPSILON + crossA.dot( crossB )
      return Math.sign( dotWithEpsilon ) !== -1
    }

    return Test( b.sub( a ), v.sub( a ), c.sub( a ) )
      && Test( c.sub( b ), v.sub( b ), a.sub( b ) )
      && Test( a.sub( c ), v.sub( c ), b.sub( c ) )
  }

  /**
   * Checks that triangle abc is clockwise with reference to referenceNormal.
   * @param {Vector3} referenceNormal The normal direction of the face.
   * @param {Vector3} a
   * @param {Vector3} b
   * @param {Vector3} c
   * @returns {boolean} true if triangle is ccw
   */
  static triangleIsCCW( referenceNormal, a, b, c )
  {
    let triangleNormal = c.sub( a ).cross( b.sub( a ) )
    triangleNormal.normalize()
    return referenceNormal.dot( triangleNormal ) > 0.0
  }

}

/**
 * Encapsulates vector maths operations required for polygon triangulation
 */
class Vector3 {

  constructor( x, y, z ) {
    this.x = x
    this.y = y
    this.z = z
  }

  add( v ) {
    return new Vector3( this.x + v.x, this.y + v.y, this.z + v.z )
  }

  sub( v ) {
    return new Vector3( this.x - v.x, this.y - v.y, this.z - v.z )
  }

  mul( n ) {
    return new Vector3( this.x - n, this.y - n, this.z - n )
  }

  dot( v ) { return this.x * v.x + this.y * v.y + this.z * v.z }

  cross( v ) {
    const nx = this.y * v.z - this.z * v.y
    const ny = this.z * v.x - this.x * v.z
    const nz = this.x * v.y - this.y * v.x

    return new Vector3( nx,ny,nz )
  }

  squareSum( ) {
    return this.x * this.x + this.y * this.y + this.z * this.z
  }

  normalize() {
    const scale = 1.0 / Math.sqrt( this.squareSum() )
    this.x *= scale
    this.y *= scale
    this.z *= scale
  }


}
