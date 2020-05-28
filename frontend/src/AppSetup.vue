<template>
  <v-app dark>
    <v-content>
      <v-container align="center" mt-10>
        <v-row justify='center'>
          <v-col sm='12' md='8' lg='6' xl='4' class='text-center-xxx'>
            <v-card class='elevation-0'>
              <v-card-text>
                <h1 class='display-1 font-weight-light mb-5'>Speckle Server Setup</h1>
                <p class='subheading'>
                  Welcome! There's a bit of housekeeping to do first before we're ready to roll.
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row justify='center'>
          <v-col cols='12' sm='12' md='8' lg='6' xl='4'>
            <v-stepper v-model="e1" class='elevation-10'>
              <v-stepper-header class='elevation-0'>
                <v-stepper-step color='primary' :complete="e1 > 1" class='caption' step="1">Admin User</v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step color='primary' :complete="e1 > 2" class='caption' step="2">Server Info</v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step color='primary' class='caption' step="3">All set!</v-stepper-step>
              </v-stepper-header>
              <v-stepper-items>
                <v-stepper-content class='py-0' step="1" transition="scale-transition">
                  <v-card class="mb-1 elevation-0">
                    <RegistrationForm v-on:completed='e1 = 2' />
                  </v-card>
                </v-stepper-content>
                <v-stepper-content class='py-0' step="2">
                  <v-card class="mb-1 elevation-0">
                    <VariablesSetup v-on:completed='e1 = 3' />
                  </v-card>
                </v-stepper-content>
                <v-stepper-content class='py-0' step="3">
                  <v-card class="mb-1 elevation-0 transparent text-center" color="" height="400px">
                    <v-img src='./assets/serverstatus.svg' height='130' class='mt-10' contain></v-img>
                    <p class='display-1 mt-10 font-weight-light'>Bravó! You're all done ✨ </p>
                    <p class='headline'>What's next?</p>
                    <p>
                      When you refresh this page, you will see the main server application. Everything should be ready for action!
                    </p>
                  </v-card>
                  <!-- 
                  <v-btn color="primary" block large @click="e1 = 1">
                    Refresh
                  </v-btn> -->
                </v-stepper-content>
              </v-stepper-items>
            </v-stepper>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </v-app>
</template>
<script>
import RegistrationForm from './components/RegistrationForm'
import VariablesSetup from './components/VariablesSetup'
import { onLogin } from './vue-apollo'
import gql from 'graphql-tag'

export default {
  name: 'App',
  components: {
    RegistrationForm,
    VariablesSetup
  },
  watch: {
    e1( val ) {
      if ( val === 3 )
        this.getInfo = true
    },
    user( s1, s2 ) {
      if ( s1 && s1.name !== null )
        this.e1 = 2
    }
  },
  apollo: {
    serverInfo: {
      query: gql ` query { serverInfo { name company adminContact termsOfService } } `,
      skip( ) { return !this.getInfo }
    },
    user: {
      query: gql `query { user { name role } } `
    }
  },
  data: ( ) => ( {
    setup: true, //lol
    e1: 1,
    user: null,
    getInfo: false,
    serverInfo: {}
  } ),
  methods: {},
  mounted( ) {}
}
</script>