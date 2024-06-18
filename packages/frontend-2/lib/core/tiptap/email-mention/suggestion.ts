/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Editor, Range } from '@tiptap/core'
import type { EditorState } from '@tiptap/pm/state'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

import tippy from 'tippy.js'
import type { Instance, GetReferenceClientRect } from 'tippy.js'
import TiptapEmailMentionPopup from '~~/components/common/tiptap/EmailMentionPopup.vue'
import { VueRenderer } from '@tiptap/vue-3'
import { mentionsUserSearchQuery } from '~~/lib/common/graphql/queries'
import type { ApolloClient } from '@apollo/client/core'
import type {
  MentionData,
  SuggestionOptionsItem
} from '~~/lib/core/tiptap/mentionExtension'
import type { Optional } from '@speckle/shared'
import { inviteProjectUserMutation } from '~~/lib/projects/graphql/mutations'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { findSuggestionMatch } from '~~/lib/core/tiptap/email-mention/findSuggestionMatch'

/**
 * This is essentially the original Tiptap suggestion extension adapted to support the specialized
 * email mention use case. A bit of a mess probably, but this low level prosemirror stuff is quite complicated
 * and I just tried my best to reverse engineer it.
 */

export type SuggestionCommandProps = {
  mention: MentionData | null
  email: string | null
}

type SuggestionCommand = (props: {
  editor: Editor
  range: Range
  props: SuggestionCommandProps
  nodeName: string
  projectId: string
}) => void

type AllowFn = (props: {
  editor: Editor
  state: EditorState
  range: Range
  nodeName: string
}) => boolean

type SuggestionRenderer = () => {
  onBeforeStart?: (props: SuggestionProps) => void
  onStart?: (props: SuggestionProps) => void
  onBeforeUpdate?: (props: SuggestionProps) => void
  onUpdate?: (props: SuggestionProps) => void
  onExit?: (props: SuggestionProps) => void
  onKeyDown?: (props: SuggestionKeyDownProps) => boolean
}

export interface SuggestionOptions {
  editor: Editor
  nodeName: string
  projectId: string
}

export interface SuggestionProps {
  editor: Editor
  range: Range
  query: string | null
  text: string | null
  items: SuggestionOptionsItem[]
  command: (props: SuggestionCommandProps) => void
  decorationNode: Element | null
  clientRect?: (() => DOMRect | null) | null
}

export interface SuggestionKeyDownProps {
  view: EditorView
  event: KeyboardEvent
  range: Range
}

type SuggestionPluginState = {
  active: boolean
  range: Range
  query: null | string
  text: null | string
  composing: boolean
  decorationId?: string | null
}

const inviteEmail = async (email: string, projectId: string) => {
  if (!email) return

  const { $apollo } = useNuxtApp()
  const { triggerNotification } = useGlobalToast()
  const apolloClient = ($apollo as { default: ApolloClient<unknown> }).default

  const { data, errors } = await apolloClient
    .mutate({
      mutation: inviteProjectUserMutation,
      variables: {
        input: { email },
        projectId
      }
    })
    .catch(convertThrowIntoFetchResult)

  if (data?.projectMutations.invites.batchCreate.id) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Invite sent'
    })
  } else {
    const errMsg = getFirstErrorMessage(errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Invitation failed',
      description: errMsg
    })
  }
}

const command: SuggestionCommand = ({ editor, range, props, nodeName, projectId }) => {
  // increase range.to by one when the next node is of type "text"
  // and starts with a space character
  const nodeAfter = editor.view.state.selection.$to.nodeAfter
  const overrideSpace = nodeAfter?.text?.startsWith(' ')

  if (overrideSpace) {
    range.to += 1
  }

  const chain = editor.chain().focus()

  if (props.mention) {
    // Insert mention
    chain
      .insertContentAt(range, [
        {
          type: 'mention',
          attrs: props.mention
        },
        {
          type: 'text',
          text: ' '
        }
      ])
      .run()
  } else if (props.email) {
    // Insert email mention
    chain
      .insertContentAt(range, [
        {
          type: nodeName,
          attrs: {
            email: props.email
          }
        },
        {
          type: 'text',
          text: ' '
        }
      ])
      .run()

    inviteEmail(props.email, projectId)
  }

  window.getSelection()?.collapseToEnd()
}

const allow: AllowFn = (props) => {
  const { state, range, nodeName } = props

  const $from = state.doc.resolve(range.from)
  const type = state.schema.nodes[nodeName]
  const allow = !!$from.parent.type.contentMatch.matchType(type)
  return allow
}

const getItems = async (params: { editor: Editor; query: string | null }) => {
  const { query } = params
  if (!query?.length) return []

  const { $apollo } = useNuxtApp()
  const apolloClient = ($apollo as { default: ApolloClient<unknown> }).default
  const { data } = await apolloClient.query({
    query: mentionsUserSearchQuery,
    variables: {
      query,
      emailOnly: true
    }
  })

  return data.userSearch?.items || []
}

const buildRenderer: SuggestionRenderer = () => {
  let component: VueRenderer
  let popup: Instance[]

  return {
    onStart: (props) => {
      component = new VueRenderer(TiptapEmailMentionPopup, {
        props,
        editor: props.editor
      })

      if (!props.clientRect) {
        return
      }

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect as null | GetReferenceClientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        theme: 'mention'
      })
    },

    onUpdate(props) {
      component.updateProps(props)

      if (!props.clientRect) {
        return
      }

      popup[0].setProps({
        getReferenceClientRect: props.clientRect as null | GetReferenceClientRect
      })
    },

    onKeyDown(props) {
      if (props.event.key === 'Escape') {
        popup[0].hide()
        return true
      }

      return (
        (
          component?.ref as Optional<{
            onKeyDown: (props: SuggestionKeyDownProps) => boolean
          }>
        )?.onKeyDown(props) || false
      )
    },

    onExit() {
      popup[0].destroy()
      component.destroy()
      component.element.remove()
    }
  }
}

