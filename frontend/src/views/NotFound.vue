<template>
  <v-container>
    <v-row align="center" justify="center">
      <v-col cols="12" md="8">
        <v-sheet rounded="lg" class="pa-15">
          <h1>
            Oups. Page not found
            <v-icon large>mdi-bug</v-icon>
          </h1>
          <!-- <v-img src="@/assets/bug.svg" responsive contain max-height="100"/> -->
          <p class="subtitle-1 font-weight-light">
            Don't worry - you haven't deleted the internet. Here's a bunch of places you might want to go to:
            <br />
            <br />
            <router-link to="/">Home</router-link>
            <br />
            <router-link to="/streams">Streams</router-link>
            <br />
            <router-link to="/profile">Your Profile</router-link>
          </p>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
export default {}
</script>
