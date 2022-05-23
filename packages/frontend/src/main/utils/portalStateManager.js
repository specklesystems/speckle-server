import Vue from 'vue'

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
