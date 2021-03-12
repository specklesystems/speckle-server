const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  pages: {
    app: {
      entry: 'src/app.js',
      title: 'Speckle',
      template: 'public/app.html',
      filename: 'app.html'
    }
  },
  devServer: {
    historyApiFallback: {
      rewrites: [
        { from: /^\/$/, to: '/app.html' },
        { from: /./, to: '/app.html' }
      ]
    }
  },
  transpileDependencies: ['vuetify'],
  configureWebpack: {
    optimization: {
      minimize: process.env.NODE_ENV === 'production',
      minimizer: [
        new TerserPlugin({
          exclude: /(Speckle.js\.). /
        })
      ]
    }
  }
}
