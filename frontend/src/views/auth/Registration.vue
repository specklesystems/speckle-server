<template>
  <v-form ref='form'>
    <v-container fluid>
      <v-row style='margin-top:-10px;' dense>
        <v-col cols=12>
          <v-text-field label='your email' v-model='form.email' :rules='validation.emailRules' solo></v-text-field>
        </v-col>
        <v-col xs='6' sm='6'>
          <v-text-field label='first name' v-model='form.firstName' :rules='validation.nameRules' solo style='margin-top:-12px;'></v-text-field>
        </v-col>
        <v-col xs='6' sm='6'>
          <v-text-field label='last name' v-model='form.lastName' :rules='validation.nameRules' solo style='margin-top:-12px;'></v-text-field>
        </v-col>
        <v-col cols='12' sm='12'>
          <v-text-field label='company/team' v-model='form.company' :rules='validation.companyRules' solo style='margin-top:-12px;'></v-text-field>
        </v-col>
        <v-col cols='12' sm='6'>
          <v-text-field label='password' type='password' v-model='form.password' :rules='validation.passwordRules' @keydown='debouncedPwdTest' solo style='margin-top:-12px;'></v-text-field>
        </v-col>
        <v-col cols='12' sm='6'>
          <v-text-field label='confirm password' type='password' v-model='form.passwordConf' :rules='validation.passwordRules' solo style='margin-top:-12px;'></v-text-field>
        </v-col>
        <v-col cols='12' class='py-2 px-2' style='margin-top:-18px;'>
          <v-row no-gutters align='center'>
            <!-- <v-col cols='3' class='caption flex-shrink-1 flex-grow-0'>Strength:</v-col> -->
            <v-col cols='12' class='flex-grow-1 flex-shrink-0' style="min-width: 100px; max-width: 100%;">
              <v-progress-linear v-show='true' class='mt-1 mb-0' v-model="passwordStrength" :color="`${passwordStrength >= 75 ? 'green' : passwordStrength >= 50 ? 'orange' : 'red' }`">
              </v-progress-linear>
            </v-col>
            <v-col cols='12' class='caption text-center'>
              {{this.pwdSuggestions ? this.pwdSuggestions : this.form.password ? 'Looks good.' : 'Choose a good password!' }}
              <span v-if='this.form.password !== this.form.passwordConf'><b>Passwords do not match.</b></span>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols=12>
          <v-btn block large color='accent' style='margin-top:-0px;' @click='registerUser'>Sign Up</v-btn>
          <p class='text-center'>
            <v-btn text small block color='accent' :to='{ name: "Login", query: { appId: $route.query.appId } }' class='mt-5'>Login</v-btn>
          </p>
        </v-col>
      </v-row>
      <v-snackbar v-model="registrationError" multi-line>
        {{ errorMessage }}
        <v-btn color="red" text @click="registrationError = false">
          Close
        </v-btn>
      </v-snackbar>
    </v-container>
  </v-form>
</template>
<script>
import gql from 'graphql-tag'
import { onLogin } from '../../vue-apollo'
import debounce from 'lodash.debounce'

export default {
  name: 'Registration',
  methods: {
    debouncedPwdTest: debounce( async function ( ) {
      let result = await this.$apollo.query( { query: gql ` query{ userPwdStrength(pwd:"${this.form.password}")}` } )
      this.passwordStrength = result.data.userPwdStrength.score * 25
      this.pwdSuggestions = result.data.userPwdStrength.feedback.suggestions[ 0 ]
    }, 1000 ),
    async registerUser( ) {
      try {
        let valid = this.$refs.form.validate( )
        if ( !valid ) throw new Error( 'Form validation failed' )
        if ( this.form.password !== this.form.passwordConf ) throw new Error( 'Passwords do not match' )
        if ( this.passwordStrength < 3 ) throw new Error( 'Password too weak' )

        let result = await this.$apollo.mutate( {
          mutation: gql `mutation ($user: UserCreateInput!) { userCreate( user: $user ) }`,
          variables: {
            user: { name: `${this.form.firstName} ${this.form.lastName}`, username: `${this.form.firstName}${this.form.lastName}`, email: this.form.email, password: this.form.password }
          }
        } )

        console.log( result.data.userCreate )

        onLogin( this.$apolloProvider.clients.defaultClient, result.data.userCreate )

      } catch ( err ) {
        this.errorMessage = err.message
        this.registrationError = true
      }
    }
  },
  data: ( ) => ( {
    form: {
      email: null,
      firstName: null,
      lastName: null,
      company: null,
      password: null,
      passwordConf: null
    },
    registrationError: false,
    errorMessage: '',
    validation: {
      companyRules: [ v => !!v || 'Required' ],
      passwordRules: [ v => !!v || 'Required' ],
      nameRules: [
        v => !!v || 'Required',
        v => ( v && v.length <= 10 ) || 'Name must be less than 10 characters',
      ],
      emailRules: [
        v => !!v || 'E-mail is required',
        v => /.+@.+\..+/.test( v ) || 'E-mail must be valid',
      ],
    },
    passwordStrength: 1,
    pwdSuggestions: null
  } )

}
</script>