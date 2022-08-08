<template>
  <div>
    <router-view></router-view>
    <global-toast />
    <global-loading />
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'

/**
 * A very basic layout that does the core required setup, but doesn't add any navbars, menus or anything. Can be used
 * for embed or other simplified pages.
 */

export default defineComponent({
  name: 'TheBasic',
  components: {
    GlobalToast: () => import('@/main/components/common/GlobalToast.vue'),
    GlobalLoading: () => import('@/main/components/common/GlobalLoading.vue')
  }
})
</script>
