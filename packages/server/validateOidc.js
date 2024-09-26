const { Issuer } = require('openid-client')

;(async () => {
  const issuer = await Issuer.discover(
    'http://127.0.0.1:8090/realms/speckle/.well-known/openid-configuration'
  )
  /*
  to validate from issuer:
  authorization_signing_alg_values_supported
  claims_supported: ['email', 'name', 'given_name', 'family_name']
  grant_types_supported: ['authorization_code']
  response_types_supported: //TODO figure out which

  */
  console.log(issuer)
  const client = new issuer.Client({
    client_id: 'speckle',
    client_secret: 'OZ6zj7H1G7jQw6qUDif1aoQVxTOGPkJK1',
    redirect_uris: ['http://localghost:3000/cb'],
    response_types: ['code']
    // id_token_signed_response_alg (default "RS256")
    // token_endpoint_auth_method (default "client_secret_basic")
  })
  client.authorizationUrl({request_uri: })
  console.log(await client)

  /*
  validate from client:
  grant_types: ['authorization_code'],
  */
})()
