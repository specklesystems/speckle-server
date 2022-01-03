/* global __dirname, require, module*/
const HtmlWebpackPlugin = require( 'html-webpack-plugin' )
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' )
const path = require( 'path' )
const yargs = require( 'yargs' )
const env = yargs.argv.env

let filename = 'demo'

let outputFile, mode

if ( env === 'build' ) {
  mode = 'production'
  outputFile = filename + '.min.js'
} else {
  mode = 'development'
  outputFile = filename + '.js'
}

const config = {
  mode: mode,
  entry: path.resolve( __dirname + '/src/app.js' ),
  target: 'web',
  devtool: 'source-map',
  output: {
    path: path.resolve( __dirname + '/example' ) ,
    filename: outputFile,
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js|\.ts|\.tsx)$/,
        use: {
          loader: 'babel-loader',
        },
        exclude: /(node_modules|bower_components)/,
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin( { cleanStaleWebpackAssets: false } ),
    new HtmlWebpackPlugin( { title: 'Speckle Viewer Example', template: 'src/assets/example.html', filename: 'example.html' } )
  ],
  resolve: {
    modules: [ path.resolve( './node_modules' ), path.resolve( './src' ) ],
    extensions: [ '.json', '.js' ],
  },
  devServer: {
    static: path.join( __dirname, 'example' ),
    compress: false,
    port: 9000,
    devMiddleware: {
      writeToDisk: true
    }
  }
}

module.exports = config
