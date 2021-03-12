<template>
  <v-app id="speckle-auth">
    <v-container fill-height fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" md="8" lg="6" xl="4">
          <getting-started-steps />
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>
<script>
import GettingStartedSteps from '../components/GettingStartedSteps.vue'
export default {
  components: { GettingStartedSteps }
}
</script>
