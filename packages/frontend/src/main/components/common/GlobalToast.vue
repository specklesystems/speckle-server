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
import { defineComponent } from 'vue'
import { setupGlobalToast } from '@/main/lib/core/composables/notifications'

export default defineComponent({
  name: 'GlobalToast',
  setup() {
    const globalToastData = setupGlobalToast()
    return {
      ...globalToastData
    }
  }
})
</script>
