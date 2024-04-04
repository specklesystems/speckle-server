<template>
  <div
    class="bg-foundation-focus text-primary font-bold h-10 w-10 rounded-full shrink-0 flex justify-center text-center items-center overflow-hidden select-none"
  >
    <img v-if="finalLogo" :src="finalLogo" alt="Function logo" class="h-10 w-10" />
    <span v-else>λ</span>
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { cleanFunctionLogo } from '~/lib/automations/helpers/functions'

const props = defineProps<{
  logo?: MaybeNullOrUndefined<string>
}>()

const finalLogo = computed(() => cleanFunctionLogo(props.logo))
</script>
