<template>
  <div>Hello avatar!</div>
</template>
<script setup lang="ts">
import { Account } from '~/lib/bindings/definitions/baseBindings'

const props = defineProps<{
  userInfo: Account
}>()
</script>
