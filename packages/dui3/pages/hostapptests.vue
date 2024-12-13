<template>
  <div class="max-w-full px-2">
    <div class="flex flex-col space-y-2 px-4 mb-4">
      <div
        v-for="test in modelTests"
        :key="test.name"
        class="bg-foundation shadow p-2 rounded text-foreground"
      >
        <div class="flex min-w-0 space-x-2">
          <div class="rounded-md p-1 text-xs bg-blue-500/20 text-xs font-semibold w-24">
            {{ test.status }}
          </div>
          <div class="truncate">{{ test.name }}</div>
        </div>
        <div
          v-if="test.result"
          class="text-xs text-foreground-2 max-w-full overflow-hidden"
        >
          ran at {{ test.result?.timeStamp }}
        </div>
      </div>
      <FormButton full-width @click="invokeTests()">Run All</FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModelTest } from 'lib/bindings/definitions/IHostAppTestBinding'

const app = useNuxtApp()

const hostAppTestBinding = app.$hostAppTestBiding
const modelTests = ref<ModelTest[]>([])
modelTests.value = await hostAppTestBinding.getTests()

const invokeTests = async () => {
  const testResults = await hostAppTestBinding.getTestsResults()
  for (const res of testResults) {
    const myTest = modelTests.value.find((t) => t.name === res.name)
    if (!myTest) continue
    myTest.result = res
    myTest.status = res.status
  }
}
</script>
