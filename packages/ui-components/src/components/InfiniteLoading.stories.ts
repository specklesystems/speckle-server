import { wait } from '@speckle/shared'
import type { Meta, StoryObj } from '@storybook/vue3'
import { computed, ref } from 'vue'
import InfiniteLoading from '~~/src/components/InfiniteLoading.vue'
import type { InfiniteLoaderState } from '~~/src/helpers/global/components'

export default {
  component: InfiniteLoading,
  parameters: {
    docs: {
      description: {
        component: 'Infinite loader built on top of v3-infinite-loading'
      }
    }
  }
} as Meta

type FakePaginationItem = {
  id: string
  title: string
}

const buildStory = (
  params?: Partial<{ throwError: boolean; allowRetry: boolean }>
): StoryObj => ({
  render: (args) => ({
    components: { InfiniteLoading },
    setup() {
      const itemsLimit = ref(5)
      const items = ref([] as FakePaginationItem[])
      const moreToLoad = computed(() => items.value.length < itemsLimit.value)

      const loadMore = async () => {
        await wait(1000)

        if (params?.throwError) {
          throw new Error('Simulated loading failure')
        }

        const newNumber = items.value.length + 1
        items.value.push({
          id: `id-${newNumber}`,
          title: `Item #${newNumber}`
        })
      }

      const infiniteLoad = async (state: InfiniteLoaderState) => {
        if (!moreToLoad.value) return state.complete()

        try {
          await loadMore()
        } catch (e) {
          console.error(e)
          state.error()
          return
        }

        state.loaded()
        if (!moreToLoad.value) {
          state.complete()
        }
      }

      return { args, infiniteLoad, items, moreToLoad, itemsLimit }
    },
    template: `
      <div>
        <div v-for="item in items" :key="item.id">
          {{ item }}
        </div>
        <InfiniteLoading @infinite="infiniteLoad" v-bind="args"/>
      </div>
    `
  }),
  args: {
    allowRetry: params?.allowRetry || false,
    settings: {}
  }
})

export const Default: StoryObj = buildStory()

export const WithError: StoryObj = buildStory({ throwError: true })

export const WithRetry: StoryObj = buildStory({ throwError: true, allowRetry: true })
