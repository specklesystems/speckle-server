<template>
  <v-container>
    <v-row>
      <v-col cols="3">
        <sidebar-home></sidebar-home>
      </v-col>
      <v-col cols="9">
        <v-sheet rounded="lg" class="pa-15 text-center">
          <h1>Need Help?</h1>
          <p class="ma-10 subtitle-1 font-weight-light">
            Get free help from the
            <a href="https://discourse.speckle.works/">
              Speckle Community forum
            </a>
            or
            <a href="mailto:hello@speckle.systems">contact us</a>
            to set up a support agreement and one of our engineers will help
            right away 🚀!
          </p>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import SidebarHome from "../components/SidebarHome"

export default {
  components: { SidebarHome }
}
</script>
