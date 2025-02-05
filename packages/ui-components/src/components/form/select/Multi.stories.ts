import { wait } from '@speckle/shared'
import type { Meta, StoryObj } from '@storybook/vue3'
import FormSelectMulti from './Multi.vue'
import { isRequired } from '~~/src/helpers/common/validation'

type FakeItemType = { id: string; name: string }

type StoryType = StoryObj<
  Record<string, unknown> & {
    'update:modelValue': (val: FakeItemType[]) => void
  }
>

const fakeItems: FakeItemType[] = [
  {
    id: '1',
    name: 'Rocky Balboa'
  },
  {
    id: '2',
    name: 'Bozo the Clown'
  },
  {
    id: '3',
    name: `Some jabroni with a super very long name, I mean look at it, it's way too long for a select box!`
  },
  {
    id: '4',
    name: 'Miss America 1987'
  },
  {
    id: '5',
    name: 'Brad Pitt'
  }
]

export default {
  component: FormSelectMulti,
  parameters: {
    docs: {
      description: {
        component: 'Multi-select component for selecting multiple items from a list.'
      }
    }
  },
  argTypes: {
    'update:modelValue': {
      type: 'function',
      action: 'v-model'
    },
    'nothing-selected': {
      type: 'string',
      description: 'Slot for rendering selectbox contents when nothing is selected'
    },
    'something-selected': {
      type: 'string',
      description: 'Slot for rendering selectbox contents when items are selected'
    },
    option: {
      type: 'string',
      description: 'Slot for rendering each option'
    },
    filterPredicate: {
      type: 'function'
    },
    getSearchResults: {
      type: 'function'
    },
    disabled: {
      type: 'boolean'
    },
    buttonStyle: {
      options: ['base', 'simple', 'tinted'],
      control: { type: 'select' }
    }
  }
} as Meta

export const Default: StoryType = {
  render: (args, ctx) => ({
    components: { FormSelectMulti },
    setup: () => {
      return { args }
    },
    template: `
      <div class="flex justify-center h-72 w-full">
        <FormSelectMulti v-bind="args" class="max-w-xs w-full" @update:modelValue="onModelUpdate"/>
      </div>
    `,
    methods: {
      onModelUpdate(val: FakeItemType[]) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    items: fakeItems,
    modelValue: [],
    search: false,
    filterPredicate: (val: FakeItemType, search: string) =>
      val.name.toLowerCase().includes(search.toLowerCase()),
    getSearchResults: undefined,
    searchPlaceholder: 'Search',
    label: 'Choose items',
    showLabel: false,
    by: 'name',
    name: 'example',
    clearable: true,
    buttonStyle: 'base',
    disabled: false,
    mountMenuOnBody: false
  }
}

export const WithLabel: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    showLabel: true
  }
}

export const WithSearch: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    search: true
  }
}

export const WithAsyncSearch: StoryType = {
  ...WithSearch,
  args: {
    ...WithSearch.args,
    items: undefined,
    filterPredicate: undefined,
    getSearchResults: async (search: string): Promise<FakeItemType[]> => {
      const items = fakeItems.filter((val) =>
        val.name.toLowerCase().includes(search.toLowerCase())
      )
      await wait(2000)
      return items
    }
  }
}

export const WithValidation: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    showLabel: true,
    label: 'Required Items',
    rules: [isRequired],
    help: 'Please select at least one item',
    showRequired: true,
    validateOnValueUpdate: true
  }
}

export const Disabled: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    disabled: true
  }
}

export const WithDisabledItems: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    disabledItemPredicate: (item: FakeItemType) => item.id === '3'
  }
}

export const WithCustomSlots: StoryType = {
  ...Default,
  args: {
    ...Default.args,
    'nothing-selected': 'Select multiple items',
    'something-selected': 'Items selected',
    option: 'OPTION SLOT'
  }
}
