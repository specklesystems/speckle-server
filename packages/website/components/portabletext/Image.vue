<template>
  <div class="">
    <img :src="imgSource" class="h-96 mx-auto" />
  </div>
</template>
<script setup lang="ts">
const app = useNuxtApp()
const props = defineProps<{ value: Record<string, unknown> }>()
const imgSource = app.$urlForImage(props.value)
</script>
