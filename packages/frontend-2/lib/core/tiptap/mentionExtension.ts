import Mention from '@tiptap/extension-mention'
import { VueRenderer } from '@tiptap/vue-3'
import TiptapMentionList from '~~/components/common/tiptap/MentionList.vue'

import type { SuggestionKeyDownProps, SuggestionOptions } from '@tiptap/suggestion'
import type { ApolloClient } from '@apollo/client/core'
import { mentionsUserSearchQuery } from '~~/lib/common/graphql/queries'
import type { MentionsUserSearchQuery } from '~~/lib/common/generated/gql/graphql'
import type { Get } from 'type-fest'
import tippy from 'tippy.js'
import type { Instance, GetReferenceClientRect } from 'tippy.js'
import type { Optional } from '@speckle/shared'

export type SuggestionOptionsItem = NonNullable<
  Get<MentionsUserSearchQuery, 'userSearch.items[0]'>
>

export type MentionData = { label: string; id: string }

const suggestionOptions: Omit<SuggestionOptions<SuggestionOptionsItem>, 'editor'> = {
  items: async ({ query }) => {
    if (query.length < 3) return []

    const { $apollo } = useNuxtApp()
    const apolloClient = ($apollo as { default: ApolloClient<unknown> }).default
    const { data } = await apolloClient.query({
      query: mentionsUserSearchQuery,
      variables: {
        query
      }
    })

    return data.userSearch?.items || []
  },
  render: () => {
    let component: VueRenderer
    let popup: Instance[]

    return {
      onStart: (props) => {
        component = new VueRenderer(TiptapMentionList, {
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
}

export const getMentionExtension = () =>
  Mention.configure({
    suggestion: suggestionOptions,
    HTMLAttributes: {
      class: 'editor-mention'
    }
  })
