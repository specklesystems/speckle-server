export const useWorkspacePlanLimits = (
  projectCount: ComputedRef<number>,
  modelCount: ComputedRef<number>
) => {
  const projectLimit = computed(() => 3)
  const modelLimit = computed(() => 8)

  const remainingProjects = computed(() => {
    return projectLimit.value - projectCount.value
  })

  const remainingModels = computed(() => {
    return modelLimit.value - modelCount.value
  })

  const limitType = computed(() => {
    if (projectCount.value > projectLimit.value) {
      return 'project'
    }
    if (modelCount.value > modelLimit.value) {
      return 'model'
    }
    return null
  })

  const activeLimit = computed(() => {
    const limit =
      limitType.value === 'project'
        ? projectLimit.value
        : limitType.value === 'model'
        ? modelLimit.value
        : null
    return limit
  })

  const canAddProject = computed(
    () => remainingProjects.value !== null && remainingProjects.value > 0
  )
  const canAddModels = computed(
    () => remainingModels.value !== null && remainingModels.value > 0
  )

  return {
    projectLimit,
    modelLimit,
    remainingProjects,
    remainingModels,
    canAddProject,
    canAddModels,
    limitType,
    activeLimit
  }
}
