<template>
  <div class="flex flex-col">
    <div class="flex flex-1 gap-x-3">
      <div class="flex flex-col gap-y-3 flex-1">
        <div class="flex items-start gap-x-3">
          <div class="flex-1 relative">
            <div class="flex gap-2">
              <FormTextInput
                v-if="!isInWorkspace"
                v-model="email"
                :name="`email-${item.key}`"
                color="foundation"
                placeholder="Email address"
                show-clear
                full-width
                use-label-in-errors
                :show-label="showLabel"
                label="Email"
                :rules="[isEmailOrEmpty]"
                @paste="handlePaste"
              />
              <template v-else>
                <div ref="listboxButton" class="relative grow">
                  <FormTextInput
                    v-model="input"
                    :name="`input-${item.key}`"
                    color="foundation"
                    placeholder="Search by name or email..."
                    show-clear
                    full-width
                    use-label-in-errors
                    :show-label="showLabel"
                    :label="
                      canInviteNewMembers ? 'Name or email' : 'Search workspace members'
                    "
                    autocomplete="off"
                    :readonly="canInviteNewMembers ? false : !!selectedUser"
                    :rules="
                      canInviteNewMembers
                        ? [isEmailOrUserId({ userId: selectedUser?.user.id })]
                        : []
                    "
                    @input="(e) => handleInput(e.value)"
                    @focus="showSuggestions"
                    @click="showSuggestions"
                    @clear="handleClear"
                    @paste="handlePaste"
                    @keydown.down.prevent="navigateDown"
                    @keydown.up.prevent="navigateUp"
                    @keydown.esc.prevent="onEsc"
                  />
                  <Transition
                    v-if="isMounted"
                    leave-active-class="transition ease-in duration-100"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <Teleport to="body">
                      <div
                        v-if="showDropdown"
                        ref="menuEl"
                        :style="listboxOptionsStyle"
                        class="z-50 fixed bg-foundation shadow-lg rounded-md border border-outline-3"
                      >
                        <div
                          v-if="isSearchLoading && !filteredSuggestions.length"
                          class="flex items-center justify-center p-4"
                        >
                          <CommonLoadingIcon />
                        </div>
                        <div
                          v-else-if="filteredSuggestions.length === 0"
                          class="flex items-center justify-center p-4 text-foreground-2 text-body-xs leading-none"
                        >
                          No results
                        </div>
                        <div
                          v-else
                          class="suggestions-container p-1 flex flex-col gap-y-1"
                        >
                          <button
                            v-for="(suggestion, i) in filteredSuggestions"
                            :key="i"
                            ref="suggestionRefs"
                            type="button"
                            class="block w-full text-left px-4 py-2 text-body-xs cursor-pointer hover:bg-foundation-2 focus:bg-foundation-2 focus:outline-none rounded-md"
                            @click="selectSuggestion(suggestion)"
                            @keydown.down.prevent="navigateDown"
                            @keydown.up.prevent="navigateUp"
                            @keydown.enter.prevent="
                              selectSuggestion(filteredSuggestions[activeIndex])
                            "
                            @keydown.esc.prevent="onEsc"
                            @focus="activeIndex = i"
                          >
                            {{ suggestion.user.name }}
                          </button>
                        </div>
                      </div>
                    </Teleport>
                  </Transition>
                </div>
              </template>
            </div>
          </div>
          <FormSelectProjectRoles
            v-if="showProjectRoles"
            v-model="projectRole"
            label="Project role"
            :name="`fields.${index}.projectRole`"
            mount-menu-on-body
            :show-label="showLabel"
            :allow-unset="false"
            :hidden-items="[Roles.Stream.Owner]"
            :disabled-items="disabledProjectRoles?.roles"
            :disabled-item-tooltip="disabledProjectRoles?.reason"
          />
        </div>
      </div>
      <CommonTextLink v-if="showDelete" :class="showLabel && 'mt-7'">
        <Trash2
          :size="LucideSize.base"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
          class="text-foreground-2"
          @click="$emit('remove')"
        />
      </CommonTextLink>
      <div v-else class="size-4" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Trash2 } from 'lucide-vue-next'
import { isEmailOrEmpty } from '~~/lib/common/helpers/validation'
import {
  useElementBounding,
  useIntersectionObserver,
  onClickOutside,
  useMounted
} from '@vueuse/core'
import type { CSSProperties } from 'vue'
import type { InviteProjectItem } from '~~/lib/invites/helpers/types'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { Roles, SeatTypes } from '@speckle/shared'
import { isEmailOrUserId } from '~~/lib/invites/helpers/validation'
import { parsePastedEmails } from '~~/lib/invites/helpers/helpers'
import type { Get } from 'type-fest'
import type {
  InviteDialogProjectRow_ProjectFragment,
  InviteDialogProjectRowProjectCollaboratorsQuery
} from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment InviteDialogProjectRow_Project on Project {
    id
    workspaceId
    workspace {
      id
      role
    }
  }
`)

type SelectedUser = NonNullable<
  Get<
    InviteDialogProjectRowProjectCollaboratorsQuery,
    'project.invitableCollaborators.items.0'
  >
>

const searchQuery = graphql(`
  query InviteDialogProjectRowProjectCollaborators(
    $projectId: String!
    $filter: InvitableCollaboratorsFilter
  ) {
    project(id: $projectId) {
      id
      invitableCollaborators(filter: $filter) {
        items {
          ...InviteProjectItem_WorkspaceCollaborator
        }
      }
    }
  }
