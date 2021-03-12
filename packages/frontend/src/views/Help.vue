<template>
  <v-container>
    <v-row align="center" justify="center">
      <v-col cols="12" md="8">
        <v-sheet rounded="lg" class="pa-15 text-center">
          <h1>Need Help?</h1>
          <p class="ma-10 subtitle-1 font-weight-light">
            Get free help from the
            <a href="https://speckle.community/">Speckle Community forum</a>
            or
            <a href="mailto:hello@speckle.systems">contact us</a>
            to set up a support agreement and one of our engineers will help right away 🚀!
          </p>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import ServerInfoCard from '../components/ServerInfoCard'

export default {
  components: { ServerInfoCard }
}
</script>
