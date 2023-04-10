import { wait } from '@speckle/shared'
import { Meta, StoryObj } from '@storybook/vue3'
import FormSelectBase from '~~/components/form/select/Base.vue'
import { isRequired } from '~~/lib/common/helpers/validation'

type FakeItemType = { id: string; name: string }

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
  },
  {
    id: '6',
    name: 'Kevin McCallister'
  },
  {
    id: '7',
    name: 'Rickety Cricket'
  },
  {
    id: '8',
    name: 'Master Chief'
  }
]

export default {
  component: FormSelectBase,
  parameters: {
    docs: {
      description: {
        component: 'Base component for implementing various kinds of select boxes.'
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
      description: 'Slot for rendering selectbox contents when something is selected'
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
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args, ctx) => ({
    components: { FormSelectBase },
    setup: () => {
      return { args }
    },
    template: `
      <div class="flex justify-center h-72">
        <FormSelectBase v-bind="args" class="max-w-xs w-full" @update:modelValue="onModelUpdate"/>
      </div>
    `,
    methods: {
      onModelUpdate(val: FakeItemType) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    multiple: false,
    items: fakeItems,
    modelValue: undefined,
    search: false,
    filterPredicate: (val: FakeItemType, search: string) =>
      val.name.toLowerCase().includes(search.toLowerCase()),
    getSearchResults: undefined,
    searchPlaceholder: 'Search',
    label: 'Choose an item',
    showLabel: false,
    by: 'name',
    name: 'example'
  }
}

export const WithCustomSlots: StoryObj = {
  render: (args, ctx) => ({
    components: { FormSelectBase },
    setup: () => {
      return { args }
    },
    template: `
      <div class="flex justify-center h-72">
        <FormSelectBase v-bind="args" class="max-w-xs w-full" @update:modelValue="onModelUpdate">
          <template #nothing-selected>{{ args['nothing-selected'] }}</template>
          <template #something-selected>{{ args['something-selected'] }}</template>
          <template #option>{{ args['option'] }}</template>
        </FormSelectBase>
      </div>
    `,
    methods: {
      onModelUpdate(val: FakeItemType) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    ...Default.args,
    'nothing-selected': 'NOTHING SELECTED SLOT',
    'something-selected': 'SOMETHING SELECTED SLOT',
    option: 'OPTION SLOT'
  },
  parameters: {
    docs: {
      description: {
        story: 'Use slots to change how various aspects render'
      }
    }
  }
}

export const Disabled: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    disabled: true
  }
}

export const WithValidation: StoryObj = {
  render: (args, ctx) => ({
    components: { FormSelectBase },
    setup: () => {
      return { args }
    },
    template: `
      <div class="flex justify-center h-72">
        <FormSelectBase v-bind="args" class="max-w-xs w-full" @update:modelValue="onModelUpdate" validate-on-mount/>
      </div>
    `,
    methods: {
      onModelUpdate(val: FakeItemType) {
        args['update:modelValue'](val)
        ctx.updateArgs({ ...args, modelValue: val })
      }
    }
  }),
  args: {
    multiple: false,
    items: fakeItems,
    modelValue: undefined,
    search: false,
    filterPredicate: (val: FakeItemType, search: string) =>
      val.name.toLowerCase().includes(search.toLowerCase()),
    searchPlaceholder: 'Search',
    label: 'Item',
    showLabel: true,
    by: 'name',
    rules: [isRequired],
    help: 'This is a random help message'
  }
}

export const WithFilter: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    search: true
  }
}

export const WithAsyncSearch: StoryObj = {
  ...WithFilter,
  args: {
    ...WithFilter.args,
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

export const Empty: StoryObj = {
  ...WithAsyncSearch,
  args: {
    ...WithAsyncSearch.args,
    getSearchResults: () => []
  }
}
