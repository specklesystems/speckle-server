<template>
  <FormSelectBase
    v-model="selectedValue"
    :multiple="multiple"
    :items="users"
    :search="search"
    :search-filter-predicate="searchFilterPredicate"
    :search-placeholder="searchPlaceholder"
    :label="label"
    :show-label="showLabel"
    :name="name"
    by="id"
  >
    <template #nothing-selected>
      <template v-if="selectorPlaceholder">
        {{ selectorPlaceholder }}
      </template>
      <template v-else>
        {{ multiple ? 'Select users' : 'Select a user' }}
      </template>
    </template>
    <template #something-selected="{ value }">
      <template v-if="isArray(value) && value.length > 1">
        <div class="flex items-center space-x-0.5">
          <div
            ref="selectedAvatarWrapper"
            class="flex flex-wrap overflow-hidden space-x-0.5 h-6"
          >
            <UserAvatar
              v-for="user in value"
              :key="user.id"
              :avatar-url="user.avatar"
              no-border
              size="24"
            />
          </div>
          <div v-if="hiddenAvatarCount > 0" class="text-foreground-2 normal">
            +{{ hiddenAvatarCount }}
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex items-center">
          <UserAvatar
            :avatar-url="(isArray(value) ? value[0] : value).avatar || undefined"
            no-border
            size="24"
            class="mr-2"
          />
          <span class="truncate label label--light">
            {{ (isArray(value) ? value[0] : value).name }}
          </span>
        </div>
      </template>
    </template>
    <template #option="{ item }">
      <div class="flex items-center">
        <UserAvatar
          :avatar-url="item.avatar || undefined"
          no-border
          size="20"
          class="mr-2"
        />
        <span class="truncate">{{ item.name }}</span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { Nullable, Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { FormUsersSelectItemFragment } from '~~/lib/common/generated/gql/graphql'
import { isArray, isUndefined } from 'lodash-es'
import { useResizeObserver } from '@vueuse/core'

type ValueType = FormUsersSelectItemFragment | FormUsersSelectItemFragment[] | undefined

graphql(`
  fragment FormUsersSelectItem on LimitedUser {
    id
    name
    avatar
  }
`)

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps({
  /**
   * Whether to allow selecting multiple users
   */
  multiple: {
    type: Boolean,
    default: false
  },
  users: {
    type: Array as PropType<FormUsersSelectItemFragment[]>,
    required: true
  },
  modelValue: {
    type: [Object, Array] as PropType<ValueType>,
    default: undefined
  },
  /**
   * Whether to allow filtering users through a search box
   */
  search: {
    type: Boolean,
    default: false
  },
  /**
   * Search placeholder text
   */
  searchPlaceholder: {
    type: String,
    default: 'Search people'
  },
  selectorPlaceholder: {
    type: String as PropType<Optional<string>>,
    default: ''
  },
  /**
   * Label is required at the very least for screen-readers
   */
  label: {
    type: String,
    required: true
  },
  /**
   * Whether to show the label visually
   */
  showLabel: {
    type: Boolean,
    default: false
  },
  name: {
    type: String as PropType<Optional<string>>,
    default: undefined
  }
})

const selectedAvatarWrapper = ref(null as Nullable<HTMLElement>)
const hiddenAvatarCount = ref(0)

const selectedValue = computed({
  get: () => {
    const currentValue = props.modelValue
    if (props.multiple) {
      return isArray(currentValue) ? currentValue : []
    } else {
      return isArray(currentValue) ? undefined : currentValue
    }
  },
  set: (newVal) => {
    if (props.multiple && !isArray(newVal)) {
      console.warn(
        'Attempting to set non-array value in Users selector w/ multiple=true'
      )
      return
    } else if (!props.multiple && isArray(newVal)) {
      console.warn('Attempting to set array value in Users selector w/ multiple=false')
      return
    }

    emit('update:modelValue', props.multiple ? newVal || [] : newVal)
  }
})

const searchFilterPredicate = (i: FormUsersSelectItemFragment, search: string) =>
  i.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())

/**
 * Update "+ X" label depending on how many avatars are hidden
 */
useResizeObserver(selectedAvatarWrapper, (entries) => {
  if (!props.multiple) return

  const entry = entries[0]
  const target = entry.target
  const avatarElements = target.children

  /**
   * Comparing offset from parent to between all avatars to see when they break off into another line
   * and become invisible
   */
  const totalCount = isArray(selectedValue.value) ? selectedValue.value.length : 1
  let visibleCount = 0
  let firstElOffsetTop = undefined as Optional<number>
  for (const avatarEl of avatarElements) {
    const offsetTop = (avatarEl as HTMLElement).offsetTop
    if (isUndefined(firstElOffsetTop)) {
      firstElOffsetTop = offsetTop
      visibleCount += 1
    } else {
      if (offsetTop === firstElOffsetTop) {
        visibleCount += 1
      } else {
        break
      }
    }
  }

  hiddenAvatarCount.value = totalCount - visibleCount
})
</script>
