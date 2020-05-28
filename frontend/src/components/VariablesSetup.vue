<template>
  <v-container>
    <v-row align='center' justify='center'>
      <v-col xs='12'>
        <v-form ref="form" v-model="valid">
          <p class="mb-4">It's important to set these variables up, where relevant - the defaults are not that great.</p>
          <v-text-field label='server name' v-model='serverName' persistent-hint hint='A descriptive and memorable server name'></v-text-field>
          <v-text-field label='your company' v-model='company' persistent-hint hint='The company/team/project this server belongs to.'></v-text-field>
          <v-text-field label='contact details' v-model='contact' persistent-hint hint='Provide an email address or link that users can reach out to for help.'></v-text-field>
          <v-text-field label='terms of service' v-model='tos' persistent-hint hint='A link to your terms of service (optional)'></v-text-field>
          <!-- TODO: Implement optional email subscription for a "server admins" list -->
          <!-- <p class='xxx-caption mt-4'>As you have deployed this server, we would like to stay in touch with you for updates and notifications regarding any vulnerability patching. Let us know below if you want to participate.</p>
          <v-checkbox v-model="subscribe" label="Subscribe to updates"></v-checkbox> -->
          <v-btn block block color='primary' class='' :loading='loading' @click="submit">Submit</v-btn>
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
    serverInfo: gql ` query { serverInfo { name company description adminContact canonicalUrl termsOfService } }`
  },
  methods: {
    async submit( ) {
      this.loading = true
      try {
        let result = await this.$apollo.mutate( {
          mutation: gql `
          mutation ( $info: ServerInfoUpdateInput! ) { serverInfoUpdate( info: $info ) }
        `,
          variables: {
            info: {
              name: this.serverName,
              company: this.company,
              adminContact: this.contact,
              termsOfService: this.tos
            }
          }
        } )
        if ( result.data.serverInfoUpdate ) {
          this.loading = false
          this.$emit( 'completed' )
        } else
          throw new Error( 'Failed to update server information.' )

      } catch ( err ) {
        this.loading = false
        this.setupError = true
        this.errorMessage = err.message
      }
    }
  },
  data: ( ) => ( {
    serverInfo: null,
    valid: true,
    setupError: false,
    loading: false,
    errorMessage: '',
    subscribe: true,
    serverName: 'Default Speckle Server',
    company: 'Acme Inc.',
    contact: null,
    tos: null
  } )
}
</script>