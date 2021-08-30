<template>
  <v-container>
    <v-row justify="center" style="margin-top: 50px" dense>
      <v-col cols="12" lg="6" md="6" xl="6" class="d-flex flex-column justify-center align-center">
        <v-card flat tile color="transparent" class="pa-0">
          <div class="d-flex flex-column justify-space-between align-center mb-10">
            <v-img contain max-height="200" src="@/assets/emptybox.png" v-if="!errorType"></v-img>
            <v-img
              contain
              max-height="200"
              src="@/assets/lockbox.png"
              v-else-if="errorType == 'access'"
            ></v-img>
            <v-img
              contain
              max-height="200"
              src="@/assets/404box.png"
              v-else-if="errorType == '404'"
            ></v-img>
          </div>
          <div class="text-center mb-2 space-grotesk">
            <slot name="default"></slot>
          </div>
          <v-container style="max-width: 500px">
            <slot name="actions">
              <v-list rounded class="transparent">
                <v-list-item link class="primary mb-4 no-overlay" dark :to="`${$route.params.streamId && errorType !== '404' && errorType !== 'access' ? '/streams/' + $route.params.streamId : '/'}`">
                  <v-list-item-icon>
                    <v-icon>mdi-home</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Home</v-list-item-title>
                    <v-list-item-subtitle class="caption">Go to the homepage</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </slot>
          </v-container>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
export default {
  props: {
    errorType: {
      type: String,
      default: null
    }
  },
  computed: {},
  methods: {}
}
</script>
<style scoped>
.no-overlay.v-list-item--active::before {
  opacity: 0 !important;
}
.no-overlay.v-list-item--active {
  color: white !important;
}
</style>
