<template>
  <v-app>
    <v-container fluid fill-height>
      <v-row align='center' justify='center'>
        <v-col xs='10' sm='8' md='6' lg='4' class=''>
          <!-- <p class="caption">Hello auth wrapper. Loggedin {{loggedIn}}</p> -->
          <v-card class='elevation-20'>
            <v-img class="white--text align-end" height="200px" src="./assets/s2logo-wide.svg"></v-img>
            <v-card-text class='pa-1'>
              <v-container fluid>
                <v-row style='margin-top:-10px;' dense>
                  <v-col cols=12>
                    <p class='title font-weight-light text-center' v-if='serverApp.firstparty'>
                      Signing in to <b>{{serverApp.name}}</b>&nbsp;&nbsp;
                      <v-tooltip bottom v-if='serverApp.firstparty'>
                        <template v-slot:activator="{ on }">
                          <v-icon color='accent' style='margin-top:-6px' v-on="on">mdi-shield-check</v-icon>
                        </template>
                        <span>Verified application.</span>
                      </v-tooltip>
                    </p>
                    <p class='title font-weight-light text-center' v-if='!serverApp.firstparty && !loggedIn'>
                      You need to sign in first<br>to authorize <span class='accent--text'><b>{{serverApp.name}}</b></span> by <b>{{serverApp.author}}.</b>
                      <!-- <b>{{serverApp.name}}</b> by {{serverApp.author}} by signing in to Speckle ({{serverInfo.name}}). -->
                    </p>
                  </v-col>
                </v-row>
              </v-container>
              <!-- <transition name="fade-transition"> -->
              <router-view></router-view>
              <!-- </transition> -->
              <v-container v-if='!this.loggedIn'>
                <v-row>
                  <v-col cols='12'>
                    <div class='text-center'>or sign in with:</div>
                    <template v-for='s in strategies'>
                      <v-btn block color='' :key='s.name' class='my-2' :href='`${s.url}?appId=${appId}`'>{{s.name}}</v-btn>
                    </template>
                  </v-col>
                </v-row>
              </v-container>
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
        this.loggedIn = false
      },
      result( { data, loading, networkStatus } ) {
        if ( data.user ) {
          this.loggedIn = true
        } else {
          this.loggedIn = false
        }
      }
    },
    serverInfo: {
      query: gql ` query { serverInfo { name company adminContact termsOfService scopes { name description } } } `,
    },
    serverApp: {
      query( ) { return gql ` query { serverApp( id: "${this.appId}") { id name author ownerId firstparty redirectUrl scopes {name description} } } ` },
      skip( ) { return this.appId === null },
      result( { data, loading, networkStatus } ) {
        if ( data )
          this.proceedToAuthorization( )
      },
      error( ) {
        console.log( 'Error: No such application' )
      }
    }
  },
  watch: {
    loggedIn( newValue, oldValue ) {
      if ( newValue )
        this.proceedToAuthorization( )
    }
  },
  components: {},
  data: ( ) => ( {
    panel: [ 0 ],
    currentUrl: window.location.origin,
    serverInfo: { name: 'Loading', },
    strategies: [
      { name: 'TODO:...', url: '' },
      { name: 'Github', url: '/auth/gh' },
      { name: 'Google', url: '' },
    ],
    appId: null,
    serverApp: { name: null, author: null, firstparty: null, scopes: [ ] },
    loggedIn: null,
    profile: { user: null },
    user: { profile: null },
  } ),
  methods: {
    proceedToAuthorization( ) {
      console.log( 'proceedToAuthorization ' )
      if ( this.serverApp === null || this.serverApp.firstparty === null ) return
      if ( this.loggedIn === false ) return
      console.log( 'Actually proceeding' )

      if ( this.appId === 'spklwebapp' ) {
        console.log( 'just redirect to "self"' )
        window.location.replace( window.location.origin )
        return
      }
      if ( this.serverApp.firstparty ) {
        // Bypass authorization screen.
        // 1) Create token for app (API CALL: Authorize App)
        // 2) Redirect to app url with token body
        console.log( 'just redirect fast-ish, it is a firstparty app' )
        return
      }

      if ( this.$route.name !== "AuthorizeApp" ) {
        let urlParams = new URLSearchParams( window.location.search )
        this.$router.push( { name: "AuthorizeApp", query: { appId: urlParams.get( 'appId' ) } } )
      }


    }
  },
  mounted( ) {
    let urlParams = new URLSearchParams( window.location.search )
    this.appId = urlParams.get( 'appId' ) || 'spklwebapp'
  }

}
</script>