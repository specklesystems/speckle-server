<template>
  <BillingTransitionCards :current-state="currentSeat" :new-state="newSeat">
    <template #price>
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
    </template>
  </BillingTransitionCards>
</template>

<script setup lang="ts">
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
