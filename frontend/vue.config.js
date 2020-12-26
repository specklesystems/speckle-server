module.exports = {
  pages: {
    app: {
      entry: 'src/main-frontend.js',
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
