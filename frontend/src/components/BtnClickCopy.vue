<template>
  <span>
    <v-btn v-tooltip="'Copy to clipboard'" icon small @click="copy">
      <v-icon small>mdi-content-copy</v-icon>
    </v-btn>
    <input id="text-to-copy" type="hidden" :value="text" />
    <v-snackbar v-model="snackbar" :timeout="2000" :color="color" text>
      <div class="text-center">
        <span class="streamid">{{ text }}</span>
        {{ message }}
      </div>
    </v-snackbar>
  </span>
</template>
<script>
export default {
  props: ["text"],
  data: () => ({
    snackbar: false,
    message: "StreamId copied successfully",
    color: "success"
  }),
  methods: {
    copy() {
      this.snackbar = true
      let textToCopy = document.querySelector("#text-to-copy")
      textToCopy.setAttribute("type", "text")
      textToCopy.select()

      try {
        let result = document.execCommand("copy")
        this.message = ` copied ${result ? "" : "un"}successfully!`
        this.color = result ? "success" : "error"
      } catch (err) {
        this.message = "Oops, unable to copy!"
        this.color = "error"
      }

      /* unselect the range */
      textToCopy.setAttribute("type", "hidden")
      window.getSelection().removeAllRanges()
    }
  }
}
</script>
