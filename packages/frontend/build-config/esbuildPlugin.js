const TARGET = 'es2019'

function prepareJs(jsRule, api) {
  // Delete babel related loaders
  jsRule.uses.delete('thread-loader').delete('babel-loader')

  // Add caching config
  jsRule
    .use('cache-loader')
    .loader('cache-loader')
    .options(
      api.genCacheConfig('js-esbuild-loader', {
        target: TARGET,
        esbuildLoaderVersion: require('esbuild-loader/package.json').version
      })
    )

  // Add new esbuild loader
  jsRule.use('esbuild-loader').loader('esbuild-loader').options({
    target: TARGET
  })
}

function prepareTs(tsRule, api) {
  // Delete related loaders
  tsRule.uses.delete('ts-loader').delete('babel-loader')

  // Add caching config
  tsRule
    .use('cache-loader')
    .loader('cache-loader')
    .options(
      api.genCacheConfig('ts-esbuild-loader', {
        target: TARGET,
        esbuildLoaderVersion: require('esbuild-loader/package.json').version
      })
    )

  // Add new esbuild loader
  tsRule.use('esbuild-loader').loader('esbuild-loader').options({
    target: TARGET,
    loader: 'tsx'
  })
}

/**
 * Dev builds use esbuild instead of babel for improved speed
 * @param {import('@vue/cli-service/lib/PluginAPI')} api
 **/
function plugin(api) {
  const isProdBuild = process.env.NODE_ENV === 'production'
  const isDevBuild = !isProdBuild

  if (!isDevBuild) return

  api.chainWebpack((config) => {
    const jsRule = config.module.rule('js').test(/\.m?jsx?$/)
    prepareJs(jsRule, api)

    const tsRule = config.module.rule('ts').test(/\.ts$/)
    prepareTs(tsRule, api)

    // No TSX support currently, we can look into it if needed
    config.module.rules.delete('tsx')
  })
}

module.exports = plugin
