<template>
  <v-dialog v-model="dialog" persistent max-width="650px">
    <v-card class="whats-new-dialog">
      <div
        class="headline d-flex justify-space-between align-center px-4 py-3 rounded-b-0 shadow-0"
      >
        <h4>Heads Up! Moving to the New App</h4>
        <v-btn icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      <v-row no-gutters align="center" justify="space-between" class="pa-6 pb-0">
        <v-col cols="12">
          <p>
            To create a new account and enjoy the latest features,
            <strong>you'll be redirected to the new Speckle Web App.</strong>
          </p>
          <p>
            Once you have an account, you can always come back and use this interface if
            needed.
          </p>
        </v-col>
      </v-row>
      <v-card-actions class="px-4">
        <v-row no-gutters>
          <v-col cols="12" sm="6" class="pa-2">
            <v-btn block text @click="closeDialog">Cancel</v-btn>
          </v-col>
          <v-col cols="12" sm="6" class="pa-2">
            <v-btn
              block
              color="primary"
              class="align-self-center"
              :href="`${migrationMovedTo}/authn/register`"
            >
              Take me there
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
