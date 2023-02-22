<template>
  <v-app
    id="speckle"
    :class="`${$vuetify.theme.dark ? 'background-dark' : 'background-light'}`"
  >
    <v-container fill-height fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" md="10" lg="8" xl="6">
          <getting-started-steps />
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>
<script>
import GettingStartedSteps from '@/main/components/onboarding/GettingStartedSteps.vue'
export default {
  name: 'TheOnboarding',
  components: { GettingStartedSteps }
}
</script>
<style scoped>
.background-light {
  background: #8e9eab;
  background: -webkit-linear-gradient(to top right, #eeeeee, #c8e8ff);
  background: linear-gradient(to top right, #ffffff, #c8e8ff);
}

.background-dark {
  background: #141e30;
  background: -webkit-linear-gradient(to top left, #243b55, #141e30);
  background: linear-gradient(to top left, #243b55, #141e30);
}
</style>
