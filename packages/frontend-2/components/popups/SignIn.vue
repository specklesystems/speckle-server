<template>
  <AuthLoginPanel
    v-model:open="showDialog"
    dialog-mode
    max-width="sm"
    subtitle="Create a free account to keep using Speckle!"
    :hide-closer="dialogOpenCount >= 3"
    :prevent-close-on-click-outside="dialogOpenCount >= 3"
  />
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { debounce } from 'lodash-es'
import { useEmbedState } from '~~/lib/viewer/composables/setup/embed'

const { activeUser } = useActiveUser()
const logger = useLogger()
const route = useRoute()
const { embedOptions } = useEmbedState()

const showDialogBase = ref(false)
const clickyCounts = ref(0)
let clicksToOpenDialog = 6

const showDialog = computed({
  get: () => showDialogBase.value,
  set: (newVal) => {
    if (newVal && route.fullPath.startsWith('/error')) {
      return
    }

    showDialogBase.value = newVal
  }
})

watch(clickyCounts, (newVal) => {
  if (activeUser.value) return
  if (newVal < clicksToOpenDialog) return
  clickyCounts.value = 0
  showDialog.value = true
  clicksToOpenDialog *= 2
})

const countClicks = () => {
  if (!embedOptions.value.isEnabled) {
    logger.debug({
      clickyCounts: clickyCounts.value,
      clicksToOpenDialog,
      dialogOpenCount: dialogOpenCount.value
    })
    clickyCounts.value++
  }
}

const debouncedCounter = debounce(countClicks, 100)

// After three dialog opens, we disallow its closing
const dialogOpenCount = ref(0)
watch(showDialog, (newVal) => {
  if (!newVal) return
  dialogOpenCount.value++
})

onMounted(() => {
  if (activeUser.value) return
  // Note: not using the vue use equivalent as it does not detect viewer clicks
  // Note: viewer eevnt handlers seem to prevent default on right clicks
  document.addEventListener('click', countClicks)
  document.addEventListener('touchstart', countClicks)
  document.addEventListener('scroll', debouncedCounter)
})

onUnmounted(() => {
  if (activeUser.value) return
  document.removeEventListener('click', countClicks)
  document.removeEventListener('touchstart', countClicks)
  document.removeEventListener('scroll', debouncedCounter)
})
</script>
