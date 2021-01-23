/* global __dirname */
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' )
const path = require( 'path' )
const yargs = require( 'yargs' )
const env = yargs.argv.env

let libraryName = 'Speckle'

let outputFile, mode

if ( env === 'build' ) {
  mode = 'production'
  outputFile = libraryName + '.js'
} else {
  mode = 'development'
  outputFile = libraryName + '.js'
}

const config = {
  mode: mode,
  entry: path.resolve( __dirname + '/src/index.js' ),
  target: 'web',
  devtool: 'source-map',
  output: {
    path: path.resolve( __dirname + '/dist' ) ,
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    globalObject: 'this',
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
  ],
  resolve: {
    modules: [ path.resolve( './node_modules' ), path.resolve( './src' ) ],
    extensions: [ '.json', '.js' ],
  }
}

module.exports = config
