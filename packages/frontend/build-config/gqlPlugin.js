const TARGET = 'es2019'

/**
 * GQL file support (previously this was managed by the vue apollo cli plugin)
 * @param {import('@vue/cli-service/lib/PluginAPI')} api
 **/
function plugin(api) {
  api.chainWebpack((config) => {
    const gqlRule = config.module.rule('gql').test(/\.(gql|graphql)$/)

    // add caching
    gqlRule
      .use('cache-loader')
      .loader('cache-loader')
      .options(
        api.genCacheConfig('gql-cache-loader', {
          target: TARGET,
          graphqltagVersion: require('graphql-tag/package.json').version
        })
      )

    // add gql loader
    gqlRule.use('gql-loader').loader('graphql-tag/loader')
  })
}

module.exports = plugin
