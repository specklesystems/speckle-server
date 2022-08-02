<template>
  <v-snackbar v-model="snack" app bottom :color="color" timeout="5000">
    {{ text }}
    <template #action="{}">
      <v-btn v-if="actionName" :to="to" small @click="snack = false">
        {{ actionName }}
      </v-btn>
      <v-btn small icon @click="snack = false">
        <v-icon small>mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>
<script lang="ts">
import { Nullable } from '@/helpers/typeHelpers'
import Vue from 'vue'
import {
  GlobalEvents,
  NotificationEventPayload,
  ToastNotificationType
} from '@/main/lib/core/helpers/eventHubHelper'

export default Vue.extend({
  name: 'GlobalToast',
  data() {
    return {
      snack: false,
      text: null as Nullable<string>,
      actionName: null as Nullable<string>,
      to: null as Nullable<string>,
      type: 'primary' as ToastNotificationType
    }
  },
  computed: {
    color(): ToastNotificationType {
      return this.type || 'primary'
    }
  },
  watch: {
    snack(newVal) {
      if (!newVal) {
        this.text = null
        this.actionName = null
        this.to = null
      }
    }
  },
  mounted() {
    this.$eventHub.$on(GlobalEvents.Notification, (args: NotificationEventPayload) => {
      this.snack = true
      this.text = args.text
      this.actionName = args.action ? args.action.name : null
      this.to = args.action ? args.action.to : null
      this.type = args.type || 'primary'
    })
  }
})
</script>
