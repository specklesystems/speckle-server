<template>
  <v-app>
    <v-container fluid fill-height v-if='!error'>
      <v-row align='center' justify='center'>
        <v-col xs='10' sm='6' md='5' lg='4' xl='3' class=''>
          Err: {{error}} : {{errorMessage}} // Local: {{hasLocalStrategy}}
          <v-card class='elevation-20'>
            <v-img class="white--text align-end" height="100px" src="./assets/s2logo-wide.svg"></v-img>
            <v-card-text class='pa-1'>
              <v-container fluid>
                <v-row style='margin-top:-10px;' dense>
                  <v-col cols=12>
                    <p class='title font-weight-light text-center' v-if='app.firstparty'>
                      Signing in to <b>{{app.name}}</b>&nbsp;&nbsp;
                      <v-tooltip bottom v-if='app.firstparty'>
                        <template v-slot:activator="{ on }">
                          <v-icon color='accent' style='margin-top:-6px' v-on="on">mdi-shield-check</v-icon>
                        </template>
                        <span>Verified application.</span>
                      </v-tooltip>
                    </p>
                    <p class='title font-weight-light text-center' v-if='!app.firstparty && !isFinalizing'>
                      You need to sign in first<br>to authorize <span class='accent--text'><b>{{app.name}}</b></span> by <b>{{app.author}}.</b>
                    </p>
                  </v-col>
                </v-row>
              </v-container>
              <router-view></router-view>
              <v-container v-if='!isFinalizing'>
                <v-row>
                  <template v-for='s in strategies'>
                    <v-col cols='12' class='text-center py-0 my-0'>
                      <v-btn block large tile :color='s.color' dark :key='s.name' class='my-2' :href='`${s.url}?appId=${appId}&challenge=${challenge}`'>{{s.name}}</v-btn>
                    </v-col>
                  </template>
                </v-row>
              </v-container>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-text class='blue-grey lighten-5'>
              <div class='text-center'>
                <b>{{serverInfo.name}}</b> <br>deployed by<br><b>{{serverInfo.company}}</b>
                <br>
                <v-divider class='my-2'></v-divider>
                <b>Terms of Service:</b> {{serverInfo.termsOfService}}
                <br>
                <b>Support:</b> {{serverInfo.adminContact}}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <v-container fluid fill-height v-else>
      <v-row align='center' justify='center'>
        <v-col xs='10' sm='6' md='5' lg='4' xl='3' class=''>
          <v-card class='elevation-20' color='red'>
            <v-card-text class='white--text title'>
              <v-icon color='white'>mdi-bug</v-icon>&nbsp;{{errorMessage}}
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
  import crs from 'crypto-random-string'
  export default {
    name: 'AppAuth',
    apollo: {
      serverInfo: {
        query: gql ` query { serverInfo { name company adminContact termsOfService scopes { name description } authStrategies { id name color icon url } } }  `,
      },
      app: {
        query() {
          return gql ` query { app( id: "${this.appId}") { id name redirectUrl scopes {name description} } } `
        },
        skip() {
          return this.appId === null
        },
        data({
          data
        }, key) {
          if (data.errors) {
            this.error = true
            this.errorMessage = 'Invalid app authorization request: app not registered on this server.'
            console.log('Error: No such application!!!!!')
          }
        },
        error(err) {
          this.error = true
          this.errorMessage = `Invalid app authorization request: could not find app with id "${this.appId}" on this server.`
          console.log('Error: No such application')
        }
      }
    },
    computed: {
      isFinalizing() {
        return this.$route.path.indexOf('/finalize') !== -1
      },
      hasLocalStrategy() {
        return this.serverInfo.authStrategies.findIndex(s => s.id === 'local') !== -1
      },
      strategies() {
        return this.serverInfo.authStrategies.filter(s => s.id !== 'local')
      }
    },
    components: {},
    data: () => ({
      serverInfo: {
        name: 'Loading',
        authStrategies: []
      },
      appId: null,
      challenge: null,
      app: {
        name: null,
        author: null,
        firstparty: null,
        scopes: []
      },
      loggedIn: null,
      profile: {
        user: null
      },
      user: {
        profile: null
      },
      error: false,
      errorMessage: null
    }),
    methods: {
      goToStrategy() {}
    },
    mounted() {
      let urlParams = new URLSearchParams(window.location.search)
      let appId = urlParams.get('appId')
      let challenge = urlParams.get('challenge')
      if (!appId)
        this.appId = 'spklwebapp'
      else
        this.appId = appId
      if (!challenge && this.appId === 'spklwebapp') {
        if (localStorage.getItem('appChallenge')) {
          // Do nothing!
        } else {
          this.challenge = crs({
            length: 10
          })
          localStorage.setItem('appChallenge', this.challenge)
        }
      } else if (challenge) {
        this.challenge = challenge
      } else {
        if (window.location.href.indexOf('/finalize') === -1) {
          this.error = true
          this.errorMessage = 'Invalid app authorization request: missing challenge.'
        }
      }
    },
    async beforeCreate() {
      // checks login
      let token = localStorage.getItem('AuthToken')
      if (token) {
        let testResponse = await fetch('/graphql', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `{ user { id } }`
          })
        })
        let data = (await testResponse.json()).data
        if (data.user)
          return true
      }
    }
  }

</script>
