import { Meta, Story } from '@storybook/vue3'
import ProjectList from '~~/components/project/List.vue'

console.log(ProjectList)

export default {
  title: 'Test/Project (test)',
  component: ProjectList,
  parameters: {
    docs: {
      description: {
        component: 'THE List of projects used on the dasboard.'
      }
    }
  }
} as Meta

export const Default: Story = {
  render: (args) => ({
    components: { ProjectList },
    setup() {
      return { args }
    },
    template: `
      <ProjectList v-bind="args" />
    `
  }),
  args: {
    enableSearch: true
  }
}

export const DisabledSearch: Story = {
  ...Default,
  args: {
    ...Default.args,
    enableSearch: false
  }
}
