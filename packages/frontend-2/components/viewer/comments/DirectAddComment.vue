<template>
  <div>
    <div class="px-1">
      <button
        v-tippy="'Add comment'"
        :class="`bg-foundation-2 outline outline-2 outline-primary rounded-tr-full rounded-tl-full rounded-br-full w-8 h-8 flex justify-center items-center hover:shadow-md`"
      >
        <PlusIcon :class="`w-5 h-5 text-primary`" />
      </button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { PlusIcon } from '@heroicons/vue/24/solid'
</script>
