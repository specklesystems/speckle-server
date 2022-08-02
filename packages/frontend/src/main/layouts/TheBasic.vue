<template>
  <v-app id="speckle">
    <v-main class="background">
      <router-view></router-view>
    </v-main>
    <global-toast />
    <global-loading />
  </v-app>
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
