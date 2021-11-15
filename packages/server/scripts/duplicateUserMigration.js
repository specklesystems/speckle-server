const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )

const Users = ( ) => knex( 'users' )
const Acl = ( ) => knex( 'server_acl' )

// tableName, columnName that need migration
const migrationTargets = [
  [ 'api_tokens' , 'owner' ],
  [ 'authorization_codes' , 'userId' ],
  [ 'branches' , 'authorId' ],
  [ 'commits' , 'author' ],
  [ 'file_uploads' , 'userId' ],
  [ 'personal_api_tokens' , 'userId' ],
  [ 'refresh_tokens' , 'userId' ],
  [ 'server_acl' , 'userId' ], //userId is a PrimaryKey in this table, act accordingly
  [ 'server_apps' , 'authorId' ],
  [ 'server_invites' , 'inviterId' ],
  [ 'stream_acl' , 'userId' ],//userId, with resourceId is a PrimaryKey in this table, act accordingly
  [ 'stream_activity' , 'userId' ],
]

const migrateColumnValue = async( tableName, columnName, oldUser, newUser ) => {
  try {
    const query = knex( tableName ).where( { [columnName]: oldUser.id } ).update( { [columnName]: newUser.id } ) 
    console.log( `${query}` )
    await query
  } catch ( err ) {
    console.log( err )
  }
}

const createMigrations = ( { lowerUser, upperUser } ) => migrationTargets.map( ( [ tableName, columnName ] ) => {
  migrateColumnValue( tableName, columnName, upperUser,lowerUser ) } ) 


const userByEmailQuery = email => Users( ).where( { email } )
const createUser = async user => {
  user.id = crs( { length: 10 } )

  if ( user.password ) {
    user.passwordDigest = await bcrypt.hash( user.password, 10 )
  }
  delete user.password

  let usr = await userByEmailQuery( user.email ).select( 'id' ).first( )
  if ( usr ) throw new Error( 'Email taken. Try logging in?' )

  let res = await Users( ).returning( 'id' ).insert( user )
    
  let userRole = 'server:user' 

  await Acl( ).insert( { userId: res[ 0 ], role: userRole } )

  return res[ 0 ]
}

const createData = async ( ) => {
  const users = [
    { email: 'asdf@asdf.asdf', password: '12345678', name: 'Asdf Asdf' } ,
    { email: 'AsDf@asdf.asdf', password: '12345678', name: 'Asdf Asdf' } ,
    { email: 'fdsa@asdf.asdf', password: '12345678', name: 'Asdf Asdf' } ,
    { email: 'Fdsa@asdf.asdf', password: '12345678', name: 'Asdf Asdf' } 
  ]
  users.map( async user => {
    try {
      await createUser( user )
    } catch ( err ) {
      console.log( err )
    }  
  } )
}

const getDuplicateUsers = async ( ) => {
  let duplicates = await knex.raw( 'select lower(email) as lowered, count(id) as reg_count from users group by lowered having count(id) > 1' )
  return await Promise.all( duplicates.rows.map( async dup => {
    let lowerEmail = dup.lowered

    let lowerUser = await userByEmailQuery( lowerEmail ).first( )
    let upperUser = await Users( ).whereRaw( 'lower(email) = lower(?)',[ lowerEmail ] ).whereNot( { id: lowerUser.id } ).first( )
    return { lowerUser,upperUser }
  } ) )
}

const runMigrations = async ( ) => {
  const duplicateUsers = await getDuplicateUsers( )
  await Promise.all( duplicateUsers.map( async userDouble => {
    const migrations = createMigrations( userDouble )
    await Promise.all( migrations.map( async migrationStep => await migrationStep ) )
  } ) )
}

( async function () {
  try {
    await createData()
    await runMigrations()
  } catch ( err ) {
    console.log( err )
  } finally { process.exit() } 
}() )
