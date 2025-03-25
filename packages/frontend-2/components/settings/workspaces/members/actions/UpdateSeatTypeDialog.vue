<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>{{ title }}</template>
    <div class="flex flex-col mb-4">
      <p class="text-body-sm mb-4">Confirm {{ user.name }}'s new seat.</p>

      <!-- Current Seat -->
      <CommonCard class="!p-2 !pr-3 !border-outline-3 !bg-foundation-2">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-full border border-outline-3 bg-foundation">
            <component :is="currentSeatIcon" class="w-5 h-5" />
          </div>
          <div class="flex flex-col">
            <div class="text-foreground">{{ currentSeatTitle }}</div>
            <div class="text-foreground-2 text-body-2xs">
              {{ currentSeatDescription }}
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
            <component :is="newSeatIcon" class="w-4 h-4" />
          </div>
          <div class="flex flex-col">
            <div class="text-foreground">{{ newSeatTitle }}</div>
            <div class="text-foreground-2 text-body-2xs">
              {{ newSeatDescription }}
            </div>
          </div>
          <div v-if="isUpgrading" class="ml-auto flex items-center gap-1 font-medium">
            <template v-if="hasUnusedEditorSeat">
              <div class="line-through text-foreground-2">
                £{{ seats.editor.seatPrice }}/month
              </div>
              <div class="text-primary">Free</div>
            </template>
            <template v-else>
              <div class="text-foreground">£{{ seats.editor.seatPrice }}/month</div>
            </template>
          </div>
          <div v-else class="ml-auto text-primary font-medium">Free</div>
        </div>
      </CommonCard>

      <p v-if="billingMessage" class="text-foreground-2 text-body-xs mt-4">
        {{ billingMessage }}
      </p>

      <NuxtLink
        :to="LearnMoreRolesSeatsUrl"
        class="text-foreground-2 text-body-xs underline mt-3"
      >
        Learn more about seats
      </NuxtLink>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import type { UserItem } from '~/components/settings/workspaces/members/new/MembersTable.vue'
import {
  SeatTypes,
  type WorkspaceSeatType,
  type MaybeNullOrUndefined
} from '@speckle/shared'
import { useWorkspaceUpdateSeatType } from '~/lib/workspaces/composables/management'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'
import { LearnMoreRolesSeatsUrl } from '~/lib/common/helpers/route'
import { EyeIcon, PencilIcon } from '@heroicons/vue/24/outline'
import { ArrowDownIcon } from '@heroicons/vue/20/solid'
import type {
  SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment,
  SettingsWorkspacesNewMembersTable_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  user: UserItem
  workspace?: MaybeNullOrUndefined<
    | SettingsWorkspacesNewMembersTable_WorkspaceFragment
    | SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment
  >
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const updateUserSeatType = useWorkspaceUpdateSeatType()
const { seats, totalCostFormatted, billingCycleEnd, isPurchasablePlan } =
  useWorkspacePlan(props.workspace?.slug || '')

const isUpgrading = computed(() => props.user.seatType === SeatTypes.Viewer)

const hasUnusedEditorSeat = computed(() => {
  if (!seats.value?.editor) return false
  return seats.value.editor.hasSeatAvailable
})

const currentSeatIcon = computed(() => (isUpgrading.value ? EyeIcon : PencilIcon))
const newSeatIcon = computed(() => (isUpgrading.value ? PencilIcon : EyeIcon))

const currentSeatTitle = computed(() =>
  isUpgrading.value ? 'Viewer seat' : 'Editor seat'
)
const newSeatTitle = computed(() => (isUpgrading.value ? 'Editor seat' : 'Viewer seat'))

const currentSeatDescription = computed(() =>
  isUpgrading.value
    ? 'Can view and comment on projects'
    : 'Can create and edit projects'
)

const newSeatDescription = computed(() =>
  isUpgrading.value
    ? 'Can create and edit projects'
    : 'Can view and comment on projects'
)

const billingMessage = computed(() => {
  if (isUpgrading.value) {
    return hasUnusedEditorSeat.value
      ? 'You have an unused Editor seat that is already paid for, so the change will not incur any charges.'
      : `This adds an extra Editor seat to your subscription, increasing your total billing to ${totalCostFormatted.value}/month.`
  } else {
    return isPurchasablePlan.value
      ? `The Editor seat will still be paid for until your plan renews on ${billingCycleEnd}. You can freely reassign it to another person.`
      : null
  }
})

const title = computed(() => {
  return isUpgrading.value ? 'Upgrade to an Editor seat?' : 'Downgrade to a viewer seat'
})

const handleConfirm = async () => {
  if (!props.workspace?.id) return

  const newSeatType: WorkspaceSeatType = isUpgrading.value
    ? SeatTypes.Editor
    : SeatTypes.Viewer

  await updateUserSeatType({
    userId: props.user.id,
    seatType: newSeatType,
    workspaceId: props.workspace.id
  })

  open.value = false
  emit('success')
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  },
  {
    text: isUpgrading.value ? 'Confirm and upgrade' : 'Confirm and downgrade',
    props: {
      color: 'primary'
    },
    onClick: handleConfirm
  }
])
</script>
