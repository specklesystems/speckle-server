<template>
  <v-container fluid>
    <v-row style='margin-top:-10px;' dense v-if='state===0'>
      <v-col cols=12>
        <div>
          <p class='title font-weight-light text-center'>
            Authorize <span class='accent--text'><b>{{serverApp.name}}</b></span> by <b>{{serverApp.author}}</b>?
          </p>
          <p class='caption text-center'>Clicking allow will redirect you to <i>{{serverApp.redirectUrl }}</i></p>
        </div>
        <v-expansion-panels multiple hover tile flat small v-show='!serverApp.firstparty' v-model='panel'>
          <v-expansion-panel>
            <v-expansion-panel-header class=' elevation-0'>
              <b>Requested permissions:</b>
              <template v-slot:actions>
                <v-icon color="accent">mdi-alert-circle</v-icon>
              </template>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <ul class='my-3'>
                <template v-for='scope in serverApp.scopes'>
                  <li :key='scope.name'>
                    <b>{{scope.name}}</b>: {{scope.description}}
                  </li>
                </template>
              </ul>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
      <v-col cols='6'>
        <v-btn block tile color='accent' @click='allow'>Allow</v-btn>
      </v-col>
      <v-col cols='6'>
        <v-btn block tile color='primary' @click='deny'>Deny</v-btn>
      </v-col>
    </v-row>
    <v-row v-if='state===1'>
      <v-col cols='12'>
        <p class='title font-weight-light text-center'>
          Permissions denied.<br>You can safely close this page.
        </p>
      </v-col>
    </v-row>
    <v-row v-if='state===2'>
      <v-col cols='12'>
        <p class='title font-weight-light text-center'>
          <b>Permissions granted.</b><br>You can now safely close this page.
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
</template>
<script>
import gql from 'graphql-tag'
import { onLogin } from '../../vue-apollo'
import debounce from 'lodash.debounce'
export default {
  name: 'AuthorizeApp',
  apollo: {
    serverApp: {
      query( ) { return gql ` query { serverApp( id: "${this.appId}") { id name author ownerId firstparty redirectUrl scopes {name description} } } ` },
      skip( ) { return this.appId === null },
      result( { data, loading, networkStatus } ) {
        if ( data.serverApp.firstparty ) {
          let redirectUrl = data.serverApp.redirectUrl === 'self' ? '/' : data.serverApp.redirectUrl
          try {
            window.location = `${redirectUrl}?access_code=${this.accessCode}`
          } catch ( err ) {
            // Fetch? 
          }
        }
      }
    }
  },
  methods: {
    async deny( ) {
      this.state = 1
      window.history.replaceState( {}, document.title, '/auth/finalize' )
      fetch( `${this.serverApp.redirectUrl}?success=false`, { method: 'GET' } ).then( ).catch( )
    },
    async allow( ) {
      this.state = 2
      try {
        window.location = `${this.serverApp.redirectUrl}?access_code=${this.accessCode}`
      } catch ( err ) {
        fetch( `${this.serverApp.redirectUrl}?access_code=${this.accessCode}`, { method: 'GET' } ).then( ).catch( )
      }
    }
  },
  data: ( ) => ( {
    state: 0,
    currentUrl: window.location.origin,
    panel: [ 0 ],
    registrationError: false,
    errorMessage: '',
    appId: null,
    serverApp: { name: null, author: null, firstparty: null, scopes: [ ] },
    token: null,
    accessCode: null,
  } ),
  mounted( ) {
    let urlParams = new URLSearchParams( window.location.search )
    this.appId = urlParams.get( 'appId' ) || 'spklwebapp'
    this.accessCode = urlParams.get( 'access_code' )

    if ( !this.accessCode ) {
      this.$router.push( { name: "Login", query: { appId: urlParams.get( 'appId' ) } } )
      return
    }
  }
}
</script>