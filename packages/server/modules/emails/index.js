/* istanbul ignore file */
'use strict'
let debug = require( 'debug' )
const appRoot = require( 'app-root-path' )

const nodemailer = require( 'nodemailer' )
let account, transporter

exports.init = async ( app, options ) => {
  debug( 'speckle:modules' )( '📧 Init emails module' )

  if ( process.env.NODE_ENV === 'test' ) {
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

    return
  }

  if ( process.env.EMAIL === 'true' ) {
    try {
      transporter = nodemailer.createTransport( {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      } )
    } catch ( e ) {
      debug( 'speckle:modules' )( '📧 Failed to initialise email provider.' )
    }
  } else {
    debug( 'speckle:modules' )( '📧 Failed to initialise email provider. Server functionality will be limited.' )
  }

}

exports.finalize = async () => {
  // Nothing to do here.
}

exports.transporter = transporter

exports.sendEmail = async( { from, to, subject, text, html } ) => {
  if ( !transporter ) {
    debug( 'speckle:errors' )( 'No email transport present. Cannot send emails.' )
    return false
  }

  try {
    let email_from = process.env.EMAIL_FROM || 'no-reply@speckle.systems'
    let info = await transporter.sendMail( {
      from: from || `"Speckle" <${email_from}>`,
      to,
      subject,
      text,
      html
    } )
    if ( process.env.NODE_ENV === 'test' ) {
      debug( 'speckle:test' )( nodemailer.getTestMessageUrl( info ) )
    }
  } catch ( e ) {
    debug( 'speckle:errors' )( e )
  }
}
