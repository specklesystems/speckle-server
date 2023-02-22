<template>
  <v-list rounded class="transparent">
    <slot />
  </v-list>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'RoundedButtonList'
})
</script>
<style lang="scss" scoped>
:deep(.v-list-item:not(:last-of-type)) {
  margin-bottom: 16px !important;
}
</style>
