<template>
  <v-app dark>
    <v-content>
      <v-container align="center" mt-10>
        <v-row wrap justify='center'>
          <v-col sm='12' md='12' class='text-center'>
            <h1 class='display-2 font-weight-light'>Welcome to your new Speckle Server!</h1>
            <p class='subheading'>There's a bit of housekeeping to do first before we're ready to roll.</p>
          </v-col>
          <v-col cols='12' sm='12' md='12'>
            <v-stepper v-model="e1">
              <v-stepper-header class='elevation-0'>
                <v-stepper-step :complete="e1 > 1" step="1">Register an admin user</v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step :complete="e1 > 2" step="2">Setup variables</v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step step="3">Name of step 3</v-stepper-step>
              </v-stepper-header>
              <v-stepper-items>
                <v-stepper-content step="1">
                  <v-card class="mb-12 elevation-0">
                    <RegistrationForm/>
                  </v-card>
                  <!-- <v-btn color="primary" @click="e1 = 2">
                    Continue
                  </v-btn> -->
                </v-stepper-content>
                <v-stepper-content step="2">
                  <v-card class="mb-12 elevation-0" color="grey lighten-4" height="200px"></v-card>
                  <v-btn color="primary" @click="e1 = 3">
                    Continue
                  </v-btn>
                </v-stepper-content>
                <v-stepper-content step="3">
                  <v-card class="mb-12 elevation-0" color="grey lighten-4" height="200px"></v-card>
                  <v-btn color="primary" @click="e1 = 1">
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
export default {
  name: 'App',
  components: {
    RegistrationForm
  },
  data: ( ) => ( {
    setup: true, //lol
    e1: 1
  } ),

}
</script>