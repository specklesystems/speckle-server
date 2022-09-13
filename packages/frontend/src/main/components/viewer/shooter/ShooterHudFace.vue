<template>
  <div class="hud-face" :style="style" />
</template>
<script lang="ts">
import { ViewerShooterDataDocument } from '@/graphql/generated/graphql'
import { useQuery } from '@vue/apollo-composable'
import { computed, defineComponent, ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'

export default defineComponent({
  name: 'ShooterHudFace',
  setup() {
    const { result: viewerStateResult } = useQuery(ViewerShooterDataDocument)
    const shooterState = computed(
      () => viewerStateResult.value?.commitObjectViewerState.shooter
    )

    const faceWidth = 146
    const faceHeight = 183
    const columns = 6
    // const rows = 5

    const column = ref(0)
    const row = ref(0)

    useIntervalFn(() => {
      const newCol = column.value + 1
      column.value = newCol >= columns ? 0 : newCol

      // const newRow = row.value + 1
      // row.value = newRow >= rows ? 0 : newRow
    }, 1000)

    const backgroundPosition = computed(() => {
      const xStr = `-${column.value * faceWidth}px`
      const yStr = `-${row.value * faceHeight}px`

      return `${xStr} ${yStr}`
    })

    const style = computed(() => `background-position: ${backgroundPosition.value}`)

    return { shooterState, style }
  }
})
</script>
<style lang="scss">
.hud-face {
  $faceWidth: 146px;
  $faceHeight: 185px;

  background-image: url('~~@/assets/viewer/shooter/faces.png');
  background-repeat: no-repeat;

  width: $faceWidth;
  height: $faceHeight;
}
</style>
