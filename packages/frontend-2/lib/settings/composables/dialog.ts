export const useSettingsDialog = () => {
  const isOpen = ref(true)

  const toggleDialog = () => {
    isOpen.value = !isOpen.value
    // console.log('Toggle dialog: ', isOpen.value)
  }

  return {
    isOpen,
    toggleDialog
  }
}
