<template>
  <div>
    <div
      v-if="isErrorState && showBanner"
      class="fixed inset-x-0 top-0 p-2 z-[1000] bg-danger text-foundation flex justify-between items-center"
    >
      <div>
        Due to a large amount of errors some functionality has been disabled! Please
        reload the page or contact the server administrators.
      </div>
      <div>
        <FormButton
          hide-text
          :icon-left="XMarkIcon"
          color="outline"
          text
          size="lg"
          @click="hideErrorStateBanner"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/solid'
import { useAppErrorState } from '~~/lib/core/composables/error'

const { isErrorState } = useAppErrorState()

const showBanner = ref(true)

const hideErrorStateBanner = () => (showBanner.value = false)
</script>
