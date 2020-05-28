<template>
  <v-container>
    <v-row align='center' justify='center'>
      <v-col xs='12'>
        <v-form ref="form" v-model="valid">
          <v-alert prominent type="info" :icon='false' text>
            It's important to set these variables up, where relevant - the defaults are not that great.
          </v-alert>
          <v-text-field label='server name' v-model='serverName' persistent-hint hint='A descriptive and memorable server name'></v-text-field>
          <v-text-field label='your company' v-model='company' persistent-hint hint='The company this server belongs to.'></v-text-field>
          <v-text-field label='contact details' v-model='contact' persistent-hint hint='Provide an email address or link that users can reach out to for help.'></v-text-field>
          <v-text-field label='terms of service' v-model='tos' persistent-hint hint='A link to your terms of service (optional)'></v-text-field>
          <!-- <v-btn block color='accent' :loading='false' @click="submit">Submit</v-btn> -->
          <v-btn block large color='accent' class='mt-5' :loading='loading' @click="submit">Submit</v-btn>
          <p class="caption text-center my-3">Note: By clicking the submit button, you grant us the right to get in touch with you regarding critical security updates, and other important news.</p>
          <div class='text-center'>
            <v-btn small outlined color='primary' class='mt-6' @click="$emit('completed')">skip</v-btn>
          </div>
        </v-form>
      </v-col>
    </v-row>
    <v-snackbar v-model="setupError" multi-line>
      {{ errorMessage }}
      <v-btn color="red" text @click="setupError = false">
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
    serverInfo: gql ` query { serverInfo { name company description adminContact canonicalUrl tos } }`
  },
  methods: {
    async submit( ) {
      this.loading = true
      try {
        let result = await this.$apollo.mutate( {
          mutation: gql `
          mutation ($info: ServerInfoUpdateInput!) { serverInfoUpdate( info: $info ) }
        `,
          variables: {
            info: {
              name: this.serverName,
              company: this.company,
              adminContact: this.contact,
              tos: this.tos
            }
          }
        } )
        console.log( result )
        this.loading = false
        this.$emit( 'completed' )
      } catch ( err ) {
        this.loading = false
        this.setupError = true
        this.errorMessage = err.message
      }
    }
  },
  data: ( ) => ( {
    valid: true,
    setupError: false,
    loading: false,
    errorMessage: '',
    serverInfo: null,
    serverName: 'Default Speckle Server',
    company: null,
    contact: null,
    tos: null
  } )
}
</script>