`)

const props = defineProps<{
  project: InviteDialogProjectRow_ProjectFragment
  modelValue: InviteProjectItem
  item: {
    key: string | number
  }
  index: number
  showDelete?: boolean
  showProjectRoles?: boolean
  showLabel?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: InviteProjectItem): void
  (e: 'remove'): void
  (e: 'add-multiple-emails', emails: string[]): void
}>()

const isMounted = useMounted()
const menuEl = ref<HTMLDivElement | null>(null)
const listboxButton = ref<HTMLDivElement | null>(null)
const search = ref('')
const input = ref('')
const showDropdownState = ref(false)
const activeIndex = ref(-1)
const suggestionRefs = ref<HTMLButtonElement[]>([])

const listboxButtonBounding = useElementBounding(listboxButton, {
  windowResize: true,
  windowScroll: true,
  immediate: true
})

useIntersectionObserver(
  computed(() => menuEl.value),
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      listboxButtonBounding.update()
    }
  }
)

const { result, loading: isSearchLoading } = useQuery(
  searchQuery,
  () => ({
    projectId: props.modelValue.project!.id,
    filter: {
      search: search.value
    }
  }),
  () => ({
    enabled: !!search.value && !!props.modelValue.project?.id
  })
)

const isWorkspaceAdmin = computed(() => {
  return props.project.workspace?.role === Roles.Workspace.Admin
})
const isInWorkspace = computed(() => !!props.project.workspaceId)
const canInviteNewMembers = computed(() => {
  if (!isInWorkspace.value) return true
  if (isWorkspaceAdmin.value) return true
  return false
})

const filteredSuggestions = computed(() =>
  search.value ? result.value?.project?.invitableCollaborators?.items || [] : []
)

const projectRole = computed({
  get: () => props.modelValue.projectRole,
  set: (value) => {
    if (value === props.modelValue.projectRole) return

    emit('update:modelValue', {
      ...props.modelValue,
      projectRole: value
    })
  }
})

const email = computed({
  get: () => props.modelValue.email,
  set: (value) => {
    if (value === props.modelValue.email) return

    emit('update:modelValue', {
      ...props.modelValue,
      email: value
    })
  }
})

const selectedUser = computed({
  get: () => props.modelValue.userInfo,
  set: (value) => {
    if (value === props.modelValue.userInfo) return

    emit('update:modelValue', {
      ...props.modelValue,
      userInfo: value ? { ...value } : value,
      userId: value ? value.user.id : undefined
    })
  }
})

const showDropdown = computed(() => {
  const hasContent = canInviteNewMembers.value
    ? filteredSuggestions.value.length > 0
    : filteredSuggestions.value.length > 0 || isSearchLoading.value || search.value

  return hasContent && showDropdownState.value
})

const listboxOptionsStyle = computed(() => {
  const style: CSSProperties = {}
  const top = listboxButtonBounding.top.value
  const left = listboxButtonBounding.left.value
  const width = listboxButtonBounding.width.value

  style.top = `${top + (props.showLabel ? 61 : 33)}px`
  style.left = `${left}px`
  style.width = `${width}px`

  return style
})

const disabledProjectRoles = computed(() => {
  if (
    isInWorkspace.value &&
    !isWorkspaceAdmin.value &&
    selectedUser.value?.seatType !== SeatTypes.Editor
  ) {
    return {
      roles: [Roles.Stream.Contributor],
      reason: 'The workspace admin needs to buy this user an Editor seat first.'
    }
  }
  return undefined
})

const handleInput = (value: string) => {
  search.value = value
  if (isInWorkspace.value && canInviteNewMembers.value) {
    emit('update:modelValue', {
      ...props.modelValue,
      email: value
    })
  }
}

const handleClear = () => {
  input.value = ''
  search.value = ''
  selectedUser.value = null
  emit('update:modelValue', {
    ...props.modelValue,
    userId: undefined,
    userInfo: undefined
  })
}

const onEsc = () => {
  showDropdownState.value = false
  activeIndex.value = -1
  handleClear()
}

const showSuggestions = () => {
  showDropdownState.value = true
  if (filteredSuggestions.value.length > 0) {
    activeIndex.value = -1
  }
}

const navigateDown = () => {
  if (filteredSuggestions.value.length === 0) return

  if (activeIndex.value >= filteredSuggestions.value.length - 1) {
    activeIndex.value = 0
  } else {
    activeIndex.value++
  }

  focusActiveItem()
}

const navigateUp = () => {
  if (filteredSuggestions.value.length === 0) return

  if (activeIndex.value <= 0) {
    activeIndex.value = filteredSuggestions.value.length - 1
  } else {
    activeIndex.value--
  }

  focusActiveItem()
}

const focusActiveItem = () => {
  if (suggestionRefs.value && suggestionRefs.value[activeIndex.value]) {
    suggestionRefs.value[activeIndex.value].focus()
  }
}

const selectSuggestion = (user: SelectedUser) => {
  selectedUser.value = user
  search.value = ''
  input.value = user.user.name
  showDropdownState.value = false
  activeIndex.value = -1
}

const handlePaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text')

  if (pastedText && /[\s,;]/.test(pastedText)) {
    event.preventDefault()

    const validEmails = parsePastedEmails(pastedText)

    if (validEmails.length > 0) {
      input.value = validEmails[0]

      if (isInWorkspace.value && canInviteNewMembers.value) {
        handleInput(validEmails[0])
      } else if (!isInWorkspace.value) {
        email.value = validEmails[0]
      }

      validEmails.shift()

      if (validEmails.length > 0) {
        emit('add-multiple-emails', validEmails)
      }
    }
  }
}

onMounted(() => {
  input.value = props.modelValue.email
})

onClickOutside(
  menuEl,
  () => {
    search.value = ''
    showDropdownState.value = false
    activeIndex.value = -1
  },
  {
    ignore: [listboxButton]
  }
)

watch(selectedUser, () => {
  if (disabledProjectRoles.value) {
    projectRole.value = Roles.Stream.Reviewer
  }
})
</script>
