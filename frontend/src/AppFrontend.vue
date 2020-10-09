<template>
  <v-app id="speckle">
    <v-app-bar app color="white" flat>
      <v-container class="py-0 fill-height">
        <v-btn text to="/">
          <v-img
            contain
            max-height="30"
            max-width="30"
            src="./assets/logo.svg"
          />
          <div class="mt-1">
            <span class="primary--text"><b>SPECKLE</b></span>
            &nbsp;
            <span class="font-weight-light">ADMIN</span>
          </div>
        </v-btn>

        <v-btn
          v-for="link in navLinks"
          :key="link.name"
          text
          class="text-uppercase"
          :to="link.link"
        >
          {{ link.name }}
        </v-btn>

        <v-spacer></v-spacer>

        <v-responsive max-width="260">
          <v-text-field
            dense
            flat
            hide-details
            rounded
            solo-inverted
          ></v-text-field>
        </v-responsive>
      </v-container>
    </v-app-bar>

    <v-main class="grey lighten-3">
      <router-view></router-view>
    </v-main>
  </v-app>
</template>
<script>
export default {
  data: () => ({
    navLinks: [
      { link: "/streams", name: "streams" },
      { link: "/help", name: "help" }
    ]
  })
}
</script>
