<template>
  <button
    :data-cal-link="calLink"
    :data-cal-namespace="calNamespace"
    :data-cal-config="callOptions"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<script lang="ts" setup>
import { useTheme } from '~~/lib/core/composables/theme'
import { initCalWidget } from '~/lib/cal/cal'
import { calNamespace, calLink } from '~/lib/cal/helpers/constants'
import { useMixpanel } from '~~/lib/core/composables/mp'

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

const mixpanel = useMixpanel()

const onClick = () => {
  mixpanel.track('Booking Calendar Triggered', {
    location: 'sidebar'
  })
}
</script>
