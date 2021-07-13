/* istanbul ignore file */
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )

const appRoot = require( 'app-root-path' )
const { init } = require( `${appRoot}/app` )
const knex = require( `${appRoot}/db/knex` )

const expect = chai.expect
chai.use( chaiHttp )


const { createWebhook, getStreamWebhooks, getLastWebhookEvents, getWebhook, updateWebhook, deleteWebhook, dispatchStreamEvent } = require( '../services/webhooks' )
const { createUser } = require( '../../core/services/users' )
const { createStream, getStream } = require( '../../core/services/streams' )

describe( 'Webhooks', ( ) => {
  let userOne = {
    name: 'User',
    email: 'user@gmail.com',
    password: 'jdsadjsadasfdsa'
  }

  let streamOne = {
    name: 'stream',
    description: 'stream',
    isPublic: true
  }

  let webhookOne = {
    streamId: null, // filled in `before`
    url: 'http://localhost:42/non-existent',
    description: 'test wh',
    secret: 'secret',
    enabled: true,
    events: [ 'commit_create', 'commit_update' ]
  }

  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )
    await init()

    userOne.id = await createUser( userOne )
    streamOne.ownerId = userOne.id
    streamOne.id = await createStream( streamOne )
    webhookOne.streamId = streamOne.id
  } )

  after( async ( ) => {
    // await knex.migrate.rollback( )
  } )

  describe( 'Create, Read, Update, Delete Webhooks', ( ) => {
    it( 'Should create a webhook', async ( ) => {
      webhookOne.id = await createWebhook( webhookOne )
      expect( webhookOne ).to.have.property( 'id' )
      expect( webhookOne.id ).to.not.be.null
    } )

    it( 'Should get a webhook', async ( ) => {
      let webhook = await getWebhook( { id: webhookOne.id } )
      expect( webhook ).to.not.be.null
      expect( webhook ).to.have.property( 'url' )
      expect( webhook.url ).to.equal( webhookOne.url )
    } )

    it( 'Should update a webhook', async ( ) => {
      let newUrl = 'http://localhost:42/new-url'
      await updateWebhook( { id: webhookOne.id, url: newUrl } )
      let webhook = await getWebhook( { id: webhookOne.id } )
      expect( webhook ).to.not.be.null
      expect( webhook ).to.have.property( 'url' )
      expect( webhook.url ).to.equal( newUrl )
    } )

    it( 'Should delete a webhook', async ( ) => {
      await deleteWebhook( { id: webhookOne.id } )
      let webhook = await getWebhook( { id: webhookOne.id } )
      expect( webhook ).to.be.undefined
    } )

    it( 'Should get webooks for stream', async ( ) => {
      let streamWebhooks = await getStreamWebhooks( { streamId: streamOne.id } )
      expect( streamWebhooks ).to.have.lengthOf( 0 )
      
      webhookOne.id = await createWebhook( webhookOne )
      streamWebhooks = await getStreamWebhooks( { streamId: streamOne.id } )
      expect( streamWebhooks ).to.have.lengthOf( 1 )
      expect( streamWebhooks[0] ).to.have.property( 'url' )
      expect( streamWebhooks[0].url ).to.equal( webhookOne.url )
    } )

    it( 'Should dispatch and get events', async () => {      
      await dispatchStreamEvent( { streamId: streamOne.id, event: 'commit_create', eventPayload: 'payload123' } )
      let lastEvents = await getLastWebhookEvents( { webhookId: webhookOne.id } )
      expect( lastEvents ).to.have.lengthOf( 1 )
      expect( lastEvents[0].payload ).to.equal( 'payload123' )
    } )

    it( 'Should have a webhook limit for streams', async ( ) => {
      let limit = 100
      for ( let i = 0; i < limit - 1; i++ ) {
        await createWebhook( webhookOne )
      }
      try {
        await createWebhook( webhookOne )
      } catch ( err ) {
        if ( err.toString().indexOf( 'Maximum' ) > -1 ) return
      }
      assert.fail( 'Configured more webhooks than the limit' )
    } )

    it( 'Should cleanup stream webhooks', async ( ) => {
      // just cleanup the 99 extra webhooks added before (not a real test)
      let streamWebhooks = await getStreamWebhooks( { streamId: streamOne.id } )
      for ( let webhook of streamWebhooks ) {
        if ( webhook.id != webhookOne.id ) {
          await deleteWebhook( { id: webhook.id } )
        }
      }
      streamWebhooks = await getStreamWebhooks( { streamId: streamOne.id } )
      expect( streamWebhooks ).to.have.lengthOf( 1 )
      expect( streamWebhooks[0] ).to.have.property( 'id' )
      expect( streamWebhooks[0].id ).to.equal( webhookOne.id )
    } )
  } )
} )
