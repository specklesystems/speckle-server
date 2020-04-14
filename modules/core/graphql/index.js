'use strict'

const { ApolloServer } = require( 'apollo-server-express' )

const typeDefs = require( './schema' )
const resolvers = require( './resolvers' )

const server = new ApolloServer( {
  typeDefs,
  resolvers,
  context: ( { req } ) => ( {
    token: req.headers.authorization,
    anonymousRequest: !req.headers.authorization
  } )
} )

module.exports = ( app ) => {
  server.applyMiddleware( { app, path: '/graphql' } )
}