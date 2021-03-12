<template>
  <v-app id="speckle-auth">
    <v-container fill-height fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" md="8">
          <error-block :message="'Page not found'" />
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>
<script>
import ErrorBlock from '../components/ErrorBlock'
export default {
  components: {
    ErrorBlock
  }
}
</script>
