export const useWorkspacesAvatar = (avatarIndex?: number) => {
  const count = ref(6)

  const generateDefaultLogoIndex = () => {
    return Math.floor(Math.random() * count.value)
  }

  const defaultAvatar = computed(() => {
    const index = avatarIndex
      ? avatarIndex >= 0 && avatarIndex <= count.value
        ? avatarIndex
        : 0
      : 0
    return `/images/workspace/avatars/avatar_${index}.svg`
  })

  return {
    count,
    defaultAvatar,
    generateDefaultLogoIndex
  }
}
