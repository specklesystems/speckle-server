<template>
  <div class="flex flex-col space-y-2">
    <div class="px-2 mt-2">
      <FormButton to="/" size="sm" :icon-left="ArrowLeftIcon">Home</FormButton>
      <p class="h5">Document info</p>
      <p class="text-sm text-foreground-2 py-2">
        Current document info. This should change on document swaps, closure, opening,
        etc.
      </p>
      <div class="text-xs mx-3 p-4 rounded shadow-inner overflow-auto simple-scrollbar">
        <pre>{{ documentInfo }}</pre>
      </div>
    </div>
    <div class="px-2">
      <p class="h5">Send Filters</p>
      <p class="text-sm text-foreground-2 space-x-2">Available send filters:</p>
      <div class="space-y-2 my-2">
        <div v-for="filter in sendFilters" :key="filter.name">
          <div>
            <span
              class="rounded-full text-xs px-2 bg-primary text-foreground-on-primary mr-2"
            >
              {{ filter.name }}
            </span>
            <span class="text-xs text-foreground-2">{{ filter.summary }}</span>
          </div>
        </div>
      </div>
      <div
        class="text-xs mx-3 p-4 rounded shadow-inner overflow-auto simple-scrollbar max-h-20"
      >
        <pre>{{ sendFilters }}</pre>
      </div>
    </div>
    <div class="px-2">
      <p class="h5 mb-4">Chromium 65 Scrollable Dialogs Test</p>
      <FormButton @click="showBigDialog = !showBigDialog">Show Big Dialog</FormButton>
      <CommonDialog v-model:open="showBigDialog" title="hello" fullscreen="none">
        <div class="bg-purple-500" style="height: 2000px">
          This is a test for chromium 65. If this is not scrollable, something is wrong!
        </div>
      </CommonDialog>
    </div>
    <div class="px-2">
      <p class="h5">Selection info</p>
      <p class="text-sm text-foreground-2 py-2">
        Selection info. This should change in real time based on user selection, but
        there's an imperative method too in case that's impossible.
      </p>
      <div
        class="text-xs mx-3 p-4 rounded shadow-inner overflow-auto simple-scrollbar max-h-40"
      >
        <div v-if="!hasSelectionBinding" class="text-danger mb-2">
          No selection binding registered.
        </div>
        <pre>{{ selectionInfo }}</pre>
      </div>
    </div>
    <div class="px-2">
      <p class="h5">Document State</p>
      <p class="text-sm text-foreground-2 py-2">
        What state is in this document (currently just model cards).
      </p>
      <div
        class="text-xs mx-3 p-4 rounded shadow-inner overflow-auto simple-scrollbar max-h-40"
      >
        <div class="text-info mb-2">
          There are currently {{ totalModelCount }} model card(s).
        </div>
        <pre>{{ projectModelGroups }}</pre>
      </div>
    </div>
    <div class="px-2">
      <p class="h5">Binding tests</p>
      <p class="text-sm text-foreground-2 py-2">
        Do not expect these to save the day. They are just some
        <b class="text-foreground-primary">minor sanity checks</b>
        .
      </p>
    </div>
    <FormButton
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
import { storeToRefs } from 'pinia'
import { ArrowLeftIcon, CheckIcon, MinusIcon, XMarkIcon } from '@heroicons/vue/20/solid'
import type { TestEventArgs } from '~/lib/bindings/definitions/ITestBinding'
import { useHostAppStore } from '~/store/hostApp'
import { useSelectionStore } from '~/store/selection'

const showBigDialog = ref(false)

const { $testBindings } = useNuxtApp()

const store = useHostAppStore()

const { documentInfo, sendFilters, projectModelGroups } = storeToRefs(store)

const totalModelCount = computed(() => {
  let count = 0
  for (const pmg of projectModelGroups.value) {
    count += pmg.senders.length
    count += pmg.receivers.length
  }
  return count
})

const selectionStore = useSelectionStore()
const { selectionInfo, hasBinding: hasSelectionBinding } = storeToRefs(selectionStore)

await store.refreshSendFilters()

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
      } catch {
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
    const myTest = tests.value.find((t) => t.name === 'Simple event capture')

    if (!myTest) return
    myTest.status = 1
    myTest.result = 'got an event back, we are okay'
  }, 1000)
})

$testBindings.on('testEvent', (args: TestEventArgs) => {
  setTimeout(() => {
    const myTest = tests.value.find((t) => t.name === 'Event capture with args')

    if (!myTest) return
    myTest.status = 1
    myTest.result = args
  }, 1000)
})
</script>
