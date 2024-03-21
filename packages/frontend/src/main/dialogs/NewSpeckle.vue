<template>
  <v-dialog v-model="dialog" persistent max-width="850px">
    <v-card class="whats-new-dialog">
      <div
        class="headline d-flex justify-space-between align-center px-4 py-3 rounded-b-0 shadow-0"
      >
        <h4>The New Speckle Web App</h4>
        <v-btn icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      <v-row no-gutters align="center" justify="space-between" class="pa-6">
        <v-col cols="12" md="7">
          <div style="padding: 56.25% 0 0 0; position: relative">
            <iframe
              src="https://player.vimeo.com/video/925455838?h=052c422cae&autoplay=1&title=0&loop=1&byline=0&portrait=0&controls=0&muted=1"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%"
              frameborder="0"
              allow="autoplay"
              allowfullscreen
            ></iframe>
          </div>
        </v-col>
        <v-col cols="12" md="5" class="pt-8 pt-md-0 pb-md-2 pl-md-8">
          <h2>What’s New?</h2>
          <div class="d-flex align-center py-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="#3C82F6"
              width="24"
              height="24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
              />
            </svg>

            <p class="ml-3 mb-0">Easier to use</p>
          </div>
          <div class="d-flex align-center py-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="#3C82F6"
              width="24"
              height="24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
              />
            </svg>
            <p class="ml-3 mb-0">More collaborative features</p>
          </div>
          <div class="d-flex align-center py-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="#3C82F6"
              width="24"
              height="24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
              />
            </svg>
            <p class="ml-3 mb-0">Faster loading times</p>
          </div>
          <h2 class="mt-4 mt-sm-6">How?</h2>
          <div class="d-flex align-center pt-2 py-sm-2 pr-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="#3C82F6"
              width="28"
              height="28"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>

            <p class="ml-3 mb-0">Same user account, same data. Just log in.</p>
          </div>
        </v-col>
      </v-row>
      <v-card-actions class="px-4">
        <v-row no-gutters>
          <v-col cols="12" sm="6" class="pa-2">
            <v-btn block text @click="closeDialog">I'll check it out later</v-btn>
          </v-col>
          <v-col cols="12" sm="6" class="pa-2">
            <v-btn
              block
              color="primary"
              class="align-self-center"
              :href="migrationMovedTo"
            >
              Go to the New Web App
              <v-icon right>mdi-arrow-right</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import { AppLocalStorage } from '@/utils/localStorage'
import { useFE2Messaging } from '@/main/lib/core/composables/server'

export default {
  setup() {
    return { ...useFE2Messaging() }
  },
  data: () => ({
    dialog: true
  }),
  methods: {
    closeDialog() {
      AppLocalStorage.set('newSpeckleDialogDismissed', 'true')
      this.dialog = false
    }
  }
}
</script>
<style scoped lang="scss">
.v-application {
  .whats-new-dialog {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
      sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol' !important;
    .headline {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
        Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol' !important;
    }
    .v-btn {
      text-transform: unset !important;
      letter-spacing: unset !important;
    }
  }
}
</style>
