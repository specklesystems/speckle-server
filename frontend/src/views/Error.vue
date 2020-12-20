<template>
  <v-container>
    <v-row align="center" justify="center">
      <v-col cols="12" md="8">
        <v-sheet rounded="lg" class="pa-15">
          <h1>
            Oups. There was an error
            <v-icon large>mdi-bug</v-icon>
          </h1>
          <p class="subtitle-1 font-weight-light">
            Don't worry. Here's a bunch of places you might want to go to:
            <br />
            <br />
            <router-link to="/">Home</router-link>
            <br />
            <router-link to="/streams">Streams</router-link>
            <br />
            <router-link to="/profile">Your Profile</router-link>
          </p>
          <h3>Feedback</h3>
          <p>If you're feeling industrious, we'd love if you reported this error:</p>
          <p class="body-2">
            1)
            <b>Open the console of your browser.</b>
            <span class="caption">
              On Chrome, you can do so via these shortcuts: Option + ⌘ + J (on macOS), or Shift +
              CTRL + J (on Win). For Firefox, Ctrl + Shift + K ( Command + Option + K on OS X). For
              MS Edge, Shift + ⌘ + J (on macOS) or Shift + CTRL + J.
            </span>
          </p>
          <p class="body-2">
            2)
            <b>Take a screenshot.</b>
          </p>
          <p class="body-2">
            3)
            <b>Send it to us</b>
            at
            <a href="mailto:hello@speckle.systems">hello@speckle.systems.</a>
          </p>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
export default {}
</script>
