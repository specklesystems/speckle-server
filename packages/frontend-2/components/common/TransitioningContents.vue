<script lang="ts">
import {
  waitIntervalUntil,
  type Nullable,
  timeoutAt,
  WaitIntervalUntilCanceledError
} from '@speckle/shared'
import { until } from '@vueuse/core'
import type { CSSProperties } from 'vue'

/**
 * A component that transitions between two sets of contents with a crossfade effect. You only
 * have to use a single slot - the component will not update any contents inside of the slot
 * until you call the `triggerTransition` method, and then the update will happen with a smooth
 * transition.
 */
export default defineComponent({
  props: {
    duration: {
      type: Number,
      default: 1000
    },
    debug: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { slots, expose }) {
    const transitioning = ref(false)
    const newWrapperRef = ref(null as Nullable<HTMLDivElement>)
    const oldWrapperRef = ref(null as Nullable<HTMLDivElement>)

    const newContents = shallowRef(slots.default?.())
    const oldContents: typeof newContents = shallowRef(undefined)

    const newOpacity = ref(1)
    const oldOpacity = ref(1)

    const newTransitionEnabled = ref(false)
    const oldTransitionEnabled = ref(false)

    const waitForDomUpdate = async (params: {
      ref: Ref<Nullable<HTMLElement>>
      expectStyle?: Partial<CSSProperties>
      expectClasses?: string[]
      shouldNotHaveClasses?: string[]
    }) => {
      const { ref, expectClasses, expectStyle, shouldNotHaveClasses } = params

      let attempt = 0
      const promise = waitIntervalUntil(100, () => {
        if (attempt > 20) {
          promise.cancel()
        }
        attempt++

        const el = ref.value
        if (!el) return false

        if (expectStyle) {
          for (const [key, value] of Object.entries(expectStyle)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            if (el.style[key as any] !== value) {
              return false
            }
          }
        }

        if (expectClasses) {
          for (const className of expectClasses) {
            if (!el.classList.contains(className)) {
              return false
            }
          }
        }

        if (shouldNotHaveClasses) {
          for (const className of shouldNotHaveClasses) {
            if (el.classList.contains(className)) {
              return false
            }
          }
        }

        return true
      })

      try {
        await promise
      } catch (e) {
        if (e instanceof WaitIntervalUntilCanceledError) {
          if (props.debug) {
            throw e
          }
        } else {
          throw e
        }
      }
    }

    /**
     * Cause default slot to update with an opacity transition
     */
    const updateContents = async () => {
      // Stage 1: Just move new -> old w/o any transitions (visually should look the same)
      oldContents.value = newContents.value
      newContents.value = slots.default?.()

      newTransitionEnabled.value = false
      newOpacity.value = 0

      oldTransitionEnabled.value = false
      oldOpacity.value = 1

      await Promise.all([
        waitForDomUpdate({
          ref: newWrapperRef,
          expectStyle: { opacity: '0' },
          shouldNotHaveClasses: ['transition-opacity']
        }),
        waitForDomUpdate({
          ref: oldWrapperRef,
          expectStyle: { opacity: '1' },
          shouldNotHaveClasses: ['transition-opacity']
        })
      ])

      // Stage 2: Transition both
      oldTransitionEnabled.value = newTransitionEnabled.value = true
      await Promise.all([
        waitForDomUpdate({
          ref: newWrapperRef,
          expectClasses: ['transition-opacity']
        }),
        waitForDomUpdate({
          ref: oldWrapperRef,
          expectClasses: ['transition-opacity']
        })
      ])

      newOpacity.value = 1
      oldOpacity.value = 0

      await Promise.all([
        waitForDomUpdate({
          ref: newWrapperRef,
          expectStyle: { opacity: '1' }
        }),
        waitForDomUpdate({
          ref: oldWrapperRef,
          expectStyle: { opacity: '0' }
        })
      ])
    }

    const triggerTransition = async () => {
      if (!transitioning.value) {
        transitioning.value = true
        await updateContents()
        return
      }

      await Promise.race([
        until(transitioning).toBe(false),
        timeoutAt(props.duration + 1000)
      ])
      await updateContents()
    }

    const buildItemProps = (params: {
      zIndex: number
      withTransitions: boolean
      opacity: number
    }) => {
      const { zIndex, withTransitions, opacity } = params
      const classParts = ['absolute inset-0']
      const style: CSSProperties = {
        zIndex,
        opacity,
        ...(withTransitions
          ? {
              transitionDuration: `${props.duration}ms`
            }
          : {})
      }

      if (withTransitions) {
        classParts.push('transition-opacity')
      }

      return {
        class: classParts.join(' '),
        style
      }
    }

    expose({
      triggerTransition
    })

    return () => {
      return h('div', { class: 'relative' }, [
        h(
          'div',
          {
            ...buildItemProps({
              zIndex: 2,
              withTransitions: newTransitionEnabled.value,
              opacity: newOpacity.value
            }),
            ref: newWrapperRef
          },
          [newContents.value]
        ),
        ...(oldContents.value
          ? [
              h(
                'div',
                {
                  ...buildItemProps({
                    zIndex: 1,
                    withTransitions: oldTransitionEnabled.value,
                    opacity: oldOpacity.value
                  }),
                  ref: oldWrapperRef,
                  onTransitionend: () => {
                    // Stage 3: Clean up
                    oldContents.value = undefined
                    transitioning.value = false
                  }
                },
                [oldContents.value]
              )
            ]
          : [])
      ])
    }
  }
})
</script>