export const SuggestionPluginKey = new PluginKey<SuggestionPluginState>(
  'emailSuggestion'
)

export function EmailSuggestion({ editor, nodeName, projectId }: SuggestionOptions) {
  let props: SuggestionProps | undefined

  const allowSpaces = false
  const allowedPrefixes = [' ']
  const startOfLine = false
  const decorationTag = 'span'
  const decorationClass = 'emailSuggestion'
  const items = getItems

  const renderer = buildRenderer()

  const plugin: Plugin<SuggestionPluginState> = new Plugin({
    key: SuggestionPluginKey,

    view() {
      return {
        update: async (view, prevState) => {
          const prev = this.key?.getState(prevState) as SuggestionPluginState
          const next = this.key?.getState(view.state) as SuggestionPluginState

          // See how the state changed
          const moved =
            prev.active && next.active && prev.range.from !== next.range.from
          const started = !prev.active && next.active
          const stopped = prev.active && !next.active
          const changed = !started && !stopped && prev.query !== next.query
          const handleStart = started || moved
          const handleChange = changed && !moved
          const handleExit = stopped || moved

          // Cancel when suggestion isn't active
          if (!handleStart && !handleChange && !handleExit) {
            return
          }

          const state = handleExit && !handleStart ? prev : next
          const decorationNode = view.dom.querySelector(
            `[data-decoration-id="${state.decorationId}"]`
          )

          props = {
            editor,
            range: state.range,
            query: state.query,
            text: state.text,
            items: [],
            command: (commandProps) => {
              command({
                editor,
                range: state.range,
                props: commandProps,
                nodeName,
                projectId
              })
            },
            decorationNode,
            // virtual node for popper.js or tippy.js
            // this can be used for building popups without a DOM node
            clientRect: decorationNode
              ? () => {
                  // because of `items` can be asynchrounous we’ll search for the current decoration node
                  const { decorationId } = this.key?.getState(
                    editor.state
                  ) as SuggestionPluginState
                  const currentDecorationNode = view.dom.querySelector(
                    `[data-decoration-id="${decorationId}"]`
                  )

                  return currentDecorationNode?.getBoundingClientRect() || null
                }
              : null
          }

          if (handleStart) {
            renderer?.onBeforeStart?.(props)
          }

          if (handleChange) {
            renderer?.onBeforeUpdate?.(props)
          }

          if (handleChange || handleStart) {
            props.items = await items({
              editor,
              query: state.query
            })
          }

          if (handleExit) {
            renderer?.onExit?.(props)
          }

          if (handleChange) {
            renderer?.onUpdate?.(props)
          }

          if (handleStart) {
            renderer?.onStart?.(props)
          }
        },

        destroy: () => {
          if (!props) {
            return
          }

          renderer?.onExit?.(props)
        }
      }
    },

    state: {
      // Initialize the plugin's internal state.
      init() {
        const state: {
          active: boolean
          range: Range
          query: null | string
          text: null | string
          composing: boolean
          decorationId?: string | null
        } = {
          active: false,
          range: {
            from: 0,
            to: 0
          },
          query: null,
          text: null,
          composing: false
        }

        return state
      },

      // Apply changes to the plugin state from a view transaction.
      apply(transaction, prev, oldState, state) {
        const { isEditable } = editor
        const { composing } = editor.view
        const { selection } = transaction
        const { empty, from } = selection
        const next = { ...prev }

        next.composing = composing

        // We can only be suggesting if the view is editable, and:
        //   * there is no selection, or
        //   * a composition is active (see: https://github.com/ueberdosis/tiptap/issues/1449)
        if (isEditable && (empty || editor.view.composing)) {
          // Reset active state if we just left the previous suggestion range
          if (
            (from < prev.range.from || from > prev.range.to) &&
            !composing &&
            !prev.composing
          ) {
            next.active = false
          }

          // Try to match against where our cursor currently is
          const match = findSuggestionMatch({
            allowSpaces,
            allowedPrefixes,
            startOfLine,
            $position: selection.$from as any // some kind of dependency version mismatch bug here
          })
          const decorationId = `id_${Math.floor(Math.random() * 0xffffffff)}`

          // If we found a match, update the current state to show it
          if (match && allow({ editor, state, range: match.range, nodeName })) {
            next.active = true
            next.decorationId = prev.decorationId ? prev.decorationId : decorationId
            next.range = match.range
            next.query = match.query
            next.text = match.text
          } else {
            next.active = false
          }
        } else {
          next.active = false
        }

        // Make sure to empty the range if suggestion is inactive
        if (!next.active) {
          next.decorationId = null
          next.range = { from: 0, to: 0 }
          next.query = null
          next.text = null
        }

        return next
      }
    },

    props: {
      // Call the keydown hook if suggestion is active.
      handleKeyDown(view, event) {
        const { active, range } = plugin.getState(view.state)!

        if (!active) {
          return false
        }

        return renderer?.onKeyDown?.({ view, event, range }) || false
      },

      // Setup decorator on the currently active suggestion.
      decorations(state) {
        const { active, range, decorationId } = plugin.getState(state)!

        if (!active) {
          return null
        }

        return DecorationSet.create(state.doc, [
          Decoration.inline(range.from, range.to, {
            nodeName: decorationTag,
            class: decorationClass,
            ...(decorationId ? { 'data-decoration-id': decorationId } : {})
          })
        ])
      }
    }
  })

  return plugin
}
