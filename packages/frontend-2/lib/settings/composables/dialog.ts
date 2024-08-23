export const useSettingsDialog = () => {
  const isOpen = ref(false)

  const toggleDialog = () => {
    isOpen.value = !isOpen.value
    // console.log('Toggle dialog: ', isOpen.value)
  }

  return {
    isOpen,
    toggleDialog
  }
}
