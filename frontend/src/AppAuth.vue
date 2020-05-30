<template>
  <v-app>
    <v-container fluid fill-height>
      <v-row align='center' justify='center'>
        <v-col xs='10' sm='8' md='6' lg='4' class=''>
          <!-- <p class="caption">Hello auth wrapper</p> -->
          <v-card class='elevation-10'>
            <v-img class="white--text align-end" height="200px" src="./assets/s2logo-wide.svg"></v-img>
            <v-card-text>
              <div v-if='appId!==null'>
                <p class='title font-weight-light text-center'>Allow <b>Carbon Estimator</b> by <b>Acme. Inc.</b> to access your account on this server?</p>
                <v-expansion-panels hover tile>
                  <v-expansion-panel>
                    <v-expansion-panel-header>
                      Requested scopes:
                      <template v-slot:actions>
                        <v-icon color="primary">mdi-alert-circle</v-icon>
                      </template>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <ul class='my-3'>
                        <template v-for='scope in serverInfo.scopes'>
                          <li :key='scope.name'>
                            <b>{{scope.name}}</b>: {{scope.description}}
                          </li>
                        </template>
                      </ul>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
                <v-btn block class='my-3 primary'>Allow</v-btn>
                <v-btn small outlined block class='my-3' :href='`mailto:security@speckle.systems?cc=${serverInfo.adminContact}&subject=Suspicious third party app: ${application.name}&body=Server: ${serverInfo.name} : ${serverInfo.company} : ${currentUrl}`'>Report</v-btn>
              </div>
              <div v-else>
                <div>
                  <v-text-field label='your email' solo></v-text-field>
                  <v-btn block color='accent' style='top:-22px;'>continue</v-btn>
                </div>
                <div class='text-center'>or sign in with:</div>
                <template v-for='s in strategies'>
                  <v-btn block color='' :key='s' class='my-2'>{{s}}</v-btn>
                </template>
              </div>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-text class='blue-grey lighten-5'>
              <div >
                <b>{{serverInfo.name}}</b> deployed by {{serverInfo.company}}
                <br>
                <b>Terms of Service:</b> {{serverInfo.termsOfService}}
                <br>
                <b>Support:</b> {{serverInfo.adminContact}}
              </div>
            </v-card-text>
          </v-card>
          <!-- <router-view></router-view> -->
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>
<script>
import gql from 'graphql-tag'

export default {
  name: 'AppAuth',
  apollo: {
    serverInfo: {
      query: gql ` query { serverInfo { name company adminContact termsOfService scopes { name description } } } `,
    }
  },
  components: {},
  data: ( ) => ( {
    currentUrl: window.location,
    serverInfo: { name: 'Loading', },
    strategies: [
      'Github',
      'Google',
    ],
    requestedScopes: [ ],
    appId: null,
    application: { name: 'App Name', author: 'Acme Inc' }
  } ),
  mounted( ) {
    console.log( this.$route )
    this.requestedScopes = this.$route.query.scopes ? this.$route.query.scopes.split( ',' ) : [ ]
    this.appId = this.$route.query.appId || null
    // console.log( this.$router )
  }

}
</script>