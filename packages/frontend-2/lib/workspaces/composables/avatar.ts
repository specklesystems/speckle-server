export const useWorkspacesAvatar = (avatarIndex: number) => {
  const count = ref(4)

  const defaultAvatar = computed(() => {
    const index = avatarIndex >= 0 && avatarIndex <= count.value ? avatarIndex : 0
    return `/images/workspace/avatars/avatar_${index}.svg`
  })

  return {
    count,
    defaultAvatar
  }
}
