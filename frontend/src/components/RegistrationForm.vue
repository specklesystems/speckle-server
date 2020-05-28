<template>
  <v-container>
    <v-row align='center' justify='center'>
      <v-col xs='12'>
        <v-form ref="form" v-model="valid" v-if='!success'>
          <v-alert prominent type="info" :icon='false' text>
            Since <b>you</b> have deployed this server, <b>you</b> need to register first. This will grant you admin rights (which will allow you to manage it properly, later on). Have any questions? Let us know!
          </v-alert>
          <v-text-field label='First Name' v-model="firstName" required :rules="nameRules"></v-text-field>
          <v-text-field label='Last Name' v-model="lastName" required :rules="nameRules"></v-text-field>
          <v-text-field label='Email' v-model="email" required type='email' :rules="emailRules"></v-text-field>
          <v-text-field label='Password' v-model="password" required type='password' :rules="passwordRules"></v-text-field>
          <v-text-field label='Confirm Password' v-model="confirmPassword" required type='password' :rules="passwordRules"></v-text-field>
          <v-btn block large color='accent' :loading='loading' @click="submit">Submit</v-btn>
        </v-form>
        <v-container v-else>
          <v-alert prominent type="success" text>
            <v-row align="center">
              <v-col class="grow">Great! You're all set.</v-col>
              <v-col class="shrink">
                <v-btn @click="$emit( 'completed' )">Next</v-btn>
              </v-col>
            </v-row>
          </v-alert>
        </v-container>
      </v-col>
    </v-row>
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
import { onLogin } from '../vue-apollo'
export default {
  apollo: {
    serverInfo: gql ` query { serverInfo { name company roles { name }} }`,
    _: gql `query { _ }`
  },
  methods: {
    async submit( ) {
      let test = this.$refs.form.validate( )
      if ( !test ) return

      this.loading = true
      try {
        let result = await this.$apollo.mutate( {
          mutation: gql `
          mutation ($user: UserCreateInput!) { userCreateAdmin( user: $user ) }
        `,
          variables: {
            user: { name: `${this.firstName} ${this.lastName}`, username: `${this.firstName}${this.lastName}`, email: this.email, password: this.password }
          }
        } )

        this.loading = false
        onLogin( this.$apolloProvider.clients.defaultClient, `${result.data.userCreateAdmin}` )
        this.success = true
      } catch ( err ) {
        this.loading = false
        this.registrationError = true
        this.errorMessage = err.message
      }
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