<template lang="html">
  <div class="fixed-overlay">
    <img src="@/assets/logo.svg" class="overlay-logo tada" />
  </div>
</template>

<script>
export default {}
</script>

<style lang="scss">
.fixed-overlay {
  width: 100vw;
  height: 100vh;
  font-family: sans-serif !important;
  background-color: white;
  z-index: 100;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  text-align: center;
  font-weight: 400;
  font-size: 10px;
}

.overlay-logo {
  max-width: 50px;
  position: relative;
  top: 250px;
}
</style>
