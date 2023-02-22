<template>
  <v-app
    id="speckle"
    :class="`${$vuetify.theme.dark ? 'background-dark' : 'background-light'}`"
  >
    <v-container fill-height fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" md="8">
          <error-placeholder error-type="404">
            <h2>Page not found.</h2>
          </error-placeholder>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>
<script>
import ErrorPlaceholder from '@/main/components/common/ErrorPlaceholder'
export default {
  components: {
    ErrorPlaceholder
  }
}
</script>
