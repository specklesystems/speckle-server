module.exports = {
  productionSourceMap: false,
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
  transpileDependencies: ['vuetify']
}
