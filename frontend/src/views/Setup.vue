<template>
  <v-content>
    <v-container align="center" mt-10>
      <v-row wrap>
        <v-col cols='12'>
          <h1 class='display-2 font-weight-light'>Welcome to your new Speckle Server!</h1>
          <p class='subheading'>There's a bit of housekeeping to do first before we're ready to roll.</p>
        </v-col>
        <v-col cols='12'>
          <v-stepper v-model="e1">
            <v-stepper-header>
              <v-stepper-step :complete="e1 > 1" step="1">Register an admin user</v-stepper-step>
              <v-divider></v-divider>
              <v-stepper-step :complete="e1 > 2" step="2">Setup variables</v-stepper-step>
              <v-divider></v-divider>
              <v-stepper-step step="3">Name of step 3</v-stepper-step>
            </v-stepper-header>
            <v-stepper-items>
              <v-stepper-content step="1">
                <v-card class="mb-12 elevation-0" color="grey lighten-4" height="200px">
                  wow
                </v-card>
                <v-btn color="primary" @click="e1 = 2">
                  Continue
                </v-btn>
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
</template>
<script>
export default {
  name: 'App',

  components: {

  },

  data: ( ) => ( {
    e1: 1
  } ),
}
</script>