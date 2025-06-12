<template>
  <div ref="calendarRef" style="width: 100%; height: 100%; overflow: scroll"></div>
</template>

<script lang="ts" setup>
import { useTheme } from '~~/lib/core/composables/theme'
import { initCalWidget } from '~/lib/cal/cal'
import { calNamespace, calLink } from '~/lib/cal/helpers/constants'

const { isDarkTheme } = useTheme()

const calendarRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!calendarRef.value) return

  initCalWidget({
    namespace: calNamespace,
    calLink,
    elementOrSelector: calendarRef.value,
    theme: isDarkTheme.value ? 'dark' : 'light'
  })
})
</script>
