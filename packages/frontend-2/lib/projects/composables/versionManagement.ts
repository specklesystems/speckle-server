import { MaybeRef } from '@vueuse/core'

export function useProjectVersionUpdateTracking(projectId: MaybeRef<string>) {
  /**
   * TODO: Delete/update version
   * On creation:
   * - Update model.previewUrl
   * On create/update:
   * - Update model.updatedAt
   *
   * Handler:
   * - Projects dashboard: Re-calculate top 4 models (maybe need full model fragment then?)
   * - Project page: Reload models queries
   * - Viewer: Re-calculate models versions
   */
}
