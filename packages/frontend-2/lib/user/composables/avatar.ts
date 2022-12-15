import { ToRefs } from 'vue'

export type AvatarSize = '32' | '24' | '20'

export function useUserAvatarInternalsparams(params: {
  props: ToRefs<{
    size?: AvatarSize
    noBorder?: boolean
  }>
}) {
  const { props } = params

  const sizeBorderClasses = computed(() => {
    const classParts: string[] = []

    const size = props.size?.value || 'sm'
    const noBorder = props.noBorder?.value

    switch (size) {
      case '20':
        classParts.push('h-5 w-5')
        if (!noBorder) classParts.push('border border-outline-1')
        break
      case '24':
        classParts.push('h-6 w-6')
        if (!noBorder) classParts.push('border border-outline-1')
        break
      case '32':
      default:
        classParts.push('h-8 w-8')
        if (!noBorder) classParts.push('border-2 border-outline-1')
        break
    }

    return classParts.join(' ')
  })

  return { sizeBorderClasses }
}
