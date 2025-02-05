/* eslint-disable @typescript-eslint/no-explicit-any */
import FormCheckbox from '~~/src/components/form/Checkbox.vue'
import FormButton from '~~/src/components/form/Button.vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import { action } from '@storybook/addon-actions'
import type { RuleExpression, SubmissionHandler } from 'vee-validate'
import { Form } from 'vee-validate'
import { userEvent, within } from '@storybook/test'
import { wait } from '@speckle/shared'
import type { Optional } from '@speckle/shared'
import { expect } from '@storybook/test'
import type { VuePlayFunction } from '~~/src/stories/helpers/storybook'
import { computed } from 'vue'

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
    },
    id: {
      type: 'string'
    },
    labelPosition: {
      type: 'string'
    }
  }
} as Meta

const toggleCheckboxPlayFunction: VuePlayFunction = async (params) => {
  const canvas = within(params.canvasElement)
  const checkbox = canvas.getByRole('checkbox')

  await userEvent.click(checkbox)
  // expect(checkbox.checked).toBeTruthy()
  await wait(1000)
  await userEvent.click(checkbox)
  // expect(checkbox.checked).toBeFalsy()
}

const defaultArgs = {
  name: 'test1',
  label: 'Example Checkbox',
  description: 'Some help description here',
  showRequired: false,
  validateOnMount: false,
  inlineDescription: false,
  value: 'test1' as string | true,
  disabled: false,
  modelValue: undefined as Optional<string | true>,
  rules: undefined as Optional<RuleExpression<any>[]>,
  labelPosition: 'right' as 'right' | 'left'
}

export const Default: StoryObj<typeof defaultArgs> = {
  play: toggleCheckboxPlayFunction,
  render: (args, ctx) => ({
    components: { FormCheckbox },
    setup() {
      const vModelAction = action('v-model')
      const modelValue = computed({
        get: () => args.modelValue,
        set: (newVal) => {
          ctx.updateArgs({ ...args, modelValue: newVal })
          vModelAction(newVal)
        }
      })

      return { args, modelValue }
    },
    template: `<FormCheckbox v-bind="args" v-model="modelValue" />`
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
    disabled: false,
    modelValue: undefined
  }
}

export const Group: StoryObj<typeof defaultArgs> = {
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

    await userEvent.click(fooCheckbox)
    await wait(smallDelay)
    await userEvent.click(button)

    await wait(bigDelay)

    await userEvent.click(barCheckbox)
    await wait(smallDelay)
    await userEvent.click(button)

    await wait(bigDelay)

    await userEvent.click(fooCheckbox)
    await wait(smallDelay)
    await userEvent.click(barCheckbox)
    await wait(smallDelay)
    await userEvent.click(button)
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

export const InlineDescription: StoryObj<typeof defaultArgs> = {
  ...Default,
  args: {
    name: 'inline1',
    value: 'inline1-value',
    inlineDescription: true,
    label: 'Example checkbox',
    description: 'This is an inline description'
  }
}

export const Disabled: StoryObj<typeof defaultArgs> = {
  ...Default,
  play: async (params) => {
    const canvas = within(params.canvasElement)
    const checkbox = canvas.getByRole('checkbox')

    const isChecked = (checkbox as HTMLInputElement).checked

    // click and assert that checkbox checked state hasn't changed
    await userEvent.click(checkbox)

    const newIsChecked = (checkbox as HTMLInputElement).checked
    await expect(isChecked).toBe(newIsChecked)
  },
  args: {
    name: 'disabled1',
    value: 'disabled1-value',
    label: 'Disabled checkbox',
    disabled: true
  }
}

export const Required: StoryObj<typeof defaultArgs> = {
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

export const Single: StoryObj<typeof defaultArgs> = {
  ...Default,
  args: {
    ...Default.args,
    label: 'Single checkbox',
    name: 'single1',
    value: true
  },
  parameters: {
    docs: {
      description: {
        story:
          'Set `value` to `true` for non-grouped checkboxes. That way v-model will be `undefined` if unchecked or `true` if checked.'
      }
    }
  }
}

export const LeftLabel: StoryObj<typeof defaultArgs> = {
  ...Default,
  args: {
    ...Default.args,
    labelPosition: 'left'
  }
}
