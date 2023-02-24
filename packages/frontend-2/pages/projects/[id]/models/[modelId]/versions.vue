<template>
  <div class="text-2xl mt-14">
    This is a model
    <b>VERSIONS</b>
    page for model: {{ route.params.modelId }}
  </div>
</template>
<script setup lang="ts">
const route = useRoute()
</script>
