export const useWorkspacesAvatar = () => {
  const count = ref(6)

  const generateDefaultLogoIndex = () => {
    return Math.floor(Math.random() * count.value)
  }

  const getDefaultAvatar = (avatarIndex?: number) => {
    const index =
      avatarIndex && avatarIndex >= 0 && avatarIndex <= count.value ? avatarIndex : 0
    return `/images/workspace/avatars/avatar_${index}.svg`
  }

  return {
    count,
    getDefaultAvatar,
    generateDefaultLogoIndex
  }
}
