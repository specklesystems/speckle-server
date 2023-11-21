export const formatBranchNameForURL = (branchName: string) =>
  encodeURIComponent(branchName || '')
