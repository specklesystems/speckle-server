<template>
  <div class="d-flex flex-column">
    <v-switch
      v-model="isPublicModel"
      inset
      :label="isPublicModel ? 'Link Sharing On' : 'Link Sharing Off'"
      :hint="
        isPublicModel
          ? 'Anyone with the link can view this stream. It is also visible on your profile page. Only collaborators can push data to it.'
          : 'Only collaborators can access this stream.'
      "
      persistent-hint
      :disabled="disabled"
      class="visibility-toggle"
    />
    <v-switch
      v-model="isDiscoverableModel"
      inset
      :label="isDiscoverableModel ? 'Discoverable' : 'Not Discoverable'"
      :hint="
        isDiscoverableModel
          ? 'This stream can be found on public stream discovery pages'
          : 'This stream is not shown on any public stream discovery pages'
      "
      persistent-hint
      :disabled="disabled || !isPublicModel"
      class="visibility-toggle"
    />
  </div>
</template>
<script lang="ts">
import Vue, { computed } from 'vue'
export default Vue.extend({
  name: 'StreamVisibilityToggle',
  props: {
    isPublic: {
      type: Boolean,
      required: true
    },
    isDiscoverable: {
      type: Boolean,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const isPublicModel = computed({
      get: () => props.isPublic,
      set: (val) => {
        emit('update:isPublic', val)
        if (!val) {
          isDiscoverableModel.value = false
        }
      }
    })

    const isDiscoverableModel = computed({
      get: () => props.isDiscoverable && isPublicModel.value,
      set: (val) => {
        if (!isPublicModel.value) {
          val = false
        }

        emit('update:isDiscoverable', val)
      }
    })

    return { isPublicModel, isDiscoverableModel }
  }
})
</script>
<style scoped lang="scss">
.visibility-toggle {
  // incase hint breaks up in 2 lines
  min-height: 60px;
}
</style>
