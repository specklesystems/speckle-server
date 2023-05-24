<template>
  <div>
    <div v-if="isAppErrorState && showBanner" class="app-error-state">
      <div class="app-error-state__wrapper">
        <div>
          Due to a large amount of errors some functionality has been disabled! Please
          reload the page or contact the server administrators.
        </div>
        <div>
          <v-btn v-tooltip="'Close banner'" icon @click="hideErrorStateBanner">
            <v-icon class="app-error-state__icon">mdi-close-circle</v-icon>
          </v-btn>
        </div>
      </div>
    </div>
    <router-view></router-view>
  </div>
</template>
<script setup lang="ts">
import { isErrorState } from '@/main/lib/core/utils/appErrorStateManager'
import { computed, ref } from 'vue'

const showBanner = ref(true)
const isAppErrorState = computed(() => isErrorState())
const hideErrorStateBanner = () => (showBanner.value = false)
</script>
<style lang="css">
.v-timeline:before {
  top: 40px !important;
}

.app-error-state {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  background-color: red;
  z-index: 1000;
  padding: 8px;
  font-family: 'Roboto', sans-serif !important;
  color: white;
}

.app-error-state__wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-error-state__icon {
  color: white !important;
}
</style>
