<template>
  <v-app>
    <v-container fluid fill-height>
      <v-row align='center' justify='center'>
        <v-col xs='10' sm='8' md='6' lg='4' class=''>
          <p class="caption">Hello auth wrapper. Loggedin {{loggedIn}}</p>
          <v-card class='elevation-20'>
            <v-img class="white--text align-end" height="200px" src="./assets/s2logo-wide.svg"></v-img>
            <v-card-text class='pa-1'>
              <v-container fluid>
                <v-row style='margin-top:-10px;' dense>
                  <v-col cols=12>
                    <p class='title font-weight-light text-center'>
                      Signing in to
                      <!-- <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <b v-on="on">Speckle</b>
                        </template>
                        {{serverInfo.name}} <b>deployed by</b> {{serverInfo.company}}
                      </v-tooltip> -->
                      <!-- <span class='caption'>to continue to</span> -->
                      <b>{{serverApp.name}}</b>&nbsp;&nbsp;
                      <v-tooltip bottom v-if='serverApp.firstparty'>
                        <template v-slot:activator="{ on }">
                          <v-icon color='accent' style='margin-top:-6px' v-on="on">mdi-shield-check</v-icon>
                        </template>
                        <span>Verified application.</span>
                      </v-tooltip>
                      <span v-else>by <b>{{serverApp.author}}</b></span>
                    </p>
                    <v-expansion-panels hover tile small v-show='!serverApp.firstparty'>
                      <v-expansion-panel>
                        <v-expansion-panel-header>
                          Requested scopes
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
                </v-row>
              </v-container>
              <!-- <v-btn block class='my-3 primary'>Allow</v-btn>
                <v-btn small outlined block class='my-3' :href='`mailto:security@speckle.systems?cc=${serverInfo.adminContact}&subject=Suspicious third party app: ${serverApp.name}&body=Server: ${serverInfo.name} : ${serverInfo.company} : ${currentUrl}`'>Report</v-btn> -->
              <router-view></router-view>
              <div class='text-center'>or sign in with:</div>
              <template v-for='s in strategies'>
                <v-btn block color='' :key='s' class='my-2'>{{s}}</v-btn>
              </template>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-text class='blue-grey lighten-5'>
              <div>
                <b>{{serverInfo.name}}</b> deployed by {{serverInfo.company}}
                <br>
                <b>Terms of Service:</b> {{serverInfo.termsOfService}}
                <br>
                <b>Support:</b> {{serverInfo.adminContact}}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>
<script>
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'


export default {
  name: 'AppAuth',
  apollo: {
    user: {
      query: gql `query { user { name company } }`,
      error( err ) {
        console.log( 'Error retrieving profile!' )
        // console.log( err )
        this.loggedIn = false
      },
      result( { data, loading, networkStatus } ) {
        if ( data.user ) {
          this.loggedIn = true
        } else {
          this.loggedIn = false
        }
        console.log( data )
        console.log( loading )
        console.log( networkStatus )
      }
    },
    serverInfo: {
      query: gql ` query { serverInfo { name company adminContact termsOfService scopes { name description } } } `,
    },
    serverApp: {
      query( ) { return gql ` query { serverApp( id: "${this.appId}") { id name author ownerId firstparty redirectUrl scopes {name description} } } ` },
      skip( ) { return this.appId === null }
    }
  },
  components: {},
  data: ( ) => ( {
    currentUrl: window.location.origin,
    serverInfo: { name: 'Loading', },
    strategies: [
      'TODO:...',
      'Github',
      'Google',
    ],
    appId: null,
    serverApp: { name: 'App Name', author: 'Acme Inc', firstparty: false, scopes: [ ] },
    loggedIn: null,
    profile: { user: null },
    user: { profile: null },
  } ),
  methods: {
    
  },
  mounted( ) {
    let urlParams = new URLSearchParams( window.location.search )
    this.appId = urlParams.get( 'appId' ) || 'spklwebapp'
  }

}
</script>