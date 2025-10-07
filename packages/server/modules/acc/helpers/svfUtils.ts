import type { ModelDerivativeServiceDesignManifest } from '@/modules/acc/domain/acc/types'

export const isReadyForImport = (
  manifest: ModelDerivativeServiceDesignManifest
): boolean => {
  return (
    manifest.derivatives?.some(
      ({ status, outputType, overrideOutputType }) =>
        [outputType, overrideOutputType].includes('svf2') && status === 'success'
    ) ?? false
  )
}
