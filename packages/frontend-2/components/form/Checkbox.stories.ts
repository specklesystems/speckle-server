import FormCheckbox from '~~/components/form/Checkbox.vue'
import FormButton from '~~/components/form/Button.vue'
import { Meta, Story } from '@storybook/vue3'
import { action } from '@storybook/addon-actions'
import { Form, SubmissionHandler } from 'vee-validate'
import { VuePlayFunction } from '~~/lib/common/helpers/storybook'
import { userEvent, within } from '@storybook/testing-library'
import { wait } from '@speckle/shared'

export default {
  component: FormCheckbox,
  parameters: {
    docs: {
      description: {
        component:
          'A checkbox, integrated with vee-validate for validation. Feed in rules through the `rules` prop. A checkbox can exist on its own or as part of a group. Checkboxes are grouped if they have the same name and have a parent form. The value structure differs between grouped and ungrouped checkboxes. If a checkbox is grouped, its v-model value will be an array of all values of all checked checkboxes in the group. Otherwise, its v-model value will either be its value if its checked or undefined if it isnt.'
      }
    }
  },
  argTypes: {
    value: {
      type: 'string'
    },
    rules: {
      type: 'function'
    },
    'update:modelValue': {
      type: 'function',
      action: 'v-model'
    }
  }
} as Meta

const toggleCheckboxPlayFunction: VuePlayFunction = async (params) => {
  const canvas = within(params.canvasElement)
  const checkbox = canvas.getByRole('checkbox')

  userEvent.click(checkbox)
  await wait(1000)
  userEvent.click(checkbox)
}

export const Default: Story = {
  play: toggleCheckboxPlayFunction,
  render: (args) => ({
    components: { FormCheckbox },
    setup() {
      const vModelAction = action('v-model')

      return { args, vModelAction }
    },
    template: `<form-checkbox v-bind="args" @update:modelValue="vModelAction"/>`
  }),
  parameters: {
    docs: {
      source: {
        code: `<FormCheckbox name="group-name" value="checkbox-id" v-model="val" />`
      }
    }
  },
  args: {
    name: 'test1',
    label: 'Example Checkbox',
    description: 'Some help description here',
    showRequired: false,
    validateOnMount: false,
    inlineDescription: false,
    value: 'test1',
    disabled: false
  }
}

export const Group: Story = {
  render: (args) => ({
    components: { FormCheckbox, Form, FormButton },
    setup() {
      const fooModelValueHandler = action('foo@update:modelValue')
      const barModelValueHandler = action('bar@update:modelValue')
      const onSubmit: SubmissionHandler = (values) => action('onSubmit')(values)

      return { fooModelValueHandler, barModelValueHandler, onSubmit, args }
    },
    template: `
      <Form @submit="onSubmit">
        <FormCheckbox name="group1" value="foo" label="foo" @update:modelValue="fooModelValueHandler" alt="foo"/>
        <FormCheckbox name="group1" value="bar" label="bar" @update:modelValue="barModelValueHandler" alt="bar"/>
        <FormButton submit>Submit</FormButton>
      </Form>
    `
  }),
  play: async (params) => {
    const smallDelay = 500
    const bigDelay = 1000

    const canvas = within(params.canvasElement)

    const fooCheckbox = canvas.getByAltText('foo')
    const barCheckbox = canvas.getByAltText('bar')
    const button = canvas.getByRole('button')

    userEvent.click(fooCheckbox)
    await wait(smallDelay)
    userEvent.click(button)

    await wait(bigDelay)

    userEvent.click(barCheckbox)
    await wait(smallDelay)
    userEvent.click(button)

    await wait(bigDelay)

    userEvent.click(fooCheckbox)
    await wait(smallDelay)
    userEvent.click(barCheckbox)
    await wait(smallDelay)
    userEvent.click(button)
  },
  parameters: {
    docs: {
      description: {
        story:
          'Checkboxes with the same name are part of a group and on form submit the value will be an array of all selected values. Check actions of this story for an example!'
      }
    }
  }
}

export const InlineDescription: Story = {
  ...Default,
  args: {
    name: 'inline1',
    value: 'inline1-value',
    inlineDescription: true,
    label: 'Example checkbox',
    description: 'This is an inline description'
  }
}

export const Disabled: Story = {
  ...Default,
  args: {
    name: 'disabled1',
    value: 'disabled1-value',
    label: 'Disabled checkbox',
    disabled: true
  }
}

export const Required: Story = {
  ...Default,
  args: {
    name: 'required1',
    value: 'required1-value',
    label: 'Required checkbox',
    showRequired: true,
    rules: [(val: string | string[]) => (val ? true : 'This field is required')],
    validateOnMount: true
  }
}
