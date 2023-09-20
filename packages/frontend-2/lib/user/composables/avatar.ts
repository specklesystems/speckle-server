import { ToRefs } from 'vue'
import {
  ActiveUserAvatarFragment,
  LimitedUserAvatarFragment,
  AppAuthorAvatarFragment
} from '~~/lib/common/generated/gql/graphql'

export type UserAvatarSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'editable'
export type AvatarUserType =
  | LimitedUserAvatarFragment
  | ActiveUserAvatarFragment
  | AppAuthorAvatarFragment
  | { id: string; name: string; avatar?: string | null }

export function useAvatarSizeClasses(params: {
  props: ToRefs<{
    size?: UserAvatarSize
  }>
}) {
  const { props } = params

  const heightClasses = computed(() => {
    const size = props.size?.value
    switch (size) {
      case 'xs':
        return 'h-5'
      case 'sm':
        return 'h-6'
      case 'lg':
        return 'h-10'
      case 'xl':
        return 'h-14'
      case 'editable':
        return 'h-60'
      case 'base':
      default:
        return 'h-8'
    }
  })

  const widthClasses = computed(() => {
    const size = props.size?.value
    switch (size) {
      case 'xs':
        return 'w-5'
      case 'sm':
        return 'w-6'
      case 'lg':
        return 'w-10'
      case 'xl':
        return 'w-14'
      case 'editable':
        return 'w-60'
      case 'base':
      default:
        return 'w-8'
    }
  })

  const textClasses = computed(() => {
    const size = props.size?.value
    switch (size) {
      case 'xs':
        return 'text-tiny'
      case 'sm':
        return 'text-xs'
      case 'lg':
        return 'text-md'
      case 'xl':
        return 'text-2xl'
      case 'editable':
        return 'h1'
      case 'base':
      default:
        return 'text-sm'
    }
  })

  const iconClasses = computed(() => {
    const size = props.size?.value
    switch (size) {
      case 'xs':
        return 'w-3 h-3'
      case 'sm':
        return 'w-3 h-3'
      case 'lg':
        return 'w-5 h-5'
      case 'xl':
        return 'w-8 h-8'
      case 'editable':
        return 'w-20 h-20'
      case 'base':
      default:
        return 'w-4 h-4'
    }
  })

  const sizeClasses = computed(
    () => `${widthClasses.value} ${heightClasses.value} ${textClasses.value}`
  )

  return { heightClasses, widthClasses, sizeClasses, iconClasses }
}
