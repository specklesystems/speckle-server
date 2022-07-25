/* eslint-env node */
const webpack = require('webpack')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')
const { DuplicateReporterPlugin } = require('duplicate-dependencies-webpack-plugin')

const isProdBuild = process.env.NODE_ENV === 'production'
const shouldEnableProfiling = (process.argv || []).includes('--profile')

/** @type {import('@vue/cli-service').ProjectOptions} */
const config = {
  chainWebpack: (config) => {
    // Adding profiling plugins, if flag set
    if (shouldEnableProfiling) {
      config.plugin('webpack-profiling').use(webpack.debug.ProfilingPlugin)
      config.plugin('speed-measure').use(SpeedMeasurePlugin)
      config.plugin('bundle-analyzer').use(BundleAnalyzerPlugin)
    }

    config.plugin('duplicate-detection').use(DuplicateReporterPlugin)
    config.plugin('lodash-optimization').use(LodashModuleReplacementPlugin)

    // Add plugin for injecting env vars
    config
      .plugin('speckle-env-vars')
      .use(webpack.EnvironmentPlugin, [{ SPECKLE_SERVER_VERSION: 'unknown' }])

    // Setting source map according to build env
    config.devtool(isProdBuild ? false : 'eval-source-map')
  },
  productionSourceMap: false,
  pages: {
    app: {
      entry: 'src/main/app.js',
      title: 'Speckle',
      template: 'public/app.html',
      filename: 'app.html'
    },
    embedApp: {
      entry: 'src/embed/embedApp.js',
      title: 'Speckle Embed Viewer',
      template: 'public/embedApp.html',
      filename: 'embedApp.html'
    }
  },
  devServer: {
    host: 'localhost',
    proxy: 'http://localhost:3000',
    historyApiFallback: {
      rewrites: [
        { from: /^\/$/, to: '/app.html' },
        { from: /\/embed(.*)/, to: '/embedApp.html' },
        { from: /./, to: '/app.html' }
      ]
    }
    // progress: false // Disables progress bar in dev server build
  }
}

module.exports = config
