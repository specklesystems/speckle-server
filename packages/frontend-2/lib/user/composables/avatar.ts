import { ToRefs } from 'vue'
import {
  ActiveUserAvatarFragment,
  LimitedUserAvatarFragment
} from '~~/lib/common/generated/gql/graphql'

export type UserAvatarSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl'
export type AvatarUserType = LimitedUserAvatarFragment | ActiveUserAvatarFragment

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
      case 'base':
      default:
        return 'w-8'
    }
  })

  const sizeClasses = computed(() => `${widthClasses.value} ${heightClasses.value}`)

  return { heightClasses, widthClasses, sizeClasses }
}
