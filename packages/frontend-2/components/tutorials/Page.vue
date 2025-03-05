<template>
  <div>
    <div class="flex flex-col gap-y-6">
      <section class="flex items-center gap-2">
        <div class="flex flex-col gap-2 flex-1">
          <div class="flex items-center gap-2">
            <IconTutorials class="size-4" />
            <h1 class="text-heading-lg">Tutorials</h1>
          </div>
          <p class="text-body-sm text-foreground-2">
            Get started with Speckle with step-by-step instructions for all skill
            levels.
          </p>
        </div>
      </section>
      <section class="flex gap-4 flex-col">
        <div class="flex-1 flex flex-col md:flex-row gap-2 md:gap-4">
          <FormTextInput
            name="modelsearch"
            :show-label="false"
            placeholder="Search tutorials..."
            :custom-icon="MagnifyingGlassIcon"
            color="foundation"
            wrapper-classes="grow"
            :show-clear="!!search"
            v-bind="bind"
            v-on="on"
          />
          <FormSelectBase
            v-model="selectedProduct"
            :label-id="labelId"
            :button-id="buttonId"
            name="categories"
            label="Categories"
            placeholder="All categories"
            class="md:min-w-80"
            allow-unset
            :items="products"
            size="base"
            color="foundation"
            clearable
          >
            <template #something-selected="{ value }">
              {{ isArray(value) ? value[0].name : value.name }}
            </template>
            <template #option="{ item }">
              {{ item.name }}
            </template>
          </FormSelectBase>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TutorialsCard
            v-for="tutorial in filteredTutorials"
            :key="tutorial.title"
            :tutorial-item="tutorial"
            source="tutorials"
          />
        </div>
        <p
          v-if="!filteredTutorials.length"
          class="text-body-xs text-foreground text-center w-full my-4"
        >
          No results.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tutorialItems, tutorialProducts } from '~/lib/dashboard/helpers/tutorials'
import type { TutorialItem, TutorialProduct } from '~/lib/dashboard/helpers/types'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { isArray } from 'lodash-es'

type ProductFilter = {
  id: TutorialProduct
  name: (typeof tutorialProducts)[keyof typeof tutorialProducts]
}

const {
  on,
  bind,
  value: search
} = useDebouncedTextInput({
  debouncedBy: 800
})

const labelId = useId()
const buttonId = useId()

const selectedProduct = ref<ProductFilter>()
const tutorials = shallowRef<TutorialItem[]>(tutorialItems)
const products = shallowRef(
  Object.entries(tutorialProducts).map(([key, name]) => ({
    id: key as TutorialProduct,
    name
  }))
)

const filteredTutorials = computed(() => {
  let filteredItems = tutorials.value

  if (selectedProduct.value) {
    filteredItems = filteredItems.filter((item) =>
      item.products?.includes(selectedProduct.value!.id)
    )
  }

  if (search.value) {
    filteredItems = filteredItems.filter((item) =>
      item.title.toLowerCase().includes(search.value!.toLowerCase())
    )
  }

  return filteredItems
})
</script>
