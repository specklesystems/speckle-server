<template>
  <v-dialog
    v-model="dialogModel"
    :fullscreen="$vuetify.breakpoint.xsOnly"
    :max-width="maxWidth"
  >
    <v-card>
      <!-- Header -->
      <v-toolbar color="primary" dark flat>
        <v-app-bar-nav-icon style="pointer-events: none">
          <slot name="icon">
            <v-icon>mdi-information</v-icon>
          </slot>
        </v-app-bar-nav-icon>
        <v-toolbar-title>
          <slot name="title">Title</slot>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="close"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>

      <!-- Body -->
      <v-card-text class="pt-5">
        <slot name="content">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
          nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
          eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
          in culpa qui officia deserunt mollit anim id est laborum.
        </slot>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="px-6 pb-5 pt-0">
        <slot name="actions">
          <v-spacer></v-spacer>
          <v-btn text @click="close">Cancel</v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { computed, defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseDialog',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    maxWidth: {
      type: Number,
      default: 500
    }
  },
  setup(props, { emit }) {
    const dialogModel = computed({
      get: () => props.show,
      set: (newVal) => emit('update:show', newVal)
    })

    const close = () => (dialogModel.value = false)

    return { dialogModel, close }
  }
})
</script>
