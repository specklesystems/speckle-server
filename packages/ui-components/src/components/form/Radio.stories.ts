/* eslint-disable @typescript-eslint/no-explicit-any */
import Radio from '~~/src/components/form/Radio.vue'
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
import { computed, type ConcreteComponent } from 'vue'
import { ArrowRightIcon } from '@heroicons/vue/20/solid'

export default {
  component: Radio,
  parameters: {
    docs: {
      description: {
        component:
          'A radio, integrated with vee-validate for validation. Feed in rules through the `rules` prop. A radio can exist on its own or as part of a group. Radios are grouped if they have the same name and have a parent form. The value structure differs between grouped and ungrouped radios. If a radio is grouped, its v-model value will be an array of all values of all checked radios in the group. Otherwise, its v-model value will either be its value if its checked or undefined if it isnt.'
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
    }
  }
} as Meta

const toggleRadioPlayFunction: VuePlayFunction = async (params) => {
  const canvas = within(params.canvasElement)
  const radio = canvas.getByRole('radio')

  await userEvent.click(radio)
  // expect(radio.checked).toBeTruthy()
  await wait(1000)
  await userEvent.click(radio)
  // expect(radio.checked).toBeFalsy()
}

const defaultArgs = {
  name: 'test1',
  label: 'Example Radio',
  description: 'Some help description here',
  showRequired: false,
  validateOnMount: false,
  inlineDescription: false,
  value: 'test1' as string | true,
  disabled: false,
  modelValue: undefined as Optional<string | true>,
  rules: undefined as Optional<RuleExpression<any>[]>,
  icon: undefined as Optional<ConcreteComponent>
}

export const Default: StoryObj<typeof defaultArgs> = {
  play: toggleRadioPlayFunction,
  render: (args, ctx) => ({
    components: { Radio },
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
    template: `<Radio v-bind="args" v-model="modelValue" />`
  }),
  parameters: {
    docs: {
      source: {
        code: `<Radio name="group-name" value="radio-id" v-model="val" />`
      }
    }
  },
  args: {
    name: 'test1',
    label: 'Example Radio',
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
    components: { Radio, Form, FormButton },
    setup() {
      const fooModelValueHandler = action('foo@update:modelValue')
      const barModelValueHandler = action('bar@update:modelValue')
      const onSubmit: SubmissionHandler = (values) => action('onSubmit')(values)

      return { fooModelValueHandler, barModelValueHandler, onSubmit, args }
    },
    template: `
      <Form @submit="onSubmit">
        <Radio name="group1" value="foo" label="foo" @update:modelValue="fooModelValueHandler" alt="foo"/>
        <Radio name="group1" value="bar" label="bar" @update:modelValue="barModelValueHandler" alt="bar"/>
        <FormButton submit class="mt-4">Submit</FormButton>
      </Form>
    `
  }),
  play: async (params) => {
    const smallDelay = 500
    const bigDelay = 1000

    const canvas = within(params.canvasElement)

    const fooRadio = canvas.getByAltText('foo')
    const barRadio = canvas.getByAltText('bar')
    const button = canvas.getByRole('button')

    await userEvent.click(fooRadio)
    await wait(smallDelay)
    await userEvent.click(button)

    await wait(bigDelay)

    await userEvent.click(barRadio)
    await wait(smallDelay)
    await userEvent.click(button)

    await wait(bigDelay)

    await userEvent.click(barRadio)
    await wait(smallDelay)
    await userEvent.click(barRadio)
    await wait(smallDelay)
    await userEvent.click(button)
  },
  parameters: {
    docs: {
      description: {
        story:
          'Radios with the same name are part of a group and on form submit the value will be an array of all selected values. Check actions of this story for an example!'
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
    label: 'Example radio',
    description: 'This is an inline description'
  }
}

export const WithIcon: StoryObj<typeof defaultArgs> = {
  ...Default,
  args: {
    name: 'withIcon',
    label: 'Example radio with Icon',
    icon: ArrowRightIcon,
    description: 'Example discription'
  }
}

export const Disabled: StoryObj<typeof defaultArgs> = {
  ...Default,
  play: async (params) => {
    const canvas = within(params.canvasElement)
    const radio = canvas.getByRole('radio')

    const isChecked = (radio as HTMLInputElement).checked

    // click and assert that radio checked state hasn't changed
    await userEvent.click(radio)

    const newIsChecked = (radio as HTMLInputElement).checked
    await expect(isChecked).toBe(newIsChecked)
  },
  args: {
    name: 'disabled1',
    value: 'disabled1-value',
    label: 'Disabled radio',
    disabled: true
  }
}

export const Required: StoryObj<typeof defaultArgs> = {
  ...Default,
  args: {
    name: 'required1',
    value: 'required1-value',
    label: 'Required radio',
    showRequired: true,
    rules: [(val: string | string[]) => (val ? true : 'This field is required')],
    validateOnMount: true
  }
}

export const Single: StoryObj<typeof defaultArgs> = {
  ...Default,
  args: {
    ...Default.args,
    label: 'Single radio',
    name: 'single1',
    value: true
  },
  parameters: {
    docs: {
      description: {
        story:
          'Set `value` to `true` for non-grouped radios. That way v-model will be `undefined` if unchecked or `true` if checked.'
      }
    }
  }
}
