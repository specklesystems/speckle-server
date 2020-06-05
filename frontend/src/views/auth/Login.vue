<template>
  <v-container fluid>
    <v-form ref='form'>
      <v-row style='margin-top:-10px;' dense>
        <v-col cols=12>
          <v-text-field label='your email' v-model='form.email' :rules='validation.emailRules' solo></v-text-field>
        </v-col>
        <v-col cols=12>
          <v-text-field label='password' type='password' v-model='form.password' :rules='validation.passwordRules' solo style='margin-top:-12px;'></v-text-field>
          <v-btn block large color='accent' style='top:-22px;' @click='loginUser'>Log in</v-btn>
          <p class='text-center'>
            <v-btn text small block color='accent' :to='{ name: "Register", query: { appId: $route.query.appId } }' @click='state="register"'>Create Account</v-btn>
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
export default {
  name: 'Login',
  apollo: {
  },
  methods: {
    async loginUser( ) {
      try {
        let valid = this.$refs.form.validate( )
        if ( !valid ) throw new Error( 'Form validation failed' )
        
        let result = await this.$apollo.mutate( {
          mutation: gql ` mutation { userLogin( email:"${this.form.email}", password: "${this.form.password}" ) }`,
        } )
        
        let token = result.data.userLogin
        onLogin( this.$apolloProvider.clients.defaultClient, token )
        
        this.$emit( 'loggedin' )
      } catch ( err ) {
        this.errorMessage = err.message
        this.registrationError = true
      }
    }
  },
  data: ( ) => ( {
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
    this.appId = urlParams.get( 'appId' ) || 'spklwebapp'
  }
}
</script>