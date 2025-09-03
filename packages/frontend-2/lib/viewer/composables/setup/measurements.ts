import {
  defaultMeasurementOptions,
  type MeasurementData,
  type MeasurementOptions
} from '@speckle/shared/viewer/state'
import type { Measurement } from '@speckle/viewer'
import {
  MeasurementEvent,
  MeasurementsExtension,
  MeasurementState,
  SelectionExtension
} from '@speckle/viewer'
import { onKeyStroke, watchTriggerable } from '@vueuse/core'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { useMeasurementUtilities } from '~/lib/viewer/composables/ui'
import { useOnViewerLoadComplete } from '~/lib/viewer/composables/viewer'

export const useMeasurementsSetup = () => {
  return {
    enabled: ref(false),
    options: ref<MeasurementOptions>({
      ...defaultMeasurementOptions
    }),
    measurements: ref([] as MeasurementData[])
  }
}

export const useMeasurementsPostSetup = () => {
  const {
    viewer: {
      instance,
      init: { promise: viewerInitialized }
    },
    ui: { measurement }
  } = useInjectedViewerState()
  const { reset, removeActiveMeasurement } = useMeasurementUtilities()

  const measurementsInstance = () => instance.getExtension(MeasurementsExtension)
  const selectionInstance = () => instance.getExtension(SelectionExtension)

  // state -> viewer
  const { trigger: triggerEnabledWatch } = watchTriggerable(
    measurement.enabled,
    (newVal, oldVal) => {
      if (newVal !== oldVal) {
        measurementsInstance().enabled = newVal
        selectionInstance().enabled = !newVal
      }
    }
  )

  const { trigger: triggerOptionsWatch } = watchTriggerable(
    measurement.options,
    (newVal) => {
      if (newVal) {
        measurementsInstance().options = newVal
      }
    },
    { deep: true }
  )

  const { trigger: triggerMeasurementsWatch, ignoreUpdates: ignoreMeasurementsWatch } =
    watchTriggerable(measurement.measurements, (newVal) => {
      measurementsInstance().setMeasurements(newVal)
    })

  useOnViewerLoadComplete(
    ({ isInitial }) => {
      if (!isInitial) return

      triggerEnabledWatch()
      triggerOptionsWatch()
      triggerMeasurementsWatch()
    },
    { initialOnly: true }
  )

  // viewer -> state
  const onMeasurementsChanged = (data: Measurement[]) => {
    ignoreMeasurementsWatch(() => {
      measurement.measurements.value = data.map((m) => m.toMeasurementData())
    })
  }

  // Set up event handlers
  viewerInitialized.then(() => {
    measurementsInstance().on(
      MeasurementEvent.MeasurementsChanged,
      onMeasurementsChanged
    )
  })

  onBeforeUnmount(() => {
    // Remove handlers
    measurementsInstance().removeListener(
      MeasurementEvent.MeasurementsChanged,
      onMeasurementsChanged
    )

    // Clear state & viewer instance, incase they dont get to sync
    reset()
    measurementsInstance().clearMeasurements()
  })

  onKeyStroke('Delete', () => {
    removeActiveMeasurement()
  })
  onKeyStroke('Backspace', () => {
    removeActiveMeasurement()
  })
  onKeyStroke('Escape', () => {
    const activeMeasurement = measurementsInstance().activeMeasurement
    if (
      activeMeasurement &&
      activeMeasurement.state === MeasurementState.DANGLING_END
    ) {
      removeActiveMeasurement()
    }
  })
}
