'use strict'
const appRoot = require( 'app-root-path' )
const crs = require( 'crypto-random-string' )
const knex = require( `${appRoot}/db/knex` )

const { getUserByEmail, updateUserPassword } = require( `${appRoot}/modules/core/services/users` )
const { getServerInfo } = require( `${appRoot}/modules/core/services/generic` )
const { sendEmail } = require( `${appRoot}/modules/emails` )

const ResetTokens = ( ) => knex( 'pwdreset_tokens' )

module.exports = ( app ) => {

  // sends a password recovery email.
  app.post( '/auth/pwdreset/request', async( req, res, next ) => {

    try {
      if ( !req.body.email ) throw new Error( 'Invalid request' )

      let user = await getUserByEmail( { email: req.body.email } )
      if ( !user ) throw new Error( 'No user with that email found.' )

      // check if pwd request has been already sent
      let existingToken = await ResetTokens().select( '*' ).where( { email: req.body.email } ).first()
      if ( existingToken ) {
        const timeDiff = Math.abs( Date.now( ) - new Date( existingToken.createdAt ) )
        if ( timeDiff / 36e5 < 1 ) throw new Error( 'Password reset already requested. Please try again in 1h, or check your email for the instructions we have sent.' )
      }

      // delete any previous pwd requests
      await ResetTokens().where( { email: req.body.email } ).del()

      // create a new token
      let token = {
        id: crs( { length: 10 } ),
        email: req.body.email
      }

      await ResetTokens().insert( token )

      let serverInfo = await getServerInfo()

      // send the reset link email

      let resetLink = new URL( `/authn/resetpassword/finalize?t=${token.id}`, process.env.CANONICAL_URL )
      let emailText = `
Hi ${user.name},

You've requested a password reset for your Speckle account at ${process.env.CANONICAL_URL}. If this wasn't you, ignore this email; otherwise, follow the link below to reset your password:

${resetLink}

The link above is valid for one hour only. If you continue to have problems, please get in touch!

Warm regards,
Speckle
      `

      let emailHtml = `
Hi ${user.name},
<br>
<br>
You've requested a password reset for your Speckle account. If this wasn't you, you can safely ignore this email. Otherwise, click <b><a href="${resetLink}" rel="notrack">here to reset your password</a></b>.
The link is <b>valid for one hour</b> only.
<br>
<br>
If you continue to have problems, please get in touch!
<br>
<br>
Warm regards,
<br>
Speckle
<br>
<br>
<img src="https://speckle.systems/content/images/2021/02/logo_big-1.png" style="width:30px; height:30px;">
<br>
<br>
<caption style="size:8px; color:#7F7F7F; width:400px; text-align: left;">
This email was sent from ${serverInfo.name} at ${process.env.CANONICAL_URL}, deployed and managed by ${serverInfo.company}. Your admin contact is ${serverInfo.adminContact ? serverInfo.adminContact : '[not provided]'}.
</caption>
`

      await sendEmail( { to: user.email, subject:'Speckle Account Password Reset', text: emailText, html: emailHtml } )
      return res.status( 200 ).send( 'Password reset email sent.' )

    } catch ( e ) {

      res.status( 400 ).send( e.message )

    }

  } )

  // Finalizes password recovery.
  app.post( '/auth/pwdreset/finalize', async( req, res, next ) => {
    try {

      if ( !req.body.tokenId || !req.body.password ) throw new Error( 'Invalid request.' )

      let token = await ResetTokens().where( { id: req.body.tokenId } ).select( '*' ).first()
      if ( !token ) throw new Error( 'Invalid request.' )

      const timeDiff = Math.abs( Date.now( ) - new Date( token.createdAt ) )
      if ( timeDiff / 36e5 > 1 ) {

        throw new Error( 'Link expired.' )
      }

      let user = await getUserByEmail( { email: token.email } )

      await updateUserPassword( { id: user.id, newPassword: req.body.password } )

      await ResetTokens().where( { id: req.body.tokenId } ).del()

      return res.status( 200 ).send( 'Password reset. Please log in.' )

    } catch ( e ) {

      res.status( 400 ).send( e.message )

    }
  } )

}
