<template>
  <svg width="120" height="120" viewBox="0 0 120 120" style="height: 95%; width: 95%">
    <circle cx="60" cy="60" r="40" fill="none" stroke="#e6e6e6" stroke-width="12" />
    <circle
      class="base xxxpercent xxxfailed stroke-red-400 origin-center"
      :style="`${styles.failed}`"
      cx="60"
      cy="60"
      r="40"
      fill="none"
      stroke-width="25"
      pathLength="100"
    />
    <circle
      class="base xxxpercent xxxsuccess stroke-green-400 origin-center"
      :style="`${styles.passed}`"
      cx="60"
      cy="60"
      r="40"
      fill="none"
      stroke-width="25"
      pathLength="100"
    />
    <circle
      class="base xxxpercent xxxinprogress stroke-amber-400 origin-center"
      :style="`${styles.inProgress}`"
      cx="60"
      cy="60"
      r="40"
      fill="none"
      stroke-width="25"
      pathLength="100"
    />
  </svg>
</template>
<script setup lang="ts">
const props = defineProps<{
  summary: { failed: number; passed: number; inProgress: number; total: number }
}>()

// segment: percentage + offset, where offset = prev percentage in radians

const styles = computed(() => {
  const failed = (props.summary.failed / props.summary.total) * 100
  const offsetFailed = 0
  const passed = (props.summary.passed / props.summary.total) * 100
  const offsetPassed = 360 * (failed / 100)
  const inProgress = (props.summary.inProgress / props.summary.total) * 100
  const offsetInProgress = offsetPassed + 360 * (passed / 100)

  const stylePack = {
    failed: `stroke-dashoffset: ${
      100 - failed
    }; transform: rotate(${offsetFailed}deg);`,
    passed: `stroke-dashoffset: ${
      100 - passed
    }; transform: rotate(${offsetPassed}deg);`,
    inProgress: `stroke-dashoffset: ${
      100 - inProgress
    }; transform: rotate(${offsetInProgress}deg);`
  }

  return stylePack
})
</script>
<style scoped>
.base {
  stroke-dasharray: 100;
  transform-origin: center;
}

.percent {
  stroke-dasharray: 100;
  stroke-dashoffset: calc(100 - var(--val));
}

.failed {
  --val: 25;
  transform: rotate(0deg);
}

.success {
  --val: 50;
  transform: rotate(90deg);
}

.inprogress {
  --val: 25;
  transform: rotate(270deg);
}
</style>
