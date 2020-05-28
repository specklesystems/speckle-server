<template>
  <v-app dark>
    <v-content>
      <v-container align="center" mt-10>
        <v-row wrap justify='center'>
          <v-col sm='12' md='8' class='text-center-xxx'>
            <v-card class='elevation-0'>
              <v-card-text>
                <h1 class='display-1 font-weight-light mb-5'>Speckle Server Setup</h1>
                <p class='subheading'>
                  Welcome! There's a bit of housekeeping to do first before we're ready to roll.
                </p>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols='12' sm='12' md='8'>
            <v-stepper v-model="e1" class='elevation-10'>
              <v-stepper-header class='elevation-0'>
                <v-stepper-step color='accent' :complete="e1 > 1" step="1">Admin User</v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step color='accent' :complete="e1 > 2" step="2">Server Info</v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step color='accent' step="3">All set!</v-stepper-step>
              </v-stepper-header>
              <v-stepper-items>
                <v-stepper-content step="1">
                  <v-card class="mb-12 elevation-0">
                    <RegistrationForm v-on:completed='e1 = 2' />
                  </v-card>
                </v-stepper-content>
                <v-stepper-content step="2">
                  <v-card class="mb-12 elevation-0">
                    <VariablesSetup v-on:completed='e1 = 3' />
                  </v-card>
                </v-stepper-content>
                <v-stepper-content step="3">
                  <v-card class="mb-12 elevation-0 transparent text-center" color="" height="400px">
                    <v-img src='./assets/serverstatus.svg' height='130' class='mt-10' contain></v-img>
                    <p class='display-1 mt-10 font-weight-light'>Congrats! You're all done.</p>
                    <p>The server will now restart, and when that's done - you're good to go.</p>
                  </v-card>
                  <v-btn color="primary" block large @click="e1 = 1">
                    Done!
                  </v-btn>
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
export default {
  name: 'App',
  components: {
    RegistrationForm,
    VariablesSetup
  },
  data: ( ) => ( {
    setup: true, //lol
    e1: 1,
    user: {}
  } ),
  methods: {},
  mounted( ) {
    let token = localStorage.getItem( 'AuthToken' )

    if ( token ) {
      setTimeout( function ( ) {
        onLogin( this.$apolloProvider.clients.defaultClient, `${token}` )
        this.e1 = 2
      }.bind( this ), 250 )
    }
  }
}
</script>