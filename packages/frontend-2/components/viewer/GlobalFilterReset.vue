<template>
  <div
    v-show="hasAnyFiltersApplied"
    class="bg-pink-300/0 flex justify-center items-center pointer-events-none"
  >
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <FormButton
        :size="isEmbedEnabled ? 'xs' : 'sm'"
        class="pointer-events-auto"
        @click="trackAndResetFilters"
      >
        Reset Filters
      </FormButton>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'

const {
  resetFilters,
  filters: { hasAnyFiltersApplied }
} = useFilterUtilities()

const { isEnabled: isEmbedEnabled } = useEmbed()
const mp = useMixpanel()
const trackAndResetFilters = () => {
  resetFilters()
  mp.track('Viewer Action', { type: 'action', name: 'filters', action: 'reset' })
}
</script>
