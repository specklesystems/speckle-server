<template>
  <v-card>
    <v-card-title class='display-1 text--primary'>
      Register
    </v-card-title>
    <v-card-text>{{serverInfo}}</v-card-text>
    <v-card-text>
      <v-form ref="form" v-model="valid" v-if='!success'>
        <v-divider class='my-2'></v-divider>
        <v-text-field label='First Name' v-model="firstName" required :rules="nameRules"></v-text-field>
        <v-text-field label='Last Name' v-model="lastName" required :rules="nameRules"></v-text-field>
        <v-text-field label='Email' v-model="email" required type='email' :rules="emailRules"></v-text-field>
        <v-text-field label='Password' v-model="password" required type='password' :rules="passwordRules" @keydown='debouncedPwdTest' :type="showPassword ? 'text' : 'password'" :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" @click:append="showPassword = !showPassword"></v-text-field>
        <!-- <v-text-field label='Confirm Password' v-model="confirmPassword" required type='password' :rules="passwordRules"></v-text-field> -->
        <v-progress-linear v-if='passwordStrength!==10 && passwordStrength <= 100' class='mt-1 mb-0' v-model="passwordStrength" :color="`${passwordStrength >= 75 ? 'green' : passwordStrength >= 50 ? 'orange' : 'red' }`"></v-progress-linear>
        <p class='caption'>{{pwdSuggestions}}</p>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-btn block tile large color='primary' :loading='loading' @click="submit">Submit</v-btn>
    </v-card-actions>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'
import { onLogin } from '../vue-apollo'
import debounce from 'lodash.debounce'

export default {
  apollo: {
    serverInfo: gql ` query { serverInfo { name company termsOfService } }`,
  },
  methods: {
    debouncedPwdTest: debounce( async function ( ) {
      let result = await this.$apollo.query( { query: gql ` query{ userPwdStrength(pwd:"${this.password}")}` } )
      this.passwordStrength = result.data.userPwdStrength.score * 25
      // console.log( result.data.userPwdStrength )
      this.pwdSuggestions = result.data.userPwdStrength.feedback.suggestions[ 0 ]
    }, 1000 ),
    async submit( ) {
      let test = this.$refs.form.validate( )
      if ( !test ) return

      // this.loading = true
      // try {
      //   let result = await this.$apollo.mutate( {
      //     mutation: gql `
      //     mutation ($user: UserCreateInput!) { userCreateAdmin( user: $user ) }
      //   `,
      //     variables: {
      //       user: { name: `${this.firstName} ${this.lastName}`, username: `${this.firstName}${this.lastName}`, email: this.email, password: this.password }
      //     }
      //   } )
      //   this.loading = false
      //   onLogin( this.$apolloProvider.clients.defaultClient, `${result.data.userCreateAdmin}` )
      //   this.success = true
      // } catch ( err ) {
      //   this.loading = false
      //   this.registrationError = true
      //   this.errorMessage = err.message
      // }
    }
  },
  data: ( ) => ( {
    success: false,
    registrationError: false,
    errorMessage: '',
    loading: false,
    serverInfo: null,
    _: null,
    valid: true,
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    passwordRules: [
      v => !!v || 'Password is required',
      v => ( v && v.length >= 8 ) || 'Password must be at least 8 characters',
    ],
    passwordStrength: 10,
    pwdSuggestions: '',
    showPassword: false,
    nameRules: [
      v => !!v || 'Name is required',
      v => ( v && v.length <= 10 ) || 'Name must be less than 10 characters',
    ],
    email: '',
    emailRules: [
      v => !!v || 'E-mail is required',
      v => /.+@.+\..+/.test( v ) || 'E-mail must be valid',
    ],
  } )
}
</script>