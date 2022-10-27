<template>
  <v-btn class="primary" icon small @click="onShareClicked">
    <v-icon small>mdi-share-variant</v-icon>
  </v-btn>
</template>
<script setup lang="ts">
const emit = defineEmits(['share'])
const onShareClicked = () => emit('share')
</script>
