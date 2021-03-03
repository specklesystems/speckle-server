'use strict'
let debug = require( 'debug' )
const appRoot = require( 'app-root-path' )

const nodemailer = require( 'nodemailer' )
let account, transporter

exports.init = async ( app, options ) => {
  debug( 'speckle:modules' )( '📧 Init emails module' )

  // TODO: check env variables and init transporter with those
  account = await nodemailer.createTestAccount()
  transporter = nodemailer.createTransport( {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: account.user,
      pass: account.pass
    }
  } )
}

exports.finalize = async () => {

}

exports.account = account
exports.transporter = transporter

exports.sendEmail = async( { from, to, subject, text, html } ) => {
  if ( !transporter ) {
    debug( 'speckle:errors' )( 'No email transport present. Aborting.' )
    return false
  }

  let info = await transporter.sendMail( {
    from: from || 'hello@speckle.systems',
    to,
    subject,
    text,
    html
  } )

  console.log( nodemailer.getTestMessageUrl( info ) )
}
