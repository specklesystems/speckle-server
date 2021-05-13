<template lang="html">
  <div class="fixed-overlay" :class="error ? 'primary' : 'white'">
    <img v-if="!error" src="@/assets/logo.svg" class="overlay-logo tada" />
    <div v-else>
      <v-icon size="120" color="white tada">mdi-alert</v-icon>
      <h1 class="pt-6 pb-3">Ooops! 😅</h1>
      <h2>{{ error }}</h2>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SpeckleLoading',
  props: {
    error: {
      type: String,
      default: null
    }
  }
}
</script>

<style lang="scss">
.fixed-overlay {
  width: 100vw;
  height: 100vh;
  font-family: sans-serif !important;
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
  padding-top: 200px;
}

.overlay-logo {
  max-width: 50px;
  position: relative;
  top: 150px;
}
</style>
