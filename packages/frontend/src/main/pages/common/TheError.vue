<template>
  <v-app
    id="speckle"
    :class="`${$vuetify.theme.dark ? 'background-dark' : 'background-light'}`"
  >
    <v-container fill-height fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" md="8">
          <v-sheet rounded="lg" class="pa-5">
            <h1>
              <v-icon large class="mr-2">mdi-bug</v-icon>
              There was an error :(
            </h1>
            <v-alert v-if="$route.query.message" type="info" class="mt-5">
              The server said:
              <br />
              <pre>{{ $route.query.message }}</pre>
            </v-alert>
            <v-divider class="my-5" />
            <h3>
              <v-icon small class="mr-2">mdi-home</v-icon>
              Next Steps
            </h3>
            <p>
              Shall we try going back
              <a href="/">home</a>
              ?
            </p>
            <h3>
              <v-icon small class="mr-2">mdi-comment</v-icon>
              Feedback
            </h3>
            <p>If you're feeling industrious, we'd love if you reported this error:</p>
            <p class="body-2">
              1)
              <b>Open the console of your browser.</b>
              <span class="caption">
                On Chrome, you can do so via these shortcuts: Option + ⌘ + J (on macOS),
                or Shift + CTRL + J (on Win). For Firefox, Ctrl + Shift + K ( Command +
                Option + K on OS X). For MS Edge, Shift + ⌘ + J (on macOS) or Shift +
                CTRL + J.
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
  </v-app>
</template>
<script>
export default {
  name: 'TheError'
}
</script>
<style scoped>
pre {
  white-space: pre-wrap; /* Since CSS 2.1 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
}
</style>
