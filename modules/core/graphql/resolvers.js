const resolvers = {
  Query: {
    user( parent, args, context, info ) {
      // console.log( parent )
      // console.log( context )
      console.log( context.token )
      console.log( context.anonymousRequest )
      // console.log( args )
      return { username: 'dimitrie', email: 'test@spam.co' }
    }
  }
}

module.exports = resolvers