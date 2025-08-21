import type { Meta, StoryObj } from '@storybook/vue3'
import LayoutMenu from '~~/src/components/layout/Menu.vue'
import type { LayoutMenuItem } from '~~/src/helpers/layout/components'
import FormButton from '~~/src/components/form/Button.vue'
import { EllipsisVerticalIcon, StarIcon } from '@heroicons/vue/24/solid'
import { action } from '@storybook/addon-actions'
import { computed, ref } from 'vue'
import { HorizontalDirection } from '~~/src/lib'
import { StringEnum, type StringEnumValues } from '@speckle/shared'
import { includes } from 'lodash-es'

type StoryType = StoryObj<
  Record<string, unknown> & {
    'update:open': (val: boolean) => void
  }
>

export default {
  component: LayoutMenu,
  parameters: {
    docs: {
      description: {
        component: 'Standard triggerable menu'
      },
      story: {
        inline: false,
        iframeHeight: 500
      }
    }
  },
  argTypes: {
    'update:open': {
      type: 'function',
      action: 'update:open'
    },
    size: {
      control: { type: 'select' },
      options: ['base', 'lg']
    },
    menuPosition: {
      control: { type: 'select' },
      options: ['left', 'right'],
      mapping: {
        left: HorizontalDirection.Left,
        right: HorizontalDirection.Right
      }
    }
  }
} as Meta

const defaultItems = (
  params?: Partial<{ withTooltip: boolean; withActive: boolean }>
): LayoutMenuItem<'a' | 'b' | 'c' | 'd'>[][] => [
  [
    {
      title: 'First Group Item - #1',
      id: 'a',
      disabled: false,
      icon: StarIcon
    },
    {
      title: 'First Group Item - #2 (Disabled)',
      id: 'b',
      disabled: true,
      disabledTooltip: params?.withTooltip ? "Here's why it is disabled..." : undefined
    }
  ],
  [
    {
      title: 'Second Group Item - #1',
      id: 'c',
      disabled: false,
      color: 'info'
    },
    {
      title: 'Short',
      id: 'd',
      disabled: false,
      color: 'info',
      active: params?.withActive
    }
  ]
]

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { LayoutMenu, FormButton, EllipsisVerticalIcon },
    setup() {
      const showMenu = ref(false)
      return { args, chosen: action('chosen'), showMenu }
    },
    template: `
    <div>
      <LayoutMenu
        @click.stop.prevent
        v-bind="args"
        v-model:open="showMenu"
        :items="args.items"
        @chosen="chosen"
        @update:open="args['update:open']"
      >
        <FormButton @click="showMenu = !showMenu">
          <EllipsisVerticalIcon class="w-4 h-4" />
          Click me!
        </FormButton>
      </LayoutMenu>
    </div>`,
    methods: {
      onOpenUpdate(val: boolean) {
        args['update:open'](val)
        ctx.updateArgs({ ...args, open: val })
      }
    }
  }),
  args: {
    open: false,
    items: defaultItems()
  }
}

export const WithDisabledTooltip: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    items: defaultItems({ withTooltip: true })
  }
}

const longItems: LayoutMenuItem[][] = [
  [
    {
      title: 'Long Item - #1 - asd asd asd',
      id: 'a'
    },
    {
      title: 'Long Item - #2 - ba baba ba ba',
      id: 'b'
    }
  ]
]

export const WithResponsiveMenuDirection: StoryType = {
  ...Default,
  render: (args, ctx) => ({
    components: { LayoutMenu, FormButton, EllipsisVerticalIcon },
    setup() {
      const Location = StringEnum([
        'TopLeft',
        'TopCenter',
        'TopRight',
        'BottomLeft',
        'BottomCenter',
        'BottomRight'
      ])
      type Location = StringEnumValues<typeof Location>

      const location = ref<Location>(Location.TopLeft)
      const showMenu = ref(false)

      const changeLocation = () => {
        switch (location.value) {
          case Location.TopLeft:
            location.value = Location.TopCenter
            break
          case Location.TopCenter:
            location.value = Location.TopRight
            break
          case Location.TopRight:
            location.value = Location.BottomLeft
            break
          case Location.BottomLeft:
            location.value = Location.BottomCenter
            break
          case Location.BottomCenter:
            location.value = Location.BottomRight
            break
          case Location.BottomRight:
            location.value = Location.TopLeft
            break
        }
      }

      const wrapperClasses = computed(() => {
        const classParts: string[] = []

        // x axis
        const isLeft = includes([Location.TopLeft, Location.BottomLeft], location.value)
        const isRight = includes(
          [Location.TopRight, Location.BottomRight],
          location.value
        )
        const isCenter = includes(
          [Location.TopCenter, Location.BottomCenter],
          location.value
        )
        if (isLeft) {
          classParts.push('items-start')
        } else if (isRight) {
          classParts.push('items-end')
        } else if (isCenter) {
          classParts.push('items-center')
        }

        // y axis
        const isTop = includes(
          [Location.TopLeft, Location.TopCenter, Location.TopRight],
          location.value
        )
        const isBottom = includes(
          [Location.BottomLeft, Location.BottomCenter, Location.BottomRight],
          location.value
        )
        if (isTop) {
          classParts.push('justify-start')
        } else if (isBottom) {
          classParts.push('justify-end')
        }

        return classParts.join(' ')
      })

      return {
        args,
        chosen: action('chosen'),
        showMenu,
        changeLocation,
        location,
        longItems,
        wrapperClasses
      }
    },
    // -2rem for padding added by storybook
    template: `
      <div class="flex gap-2 flex-col min-h-[calc(100vh-2rem)]">
        <FormButton @click="changeLocation">Change location</FormButton>
        <div :class="['flex gap-2 flex-col grow', wrapperClasses]">
          <LayoutMenu
            v-bind="args"
            @click.stop.prevent
            v-model:open="showMenu"
            :items="longItems"
            @chosen="chosen"
            @update:open="args['update:open']"
          >
            <FormButton @click="showMenu = !showMenu">
              <EllipsisVerticalIcon class="w-4 h-4" />
              Open menu
            </FormButton>
          </LayoutMenu>
        </div>
      </div>
    `,
    methods: {
      onOpenUpdate(val: boolean) {
        args['update:open'](val)
        ctx.updateArgs({ ...args, open: val })
      }
    }
  }),
  args: {
    ...Default.args
  }
}

export const WithResponseBodyMountedMenuDirection: StoryType = {
  ...WithResponsiveMenuDirection,
  args: {
    ...WithResponsiveMenuDirection.args,
    mountMenuOnBody: true
  }
}

export const WithRightTicks: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    items: defaultItems({ withActive: true }),
    showTicks: 'right'
  }
}
