/**
 * Dev builds use esbuild instead of babel for improved speed
 * @param {import('@vue/cli-service/lib/PluginAPI')} api
 **/
function plugin(api) {
  const isProdBuild = process.env.NODE_ENV === 'production'
  const isDevBuild = !isProdBuild

  if (!isDevBuild) return

  api.chainWebpack((config) => {
    const target = 'es2019'
    const jsRule = config.module.rule('js').test(/\.m?jsx?$/)

    // Delete babel related loaders
    jsRule.uses.delete('thread-loader').delete('babel-loader')

    // Add caching config
    jsRule
      .use('cache-loader')
      .loader('cache-loader')
      .options(
        api.genCacheConfig('js-esbuild-loader', {
          target,
          esbuildLoaderVersion: require('esbuild-loader/package.json').version
        })
      )

    // Add new esbuild loader
    jsRule.use('esbuild-loader').loader('esbuild-loader').options({
      target
    })
  })
}

module.exports = plugin
