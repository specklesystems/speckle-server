<template>
  <div>
    <!-- Current Seat -->
    <CommonCard class="!p-2 !pr-3 !border-outline-3 !bg-foundation-2">
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-full border border-outline-3 bg-foundation">
          <component :is="currentSeat.icon" class="w-5 h-5" />
        </div>
        <div class="flex flex-col">
          <div class="text-foreground">{{ currentSeat.title }}</div>
          <div class="text-foreground-2 text-body-2xs">
            {{ currentSeat.description }}
          </div>
        </div>
        <div class="ml-auto text-foreground-2 font-medium">Current</div>
      </div>
    </CommonCard>

    <!-- Arrow -->
    <div class="flex justify-center my-2">
      <ArrowDownIcon class="w-5 h-5 text-foreground-2" />
    </div>

    <!-- New Seat -->
    <CommonCard
      class="!p-2 !pr-3 !border-blue-300 !bg-blue-50 dark:!border-blue-800 dark:!bg-blue-950"
    >
      <div class="flex items-center gap-2">
        <div
          class="p-2.5 rounded-full border border-blue-300 dark:border-blue-800 bg-foundation"
        >
          <component :is="newSeat.icon" class="w-4 h-4" />
        </div>
        <div class="flex flex-col">
          <div class="text-foreground">{{ newSeat.title }}</div>
          <div class="text-foreground-2 text-body-2xs">
            {{ newSeat.description }}
          </div>
        </div>
        <template v-if="!isFreePlan">
          <div v-if="isUpgrading" class="ml-auto flex items-center gap-1 font-medium">
            <template v-if="hasAvailableSeat">
              <div class="line-through text-foreground-2">£{{ seatPrice }}/month</div>
              <div class="text-primary">Free</div>
            </template>
            <template v-else>
              <div class="text-foreground">£{{ seatPrice }}/month</div>
            </template>
          </div>
          <div v-else class="ml-auto text-primary font-medium">Free</div>
        </template>
      </div>
    </CommonCard>
  </div>
</template>

<script setup lang="ts">
import { ArrowDownIcon } from '@heroicons/vue/20/solid'
import { EyeIcon, PencilIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  isUpgrading: boolean
  isFreePlan: boolean
  hasAvailableSeat: boolean
  seatPrice: number
}>()

const SeatTypes = {
  viewer: {
    icon: EyeIcon,
    title: 'Viewer seat',
    description: 'Can view and comment on projects'
  },
  editor: {
    icon: PencilIcon,
    title: 'Editor seat',
    description: 'Can create and edit projects'
  }
} as const

const currentSeat = computed(() =>
  props.isUpgrading ? SeatTypes.viewer : SeatTypes.editor
)

const newSeat = computed(() =>
  props.isUpgrading ? SeatTypes.editor : SeatTypes.viewer
)
</script>
