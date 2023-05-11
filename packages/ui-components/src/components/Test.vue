<template>
  <div>Hello world! {{ test }}</div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getResult } from '../helpers/test.js'

const test = ref('hello')

onMounted(() => {
  test.value = test.value + '2' + getResult()
})
</script>
