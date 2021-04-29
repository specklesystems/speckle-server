<template>
  <div>
    <v-sheet v-if="message === 'You are not authorised.'" rounded="lg" class="pa-15">
      <h1>
        <v-icon large>mdi-account-cancel</v-icon>
        {{ message }}
      </h1>
      <!-- <v-img src="@/assets/bug.svg" responsive contain max-height="100"/> -->
      <p class="headline mt-5 font-weight-light">
        Please log in or register to access this content.
      </p>
      <v-btn color="primary" to="/authn/login">
        <v-icon left>mdi-account-arrow-right</v-icon>
        Logn in / Register
      </v-btn>
    </v-sheet>
    <v-sheet v-else rounded="lg" class="pa-15">
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
  </div>
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
