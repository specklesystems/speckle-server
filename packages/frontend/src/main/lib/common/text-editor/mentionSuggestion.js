import { VueRenderer } from '@tiptap/vue-2'
import SmartTextEditorMentionList from '@/main/components/common/text-editor/SmartTextEditorMentionList.vue'
import Popper from 'popper.js'
import vuetify from '@/plugins/vuetify'
import { getApolloProvider } from '@/config/apolloConfig'
import { userSearchQuery } from '@/graphql/user'

/**
 * @type {import('@tiptap/suggestion').SuggestionOptions}
 */
export const suggestion = {
  items: async ({ query }) => {
    if ((query?.length || 0) < 3) {
      return undefined
    }

    // Execute users search query
    const client = getApolloProvider().defaultClient
    const { data } = await client.query({
      query: userSearchQuery,
      variables: {
        query,
        limit: 5,
        archived: false
      }
    })

    return data.userSearch.items
  },

  render: () => {
    /** @type {import('@tiptap/vue-2').VueRenderer} */
    let component
    /** @type {import('popper.js').default} */
    let popup
    /** @type {Function} */
    let clickHandler

    const hidePopup = () => {
      if (!popup) return

      popup.popper.style.display = 'none'
      popup.update()
    }

    return {
      onStart: (props) => {
        // Render mention list with popper.js (which we have because of v-tooltip)
        component = new VueRenderer(SmartTextEditorMentionList, {
          parent: undefined,
          propsData: props,
          vuetify
        })
        document.getElementsByClassName('v-application')[0].append(component.element)

        if (!props.clientRect) {
          return
        }

        popup = new Popper(
          { getBoundingClientRect: props.clientRect },
          component.element
        )

        // Init click handler for hiding when clicking outside of the popper
        /** @param {MouseEvent} e */
        clickHandler = (e) => {
          /** @type {Element} */
          const el = e.target
          const popperEl = popup.popper

          if (el !== popperEl && !popperEl.contains(el)) {
            hidePopup()
          }
        }
        document.addEventListener('click', clickHandler)
        document.addEventListener('touchend', clickHandler)
      },

      onUpdate(props) {
        component.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup.reference.getBoundingClientRect = props.clientRect
        popup.update()
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          hidePopup()
          return true
        }

        return component.ref?.onKeyDown(props)
      },

      onExit() {
        popup.destroy()
        component.destroy()
        component.element.remove()

        document.removeEventListener('click', clickHandler)
        document.removeEventListener('touchend', clickHandler)
      }
    }
  }
}
