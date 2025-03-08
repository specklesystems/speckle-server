<template>
  <div
    class="relative my-10 py-20 z-0 w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]"
  >
    <h3 class="text-4xl font-bold tracking-tight text-center mb-10">
      Made for teams who like to move fast.
    </h3>
    <dl
      class="grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-3 divide-x-2 divide-outline-3 divide-dashed"
    >
      <div v-for="(stat, index) in stats" :key="index" class="flex flex-col p-8">
        <div class="text-body text-foreground-2">{{ stat.name }}</div>
        <div
          class="order-first text-heading-2xl font-semibold tracking-tight text-foreground-2"
        >
          {{ stat.value }}
        </div>
      </div>
    </dl>
  </div>
</template>
<script setup>
const stats = [
  // { name: 'Creators on the platform', value: '8,000+' },
  { name: 'Faster design exchanges', value: '200%' },
  { name: 'Uptime guarantee', value: '99.9%' },
  { name: 'Saved per month', value: '10h' }
]
</script>
