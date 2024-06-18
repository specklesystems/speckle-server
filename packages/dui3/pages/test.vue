<template>
  <div class="flex flex-col space-y-2">
    <Portal to="navigation">
      <FormButton to="/" size="sm" :icon-left="ArrowLeftIcon" class="ml-2">
        Back home
      </FormButton>
    </Portal>
    <div>
      <p class="text-sm text-foreground-2 py-2 px-2">
        Do not expect these to save the day. They are just some
        <b class="text-foreground-primary">minor sanity checks</b>
        .
      </p>
    </div>
    <FormButton
      size="xl"
      color="card"
      full-width
      class="sticky top-10 top-16"
      @click="runTests()"
    >
      Run Tests
    </FormButton>
    <div
      v-for="test in tests"
      :key="test.name"
      class="py-2 px-2 bg-foundation shadow hover:shadow-lg transition rounded-lg text-xs"
    >
      <div class="flex space-x-2">
        <div>
          <MinusIcon v-if="test.status === 0" class="w-4 h-4 text-primary" />
          <CheckIcon v-if="test.status === 1" class="w-4 h-4 text-success" />
          <XMarkIcon v-if="test.status === 2" class="w-4 h-4 text-danger" />
        </div>
        <div>{{ test.name }}</div>
      </div>
      <div class="text-xs max-w-full overflow-x-scroll simple-scrollbar py-2">
        <pre>{{ test }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftIcon, CheckIcon, MinusIcon, XMarkIcon } from '@heroicons/vue/20/solid'
import type { TestEventArgs } from '~/lib/bindings/definitions/ITestBinding'
const { $testBindings } = useNuxtApp()

const tests = ref([
  {
    name: 'Simple call with parameters',
    test: async (): Promise<unknown> => {
      await $testBindings.sayHi('Speckle', 3, false)
      return 'ok'
    },
    status: 0,
    result: {} as unknown
  },
  {
    name: 'Simple call with invalid parameters',
    test: async (): Promise<unknown> => {
      try {
        await (
          $testBindings as unknown as {
            sayHi: (name: string, count: number) => Promise<string>
          }
        ).sayHi('Speckle', 0) // note, invalid on purpose, it looks long because ts needs to be happy
        return 'not ok'
      } catch (e) {
        return 'ok'
      }
    },
    status: 0,
    result: {} as unknown
  },
  {
    name: 'Simple function call with no args and no result',
    test: async (): Promise<unknown> => {
      const res = await $testBindings.goAway()
      return res === null || res === undefined ? 'ok' : 'not ok'
    },
    status: 0,
    result: {} as unknown
  },
  {
    name: 'Get a more complicated object from a method call',
    test: async (): Promise<unknown> => {
      const res = await $testBindings.getComplexType()
      const key = Object.keys(res)[0]

      return key.toLowerCase()[0] === key[0] ? 'ok' : 'serialization gone wrong'
    },
    status: 0,
    result: {} as unknown
  },
  {
    name: 'Simple event capture',
    test: async () => {
      await $testBindings.triggerEvent('emptyTestEvent')
      return 'not ok'
    },
    status: 0,
    result: 'not run yet' as unknown
  },
  {
    name: 'Event capture with args',
    test: async () => {
      await $testBindings.triggerEvent('testEvent')
      return 'not ok'
    },
    status: 0,
    result: 'not run yet' as unknown
  }
])

const runTests = async () => {
  for (const test of tests.value) {
    test.result = null
    test.status = 0
  }
  for (const test of tests.value) {
    try {
      const res = await test.test()
      if (res === 'ok') {
        test.status = 1
      } else {
        test.status = 2
      }
      test.result = res
    } catch (e) {
      test.status = 2
      test.result = e
    }
  }
}

$testBindings.on('emptyTestEvent', () => {
  setTimeout(() => {
    console.log('sketchup sent event back', 'emptyTestEvent')

    const myTest = tests.value.find((t) => t.name === 'Simple event capture')
    console.log(myTest, 'myTest')

    if (!myTest) return
    myTest.status = 1
    myTest.result = 'got an event back, we are okay'
  }, 300)
})

$testBindings.on('testEvent', (args: TestEventArgs) => {
  setTimeout(() => {
    console.log(args, 'testEvent')
    const myTest = tests.value.find((t) => t.name === 'Event capture with args')
    console.log(myTest, 'myTest')
    if (!myTest) return
    myTest.status = 1
    myTest.result = args
  }, 300)
})
</script>
