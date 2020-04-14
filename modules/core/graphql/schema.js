'use strict'

const { gql } = require( 'apollo-server' )

const typeDefs = gql `
    type User {
        id: String!
        username: String!
        name: String!
        email: String!
        streams: [Stream]
        tokens: [ApiToken]!
        role: String # Only populated if in the stream's users list
      }

    type ApiToken {
      id: String!
      tokenDigest: String!
      owner: User!
      name: String!
      lastChars: String!
      scopes:[String]!
      revoked: Boolean
      lifespan: Int!
    } 

    type Stream {
        id: String!
        title: String!
        description: String!
        direction: String!
        owner: User!
        users: [User!]!
        references(type: ReferenceType = ALL): [Reference]
        commits(reference: String = "master"): [Object]
    }

    enum ReferenceType {
      BRANCH
      TAG
      ALL
    }

    type Reference {
      id: String!
      name: String!
      description: String!
      type: ReferenceType!
      commitId: String
      commits: [Object]
    }

    scalar JSON

    type Object {
      id: String!
      speckle_type: String!
      applicationId: String!
      data: JSON
      author: User
      parent: Object
    }

    type Query {
        user(id: String!): User
        stream(id: String!): Stream
    }
`

module.exports = typeDefs