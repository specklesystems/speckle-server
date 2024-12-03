<template>
  <div class="flex flex-col space-y-2 px-4">
    <div v-for="testName in testNames" :key="testName" class="space-y-2">
      <FormButton full-width color="outline" @click="invokeTest(testName)">
        Run: {{ testName }}
      </FormButton>
      <div class="text-xs">
        <pre>todo: test results</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const app = useNuxtApp()
const hostAppTestBinding = app.$hostAppTestBiding

const testNames = ref<string[]>(await hostAppTestBinding.getTests())
const invokeTest = async (testName: string) => {
  await hostAppTestBinding.executeTest(testName)
}

hostAppTestBinding.on('setTestResult', (result) => {
  console.log(result)
  // TODO: place it in the right place
})
</script>
