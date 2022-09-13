<template>
  <div class="hud">
    <div class="hud__left">
      Health:
      <br />
      {{ shooterState.health }}/100
    </div>
    <div class="hud__middle">
      <shooter-hud-face />
    </div>
    <div class="hud__right">
      <v-btn color="primary" class="mb-1" @click="onRestart">Restart</v-btn>
      <v-btn color="red" to="/">Quit</v-btn>
    </div>
    <div class="d-none">
      <audio :src="MusicURL" controls autoplay loop />
    </div>
  </div>
</template>
<script lang="ts">
import { ViewerShooterDataDocument } from '@/graphql/generated/graphql'
import { resetShooterState } from '@/main/lib/viewer/commit-object-viewer/stateManager'
import { useQuery } from '@vue/apollo-composable'
import { computed, defineComponent } from 'vue'
import ShooterHudFace from '@/main/components/viewer/shooter/ShooterHudFace.vue'
import MusicURL from '@/assets/viewer/shooter/music.mp3'

export default defineComponent({
  name: 'ShooterHud',
  components: {
    ShooterHudFace
  },
  setup() {
    const { result: viewerStateResult } = useQuery(ViewerShooterDataDocument)
    const shooterState = computed(
      () => viewerStateResult.value?.commitObjectViewerState.shooter
    )

    return { shooterState, MusicURL }
  },
  methods: {
    onRestart() {
      resetShooterState()
    }
  }
})
</script>
<style scoped lang="scss">
.hud {
  background-color: rgba(27, 29, 32, 0.5);
  width: 100%;
  position: relative;
  bottom: -12px;

  padding: 16px;
  height: 200px;
  display: flex;
  align-items: center;

  &__left {
    text-align: center;
    font-size: 2em;
  }

  &__middle {
    display: flex;
    align-items: center;
    justify-content: start;
    flex-grow: 1;
  }

  &__right {
    display: flex;
    flex-direction: column;
  }
}
</style>
