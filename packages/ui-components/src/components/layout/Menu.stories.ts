import type { Meta, StoryObj } from '@storybook/vue3'
import LayoutMenu from '~~/src/components/layout/Menu.vue'
import type { LayoutMenuItem } from '~~/src/helpers/layout/components'
import FormButton from '~~/src/components/form/Button.vue'
import { EllipsisVerticalIcon, StarIcon } from '@heroicons/vue/24/solid'
import { action } from '@storybook/addon-actions'
import { computed, ref } from 'vue'
import { HorizontalDirection } from '~~/src/lib'

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
  params?: Partial<{ withTooltip: boolean }>
): LayoutMenuItem<'a' | 'b' | 'c'>[][] => [
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
      const location = ref<string | undefined>('left')
      const showMenu = ref(false)

      const changeLocation = () => {
        if (location.value === 'left') {
          location.value = 'right'
        } else if (location.value === 'right') {
          location.value = undefined
        } else {
          location.value = 'left'
        }
      }

      const wrapperClasses = computed(() => {
        const classParts: string[] = []

        if (location.value === 'left') {
          classParts.push('items-start')
        } else if (location.value === 'right') {
          classParts.push('items-end')
        } else {
          classParts.push('items-center')
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
    template: `
    <div :class="['flex gap-2 flex-col', wrapperClasses]">
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
      <FormButton @click="changeLocation">Change location</FormButton>
    </div>`,
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
