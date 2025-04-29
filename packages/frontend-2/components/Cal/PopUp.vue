<template>
  <div
    :data-cal-link="calLink"
    :data-cal-namespace="calNamespace"
    :data-cal-config="callOptions"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from '~~/lib/core/composables/theme'
import { initCalWidget } from '~/lib/cal/cal'
import { calNamespace, calLink } from '~/lib/cal/helpers/constants'

const { isDarkTheme } = useTheme()

onMounted(() => {
  initCalWidget({
    namespace: calNamespace,
    mode: 'element-click',
    theme: isDarkTheme.value ? 'dark' : 'light'
  })
})

const callOptions = computed(() => {
  return JSON.stringify({
    layout: 'month_view'
  })
})
</script>
