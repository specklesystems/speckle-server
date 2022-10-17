export type ViewerOptions = {
  /**
   * Extra objects to overlay on top of the base model
   */
  overlay: string
  /**
   * Camera position
   */
  c: string
  /**
   * Serialized viewer filters
   */
  filter: string
}

export type EmbedParams = Partial<ViewerOptions> & {
  /**
   * The stream being embedded (required)
   */
  streamId: string

  /**
   * Stream branch to embed
   */
  branchName?: string

  /**
   * Stream object to embed
   */
  objectId?: string

  /**
   * Stream commit to embed
   */
  commitId?: string
}

export type EmbedOptions = {
  /**
   * Whether the BG of the embed should be transparent
   */
  transparent: boolean

  /**
   * Whether to eager-load the embed
   */
  autoload: boolean

  /**
   * Whether to hide viewer controls
   */
  hideControls: boolean

  /**
   * Whether to prevent scrolling (zooming)
   */
  noScroll: boolean

  /**
   * Whether to hide sidebar (filters, views, etc.)
   */
  hideSidebar: boolean

  /**
   * Whether to hide object selection info
   */
  hideSelectionInfo: boolean

  /**
   * Whether to hide the Speckle logo
   */
  hideLogo: boolean

  /**
   * Enable comment slideshow mode, where the browser auto-expands the 1st comment and subsequent
   * comments can be easily reached by clicking arrow buttons
   */
  commentSlideshow: boolean
}

/**
 * Build an embed URL
 */
export function buildEmbedUrl(
  params: EmbedParams,
  options?: Partial<EmbedOptions>
): string {
  const { streamId, branchName, objectId, commitId, overlay, c, filter } = params
  const {
    transparent,
    autoload,
    hideControls,
    noScroll,
    hideSidebar,
    hideSelectionInfo,
    hideLogo,
    commentSlideshow
  } = options || {}

  const baseUrl = new URL('/embed', window.location.origin)

  const queryParams = new URLSearchParams()
  queryParams.set('stream', streamId)

  // Add main identifier params
  if (objectId) {
    queryParams.set('object', objectId)
  } else if (commitId) {
    queryParams.set('commit', commitId)
  } else if (branchName) {
    queryParams.set('branch', branchName)
  }

  // Add viewer options
  if (overlay) {
    queryParams.set('overlay', overlay)
  }
  if (c) {
    queryParams.set('c', c)
  }
  if (filter) {
    queryParams.set('filter', filter)
  }

  // Add embed options
  if (transparent) {
    queryParams.set('transparent', 'true')
  }
  if (autoload) {
    queryParams.set('autoload', 'true')
  }
  if (hideControls) {
    queryParams.set('hidecontrols', 'true')
  }
  if (noScroll) {
    queryParams.set('noscroll', 'true')
  }
  if (hideSidebar) {
    queryParams.set('hidesidebar', 'true')
  }
  if (hideSelectionInfo) {
    queryParams.set('hideselectioninfo', 'true')
  }
  if (hideLogo) {
    queryParams.set('ilovespeckleanyway', 'true')
  }
  if (commentSlideshow) {
    queryParams.set('commentslideshow', 'true')
  }

  baseUrl.search = queryParams.toString()
  return baseUrl.toString()
}

export function wrapUrlInIFrame(url: string) {
  return `<iframe src="${url}" width="600" height="400" frameborder="0"></iframe>`
}
