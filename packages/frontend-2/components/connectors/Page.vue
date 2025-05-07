<template>
  <div>
    <div class="flex flex-col gap-y-6">
      <section class="flex items-center gap-2">
        <div class="flex flex-col gap-2 flex-1">
          <div class="flex items-center gap-2">
            <h1 class="text-heading-sm md:text-heading line-clamp-2">Connectors</h1>
          </div>
          <!-- <p class="text-body-sm text-foreground-2">
            Extract and exchange data between the most popular AEC applications using
            our tailored connectors.
          </p> -->
          <!-- <p class="text-body-xs text-foreground-3 leading-none">
            Looking for V2 connectors? Get them
            <NuxtLink
              class="text-foreground-3 hover:text-foreground-2 underline"
              to="https://releases.speckle.systems/legacy-connectors"
            >
              here.
            </NuxtLink>
          </p> -->
        </div>
      </section>
      <section class="flex gap-4 flex-col">
        <div class="flex-1 flex flex-col md:flex-row gap-2 md:gap-4">
          <FormTextInput
            name="modelsearch"
            :show-label="false"
            placeholder="Search connectors..."
            :custom-icon="MagnifyingGlassIcon"
            color="foundation"
            wrapper-classes="grow"
            :show-clear="!!search"
            v-bind="bind"
            v-on="on"
          />
          <FormSelectBase
            v-model="selectedCategory"
            :label-id="labelId"
            :button-id="buttonId"
            name="categories"
            label="Categories"
            placeholder="All categories"
            class="md:w-80"
            allow-unset
            :items="categories"
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
        <div
          v-if="!promoHidden"
          class="relative rounded-[6px] overflow-hidden aspect-[896/405] max-h-[405px] w-full"
        >
          <figure class="dark:hidden absolute w-full">
            <NuxtImg
              src="/images/connectors/connectors_light.png"
              alt="Speckle Connectors"
              class="w-full h-auto aspect-[896/405] object-cover"
            />
            <NuxtImg
              src="/images/connectors/connectors_light.png"
              alt="Sync data in real time"
              class="absolute bottom-0 left-0 w-full h-[125px] aspect-[896/405] object-cover object-left-bottom blur-[20px]"
            />
          </figure>
          <figure class="hidden dark:block absolute w-full">
            <NuxtImg
              src="/images/connectors/connectors_dark.png"
              alt="Speckle Connectors"
              class="w-full h-auto aspect-[896/405] object-cover"
            />
            <NuxtImg
              src="/images/connectors/connectors_dark.png"
              alt="Speckle Connectors"
              class="absolute bottom-0 left-0 w-full h-[125px] aspect-[896/405] object-cover object-left-bottom blur-[20px]"
            />
          </figure>

          <div class="absolute bottom-0 w-full p-6">
            <h3>Sync models in real time</h3>
            <p class="text-body-xs text-foreground-2 mt-2 max-w-md text-balance">
              Extract and exchange data between the most popular AEC applications using
              our tailored connectors.
            </p>
          </div>
        </div>
        <div>
          <p class="text-body-2xs text-foreground-3 leading-none">
            Looking for V2 connectors? Get them
            <NuxtLink
              class="text-foreground-3 hover:text-foreground-2 underline"
              to="https://releases.speckle.systems/legacy-connectors"
            >
              here.
            </NuxtLink>
          </p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ConnectorsCard
            v-for="connector in filteredConnectors"
            :key="connector.title"
            :connector="connector"
          />
        </div>
        <p
          v-if="!filteredConnectors.length"
          class="text-body-xs text-foreground text-center w-full my-4"
        >
          No results.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { connectorItems, connectorCategories } from '~/lib/dashboard/helpers/connectors'
import type { ConnectorItem } from '~/lib/dashboard/helpers/types'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { isArray } from 'lodash-es'
import type { ConnectorCategory } from '~~/lib/dashboard/helpers/types'

type CategoryFilter = {
  id: ConnectorCategory
  name: (typeof connectorCategories)[keyof typeof connectorCategories]
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
const promoHidden = ref(false)

const selectedCategory = ref<CategoryFilter>()
const connectors = shallowRef<ConnectorItem[]>(connectorItems)
const categories = shallowRef(
  Object.entries(connectorCategories).map(([key, name]) => ({
    id: key as ConnectorCategory,
    name
  }))
)

const filteredConnectors = computed(() => {
  let filteredItems = connectors.value

  if (selectedCategory.value) {
    filteredItems = filteredItems.filter((item) =>
      item.categories?.includes(selectedCategory.value!.id)
    )
  }

  if (search.value) {
    filteredItems = filteredItems.filter((item) =>
      item.title.toLowerCase().includes(search.value!.toLowerCase())
    )
  }

  return filteredItems
})

watch(filteredConnectors, (newList) => {
  // Example: hide the image if the filtered list is different from the full list
  if (newList.length !== connectors.value.length) {
    promoHidden.value = true
  } else {
    promoHidden.value = false
  }
})
</script>
