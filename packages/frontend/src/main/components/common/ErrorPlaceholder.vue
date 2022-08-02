<template>
  <page-placeholder>
    <template #image>
      <v-img
        v-if="!errorType"
        contain
        max-height="200"
        src="@/assets/emptybox.png"
      ></v-img>
      <v-img
        v-else-if="errorType == 'access'"
        contain
        max-height="200"
        src="@/assets/lockbox.png"
      ></v-img>
      <v-img
        v-else-if="errorType == '404'"
        contain
        max-height="200"
        src="@/assets/404box.png"
      ></v-img>
    </template>
    <template #actions>
      <slot name="actions">
        <v-list rounded class="transparent">
          <v-list-item
            link
            class="primary mb-4 no-overlay"
            dark
            :to="`${
              $route.params.streamId && errorType !== '404' && errorType !== 'access'
                ? '/streams/' + $route.params.streamId
                : '/'
            }`"
          >
            <v-list-item-icon>
              <v-icon>mdi-home</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Home</v-list-item-title>
              <v-list-item-subtitle class="caption">
                Go to the homepage
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </slot>
    </template>
    <template #default>
      <slot name="default" />
    </template>
  </page-placeholder>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import PagePlaceholder from '@/main/components/common/PagePlaceholder.vue'

type ErrorType = 'access' | '404' | null

export default defineComponent({
  name: 'ErrorPlaceholder',
  components: {
    PagePlaceholder
  },
  props: {
    errorType: {
      type: String as PropType<ErrorType>,
      default: null
    }
  }
})
</script>
<style scoped>
.no-overlay.v-list-item--active::before {
  opacity: 0 !important;
}
.no-overlay.v-list-item--active {
  color: white !important;
}
</style>
