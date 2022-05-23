import Vue from 'vue'
import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'
import reduce from 'lodash/reduce'

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

/**
 * @type {{currentPortals: Object<string, string>}}
 */
export const portalsState = Vue.observable({
  currentPortals: {}
})

/**
 * @type {Object<string, Object<string, {priority: number }>>}
 */
const claims = {}

function recalculateState() {
  const newPortals = {}
  for (const [portalKey, portalClaims] of Object.entries(claims)) {
    let highestPriority = undefined
    let highestPriorityIdentity = undefined
    for (const [identity, data] of Object.entries(portalClaims)) {
      if (!highestPriorityIdentity || data.priority > highestPriority) {
        highestPriorityIdentity = identity
        highestPriority = data.priority
      } else if (
        highestPriority === data.priority &&
        highestPriorityIdentity === identity
      ) {
        console.error(
          'Multiple portals with the same priority encountered, your portals might not act deterministically'
        )
      }
    }
    newPortals[portalKey] = highestPriorityIdentity
  }

  Vue.set(portalsState, 'currentPortals', newPortals)
}

/**
 * Claim access to a specific toolbar
 * @param {string} portal
 * @param {string} identity
 * @param {number} priority
 */
export function claimPortal(portal, identity, priority) {
  // Register claim
  if (!claims[portal]) {
    claims[portal] = {}
  }

  claims[portal][identity] = { priority }

  recalculateState()
}

/**
 * Claim access to multiple toolbars
 * @param {string[]} portals
 * @param {string} identity
 * @param {number} priority
 */
export function claimPortals(portals, identity, priority) {
  for (const portal of portals) {
    claimPortal(portal, identity, priority)
  }
}

/**
 * Remove claim to a specific toolbar
 * @param {string} portal
 * @param {string} identity
 */
export function unclaimPortal(portal, identity) {
  if (claims[portal]) {
    delete claims[portal][identity]
  }
  recalculateState()
}

/**
 * Remove claims to multiple toolbars
 * @param {string[]} portals
 * @param {string} identity
 */
export function unclaimPortals(portals, identity) {
  for (const portal of portals) {
    unclaimPortal(portal, identity)
  }
}

/**
 * Check if portal source is allowed to render in the target portal
 * @param {string} portal
 * @param {string} identity
 * @returns {boolean}
 */
export function canRenderPortalSource(portal, identity) {
  return portalsState.currentPortals[portal] === identity
}

/**
 * Build mixin for tracking whether portal targets can be rendered to
 * @param {string[]} portals Portal identifier keys
 * @param {string} identity The unique identity of the portal source
 * @param {number} priority Priority starting from 0. Higher priorities will take precedence
 * over other portal sources.
 */
export function buildPortalStateMixin(portals, identity, priority) {
  return {
    computed: {
      /**
       * Object with keys of portal names and values representing if the component
       * is allowed to use those portals
       */
      allowedPortals() {
        const res = {}
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
          res[computedKey] = function () {
            return !!this.allowedPortals[portal]
          }
          return res
        },
        {}
      )
    },
    mounted() {
      claimPortals(portals, identity, priority)
    },
    beforeDestroy() {
      unclaimPortals(portals, identity)
    }
  }
}
