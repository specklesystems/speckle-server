<template>
  <div
    :class="`fixed max-h-[calc(100vh-5.5rem)] top-[4.5rem] px-[2px] right-4 rounded-md mb-4 transition-[width,opacity] ease-in-out duration-75 bg-foundation p-2 text-tiny overflow-y-auto simple-scrollbar ${
      true ? 'w-80 opacity-100' : 'w-0 opacity-0'
    }`"
  >
    <pre>{{ selectedObject }}</pre>
  </div>
</template>
<script setup lang="ts">
const selectedObject = { test: 'world' }
</script>
