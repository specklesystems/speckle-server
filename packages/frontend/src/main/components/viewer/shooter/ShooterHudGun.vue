<template>
  <div class="hud-gun">
    <div class="hud-gun__inner" />
  </div>
</template>
<script lang="ts"></script>
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
    background-image: url('~~@/assets/viewer/shooter/guns.png');
    background-repeat: no-repeat;
    background-position: 0 -65px;

    width: 130px;
    height: 85px;

    transform: scale(5);
  }
}
</style>
