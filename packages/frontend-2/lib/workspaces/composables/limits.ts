import dayjs from 'dayjs'

export const useWorkspacePlanLimits = () => {
  const projectLimit = computed(() => 3)
  const modelLimit = computed(() => 8)
  const commentLimit = computed(() => 10)
  const versionLimit = computed(() => 10)

  const isCommentOlderThanLimit = (createdAt: string) => {
    return dayjs().diff(dayjs(createdAt), 'day') > commentLimit.value
  }

  return {
    projectLimit,
    modelLimit,
    commentLimit,
    versionLimit,
    isCommentOlderThanLimit
  }
}

export const useWorkspaceProjectLimits = (projectCount: ComputedRef<number>) => {
  const { projectLimit } = useWorkspacePlanLimits()

  const remainingProjects = computed(() => {
    return projectLimit.value - projectCount?.value
  })

  const canAddProject = computed(
    () => remainingProjects.value !== null && remainingProjects.value > 0
  )

  return {
    projectLimit,
    remainingProjects,
    canAddProject
  }
}

export const useWorkspaceModelLimits = (modelCount: ComputedRef<number>) => {
  const { modelLimit } = useWorkspacePlanLimits()

  const remainingModels = computed(() => {
    return modelLimit.value - (modelCount?.value ?? 0)
  })

  const canAddModel = computed(
    () => remainingModels.value !== null && remainingModels.value > 0
  )

  return {
    modelLimit,
    remainingModels,
    canAddModel
  }
}

export const useWorkspaceCommentLimits = () => {
  const { commentLimit } = useWorkspacePlanLimits()

  const isCommentOlderThanLimit = (createdAt: string) => {
    return dayjs().diff(dayjs(createdAt), 'day') > commentLimit.value
  }

  return {
    commentLimit,
    isCommentOlderThanLimit
  }
}

export const useWorkspaceVersionLimits = () => {
  const { versionLimit } = useWorkspacePlanLimits()

  const isVersionOlderThanLimit = (createdAt: string) => {
    return dayjs().diff(dayjs(createdAt), 'day') > versionLimit.value
  }

  return {
    versionLimit,
    isVersionOlderThanLimit
  }
}
