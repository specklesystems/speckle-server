<template>
  <div class="hud-gun">
    <div class="hud-gun__inner" :style="style" />
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'ShooterHudGun',
  setup() {
    const showFire = ref(false)

    const style = computed(() => ({
      backgroundPosition: showFire.value ? '0 -172px' : '0 -65px'
    }))

    document.addEventListener('click', () => {
      showFire.value = true
      setTimeout(() => {
        showFire.value = false
      }, 100)
    })

    return {
      style
    }
  }
})
</script>
<style lang="scss">
.hud-gun {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -12px;
  height: 100px;

  display: flex;
  justify-content: center;

  &__inner {
    // background-color: red;
    background-image: url('~~@/assets/viewer/shooter/guns.png');
    background-repeat: no-repeat;

    position: relative;
    bottom: 133px;

    width: 130px;
    height: 101px;

    transform: scale(5);
  }
}
</style>
