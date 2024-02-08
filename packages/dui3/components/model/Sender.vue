<template>
  <div>
    <ModelCardBase :model-card="modelCard" :project="project">
      <div class="grid grid-cols-2 py-2 max-[275px]:grid-cols-1 gap-2">
        <div>
          <FormButton
            v-if="!modelCard.progress"
            size="sm"
            full-width
            color="card"
            class="flex items-center justify-center"
            :icon-left="modelCard.progress ? null : CloudArrowUpIcon"
            @click="sendOrCancel"
          >
            {{ modelCard.progress ? 'Cancel' : 'Publish' }}
          </FormButton>
          <FormButton
            v-else
            size="sm"
            full-width
            class="flex items-center justify-center"
            @click="sendOrCancel"
          >
            Cancel
          </FormButton>
        </div>
        <div
          class="flex h-full items-center space-x-2 text-xs max-[275px]:justify-center rounded-md pl-2 font-bold"
        >
          <button
            v-tippy="'Edit what gets published'"
            :icon-left="CubeIcon"
            class="flex min-w-0 transition hover:text-primary py-1"
            @click="openFilterDialog = true"
          >
            <CubeIcon class="h-4 pr-2" />
            <span class="truncate">{{ modelCard.sendFilter?.name }}</span>
          </button>
          <LayoutDialog v-model:open="openFilterDialog" hide-closerxxx>
            <div class="-mx-6 -my-6 space-y-2">
              <div>
                <div class="font-bold">Change filter</div>
              </div>
              <FilterListSelect
                :filter="modelCard.sendFilter"
                @update:filter="updateFilter"
              />
              <div class="mt-2 flex">
                <FormButton
                  size="sm"
                  text
                  @click=";(openFilterDialog = false), saveFilter()"
                >
                  Save
                </FormButton>
                <FormButton
                  size="sm"
                  full-width
                  @click=";(openFilterDialog = false), saveFilterAndSend()"
                >
                  Save & Publish
                </FormButton>
              </div>
            </div>
          </LayoutDialog>
        </div>
      </div>
    </ModelCardBase>
  </div>
</template>
<script setup lang="ts">
import { CloudArrowUpIcon, CubeIcon } from '@heroicons/vue/24/outline'
import { ISendFilter, ISenderModelCard } from '~/lib/models/card/send'
import { ProjectModelGroup, useHostAppStore } from '~/store/hostApp'

const props = defineProps<{
  modelCard: ISenderModelCard
  project: ProjectModelGroup
}>()

const store = useHostAppStore()
const openFilterDialog = ref(false)
const sendOrCancel = () => {
  if (props.modelCard.progress) store.sendModelCancel(props.modelCard.id)
  else store.sendModel(props.modelCard.id)
}

let newFilter: ISendFilter
const updateFilter = (filter: ISendFilter) => {
  newFilter = filter
}

const saveFilter = async () => {
  await store.updateModelFilter(props.modelCard.id, newFilter)
}

const saveFilterAndSend = async () => {
  await saveFilter()
  store.sendModel(props.modelCard.id)
}
</script>
