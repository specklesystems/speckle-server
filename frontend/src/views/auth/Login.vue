<template>
  <v-container fluid v-if='hasLocalStrategy'>
    <v-form ref='form'>
      <v-row style='margin-top:-10px;' dense>
        <v-col cols=12>
          <v-text-field label='your email' v-model='form.email' :rules='validation.emailRules' solo></v-text-field>
        </v-col>
        <v-col cols=12>
          <v-text-field label='password' type='password' v-model='form.password' :rules='validation.passwordRules' solo style='margin-top:-12px;'></v-text-field>
          <v-btn block large color='accent' style='top:-22px;' @click='loginUser'>Log in</v-btn>
          <p class='text-center'>
            <v-btn text small block color='accent' :to='{ name: "Register", query: { appId: $route.query.appId } }'>Create Account</v-btn>
          </p>
        </v-col>
      </v-row>
    </v-form>
    <v-snackbar v-model="registrationError" multi-line>
      {{ errorMessage }}
      <v-btn color="red" text @click="registrationError = false">
        Close
      </v-btn>
    </v-snackbar>
  </v-container>
</template>
<script>
import gql from 'graphql-tag'
import { onLogin } from '../../vue-apollo'
import debounce from 'lodash.debounce'
import crs from 'crypto-random-string'

export default {
  name: 'Login',
  apollo: {
    serverInfo: {
      query: gql ` query { serverInfo { name company adminContact termsOfService scopes { name description } authStrategies { id name color icon url } } }  `,
    },
  },
  computed: {
    hasLocalStrategy( ) {
      return this.serverInfo.authStrategies.findIndex( s => s.id === 'local' ) !== -1
    }
  },
  methods: {
    async loginUser( ) {
      try {
        let valid = this.$refs.form.validate( )
        if ( !valid ) throw new Error( 'Form validation failed' )
        let res = await fetch( `/auth/local/login?appId=${this.appId}&challenge=${this.challenge}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          redirect: 'follow', // obvs not working
          body: JSON.stringify( {
            email: this.form.email,
            password: this.form.password
          } )
        } )
        console.log( res )
        if ( res.redirected ) {
          window.location = res.url
        }

        if ( !res.ok ) {
          throw new Error( 'Login failed' )
        }

      } catch ( err ) {
        this.errorMessage = err.message
        this.registrationError = true
      }
    }
  },
  data: ( ) => ( {
    serverInfo: { authStrategies: [ ] },
    form: { email: null, password: null },
    validation: {
      passwordRules: [ v => !!v || 'Required' ],
      emailRules: [
        v => !!v || 'E-mail is required',
        v => /.+@.+\..+/.test( v ) || 'E-mail must be valid',
      ],
    },
    registrationError: false,
    errorMessage: '',
    appId: null,
    serverApp: null
  } ),
  mounted( ) {
    let urlParams = new URLSearchParams( window.location.search )
    let appId = urlParams.get( 'appId' )
    let challenge = urlParams.get( 'challenge' )

    if ( !appId )
      this.appId = 'spklwebapp'
    else
      this.appId = appId

    if ( !challenge && this.appId === 'spklwebapp' ) {
      this.challenge = crs( { length: 10 } )
      localStorage.setItem( 'appChallenge', this.challenge )
    } else if ( challenge ) {
      this.challenge = challenge
    }
  }
}
</script>