import Vue, { computed, onMounted, onBeforeUnmount } from 'vue'
import { camelCase, upperFirst, reduce } from 'lodash'
import { Optional, CombinedVueInstance, ExtendedVue } from '@/helpers/typeHelpers'

export const STANDARD_PORTAL_KEYS = {
  Toolbar: 'toolbar',
  Actions: 'actions',
  Nav: 'nav',
  SubnavAdmin: 'subnav-admin'
}

/**
 * We currently have multiple <portal> sources trying to use the same destination, which usually
 * results in the source being chosen at random. To solve this, we're using this custom portal state
 * manager which manages multiple claims to the same portal space and only allows one source to use it at a time.
 */

const claims: Record<string, Record<string, { priority: number }>> = {}

const portalsState = Vue.observable({
  currentPortals: {} as Record<string, string>
})

function recalculateState() {
  const newPortals: Record<string, string> = {}
  for (const [portalKey, portalClaims] of Object.entries(claims)) {
    let highestPriority: Optional<{
      identity: string
      priority: number
    }> = undefined
    for (const [identity, data] of Object.entries(portalClaims)) {
      if (!highestPriority || data.priority > highestPriority.priority) {
        highestPriority = { priority: data.priority, identity }
      } else if (
        highestPriority.priority === data.priority &&
        highestPriority.identity === identity
      ) {
        console.error(
          'Multiple portals with the same priority encountered, your portals might not act deterministically'
        )
      }
    }

    if (highestPriority?.identity) {
      newPortals[portalKey] = highestPriority.identity
    }
  }

  Vue.set(portalsState, 'currentPortals', newPortals)
}

/**
 * Claim access to a specific toolbar
 */
export function claimPortal(portal: string, identity: string, priority: number) {
  // Register claim
  if (!claims[portal]) {
    claims[portal] = {}
  }

  claims[portal][identity] = { priority }

  recalculateState()
}

/**
 * Claim access to multiple toolbars
 */
export function claimPortals(portals: string[], identity: string, priority: number) {
  for (const portal of portals) {
    claimPortal(portal, identity, priority)
  }
}

/**
 * Remove claim to a specific toolbar
 */
export function unclaimPortal(portal: string, identity: string) {
  if (claims[portal]) {
    delete claims[portal][identity]
  }
  recalculateState()
}

/**
 * Remove claims to multiple toolbars
 */
export function unclaimPortals(portals: string[], identity: string) {
  for (const portal of portals) {
    unclaimPortal(portal, identity)
  }
}

/**
 * Check if portal source is allowed to render in the target portal
 */
export function canRenderPortalSource(portal: string, identity: string): boolean {
  return portalsState.currentPortals[portal] === identity
}

/**
 * Build mixin for tracking whether portal targets can be rendered to
 * @param portals Portal identifier keys
 * @param identity The unique identity of the portal source
 * @param priority Priority starting from 0. Higher priorities will take precedence
 * over other portal sources.
 */
export function buildPortalStateMixin(
  portals: string[],
  identity: string,
  priority: number
): ExtendedVue<
  Vue,
  unknown,
  unknown,
  {
    allowedPortals: Record<string, boolean>
    canRenderToolbarPortal?: boolean
    canRenderActionsPortal?: boolean
    canRenderNavPortal?: boolean
    canRenderSubnavPortal?: boolean
  }
> {
  return Vue.extend({
    computed: {
      /**
       * Object with keys of portal names and values representing if the component
       * is allowed to use those portals
       */
      allowedPortals() {
        const res: Record<string, boolean> = {}
        for (const portal of portals) {
          res[portal] = portalsState.currentPortals[portal] === identity
        }
        return res
      },

      /**
       * Dynamically generates `canRenderXPortal` computeds
       */
      ...reduce(
        portals,
        (res, portal) => {
          const computedKey = `canRender${upperFirst(camelCase(portal))}Portal`
          res[computedKey] = function (
            this: CombinedVueInstance<
              Vue,
              unknown,
              unknown,
              { allowedPortals: Record<string, boolean> }
            >
          ) {
            return !!this.allowedPortals[portal]
          }
          return res
        },
        {} as Record<string, () => boolean>
      )
    },
    mounted() {
      claimPortals(portals, identity, priority)
    },
    beforeDestroy() {
      unclaimPortals(portals, identity)
    }
  })
}

/**
 * Composition API version of the portal state mixin - tracks whether portal targets can be rendered to
 * @param portals Portal identifier keys
 * @param identity The unique identity of the portal source
 * @param priority Priority starting from 0. Higher priorities will take precedence
 * over other portal sources.
 */
export function usePortalState(portals: string[], identity: string, priority: number) {
  const allowedPortals = computed(() => {
    const res: Record<string, boolean> = {}
    for (const portal of portals) {
      res[portal] = portalsState.currentPortals[portal] === identity
    }
    return res
  })

  const canRenderToolbarPortal = computed(
    () => !!allowedPortals.value[STANDARD_PORTAL_KEYS.Toolbar]
  )
  const canRenderActionsPortal = computed(
    () => !!allowedPortals.value[STANDARD_PORTAL_KEYS.Actions]
  )
  const canRenderNavPortal = computed(
    () => !!allowedPortals.value[STANDARD_PORTAL_KEYS.Nav]
  )
  const canRenderSubnavPortal = computed(
    () => !!allowedPortals.value[STANDARD_PORTAL_KEYS.SubnavAdmin]
  )

  onMounted(() => {
    claimPortals(portals, identity, priority)
  })

  onBeforeUnmount(() => {
    unclaimPortals(portals, identity)
  })

  return {
    allowedPortals,
    canRenderToolbarPortal,
    canRenderActionsPortal,
    canRenderNavPortal,
    canRenderSubnavPortal
  }
}
