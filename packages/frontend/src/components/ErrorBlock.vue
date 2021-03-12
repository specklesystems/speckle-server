<template>
  <v-sheet rounded="lg" class="pa-15">
    <h1>
      <v-icon large>mdi-bug</v-icon>
      Oups...
      <br />
      {{ message }}
    </h1>
    <!-- <v-img src="@/assets/bug.svg" responsive contain max-height="100"/> -->
    <p class="headline mt-5 font-weight-light">
      Don't worry - you haven't deleted the internet,
      <br />
      just 👉 go back
      <router-link to="/">home</router-link>
      !
    </p>
  </v-sheet>
</template>
<script>
export default {
  props: {
    message: {
      type: String,
      default: ''
    }
  }
}
</script>
