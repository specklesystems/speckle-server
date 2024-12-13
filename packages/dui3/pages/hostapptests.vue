<template>
  <div>
    <div class="flex flex-col space-y-2 px-4">
      <div :key="loadedModel" class="text-xs">
        {{ loadedModel }}
      </div>
    </div>
    <div class="flex flex-col space-y-2 px-4">
      <div v-for="test in modelTests" :key="test.name" class="space-y-2">
        <div class="text-xs">
          <pre>{{ test.status }} - {{ test.name }}</pre>
        </div>
      </div>
    </div>
    <div v-if="modelTests.length > 0" class="flex flex-col space-y-2 px-4">
      <FormButton full-width color="outline" @click="invokeTests()">Run All</FormButton>
    </div>
    <div class="flex flex-col space-y-2 px-4">
      <div v-for="result in modelResultsTests" :key="result.name" class="space-y-2">
        <div class="text-xs">
          <pre>{{ result.status }} - {{ result.name }} - {{ result.timeStamp }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  ModelTest,
  ModelTestResult
} from 'lib/bindings/definitions/IHostAppTestBinding'

const app = useNuxtApp()

const hostAppTestBinding = app.$hostAppTestBiding
let loadedModel = await hostAppTestBinding.getLoadedModel()
let tests: ModelTest[] = []
if (loadedModel?.length > 0) {
  tests = await hostAppTestBinding.getTests()
} else {
  loadedModel = '<No Loaded File>'
}
const modelTests = ref<ModelTest[]>(tests)

let resultsTests: ModelTestResult[] = []
const invokeTests = async () => {
  resultsTests = await hostAppTestBinding.getTestsResults()
}
const modelResultsTests = ref<ModelTestResult[]>(resultsTests)

hostAppTestBinding.on('setTestResult', (result) => {
  console.log(result)
  // TODO: place it in the right place
})
</script>
