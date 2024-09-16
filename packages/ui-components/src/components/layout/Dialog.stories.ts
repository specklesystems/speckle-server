import type { Meta, StoryObj } from '@storybook/vue3'
import LayoutDialog from '~~/src/components/layout/Dialog.vue'
import FormButton from '~~/src/components/form/Button.vue'
import { ref } from 'vue'
import { action } from '@storybook/addon-actions'
import { directive as vTippy } from 'vue-tippy'

export default {
  component: LayoutDialog,
  parameters: {
    docs: {
      description: {
        component: 'Standard dialog/modal window'
      }
    }
  },
  argTypes: {
    maxWidth: {
      options: ['sm', 'md', 'lg', 'xl'],
      control: { type: 'select' }
    }
  }
} as Meta

export const Default: StoryObj = {
  render: (args) => ({
    components: { LayoutDialog, FormButton },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template: `<div>
      <FormButton @click="() => open = true">Trigger dialog</FormButton>
      <LayoutDialog v-model:open="open" v-bind="args">
        <div class="flex flex-col text-foreground space-y-4">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vehicula mauris sed tortor tempor, eget viverra arcu dapibus. Vivamus ac erat sit amet justo pulvinar condimentum. Vivamus volutpat eget justo in elementum. Quisque ut metus sed elit eleifend faucibus eget vel diam. Sed eget accumsan felis. Nullam sollicitudin a felis eget aliquet. Fusce vitae erat rutrum, convallis ipsum in, efficitur lectus. Mauris sed augue at lacus malesuada mattis. Mauris tincidunt augue nec magna mollis efficitur. Etiam suscipit pellentesque lorem, quis placerat mi tristique et. Donec at scelerisque dolor. Proin nec libero vitae ligula tincidunt interdum eget et odio.</p>
          <p>Phasellus at felis quis quam facilisis ullamcorper a et risus. Cras orci velit, tempor quis congue non, elementum sed lacus. Vestibulum quis iaculis purus, in pharetra massa. Donec sed bibendum magna. Aliquam vulputate augue enim, eu tempor massa elementum sit amet. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Maecenas sit amet dictum ipsum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac augue maximus, interdum diam ac, iaculis massa. Maecenas consequat libero non turpis varius, sit amet consectetur elit imperdiet. Maecenas euismod justo sit amet varius porta.</p>
          <p>Maecenas ultricies sollicitudin viverra. Maecenas nec lobortis ante. Cras ut semper metus, eu sodales nibh. Integer a turpis non tellus congue elementum. Etiam ornare augue eu dolor elementum, non semper eros eleifend. Sed ut faucibus risus. Donec at faucibus arcu. Mauris id sapien vel velit mollis gravida. Vivamus et arcu in urna pellentesque euismod. Suspendisse non sagittis sapien, quis semper nulla. Aliquam maximus sit amet ipsum ac ultricies. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus eget interdum orci, a finibus magna.</p>
          <p>Sed tortor metus, auctor mattis lacinia quis, euismod vel leo. In hac habitasse platea dictumst. Sed egestas dui sapien, et volutpat arcu cursus ac. Quisque ut massa eu magna sodales laoreet vel quis massa. Nullam tortor ipsum, vulputate id tempor vel, accumsan at arcu. Fusce porttitor sed augue in fermentum. Integer imperdiet finibus sagittis. Curabitur pulvinar nunc id interdum euismod. Aliquam sodales faucibus vulputate.</p>
          <p>Maecenas convallis, magna quis egestas sodales, magna quam suscipit tortor, eget commodo erat diam lobortis mauris. Cras molestie erat ac pharetra faucibus. Nulla rutrum mauris a arcu pulvinar maximus. Donec malesuada, mi sed pretium dignissim, arcu dui feugiat ex, non vehicula nulla elit a nulla. Vivamus venenatis ligula urna, quis varius magna euismod vel. Nullam aliquam nibh nec urna ultrices gravida. Suspendisse potenti. Phasellus pulvinar massa porta orci condimentum vulputate. Integer nulla elit, gravida ac nisi eu, lacinia placerat nisl. Curabitur dui lacus, rutrum sed ex vitae, aliquet maximus sem. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.</p>
        </div>
      </LayoutDialog>
    </div>`
  }),
  args: {
    maxWidth: 'sm',
    hideCloser: false,
    preventCloseOnClickOutside: false
  }
}

export const HeaderAndFooter = {
  ...Default,
  args: {
    ...Default.args,
    title: 'Dialog Title',
    buttons: [
      {
        text: 'Close',
        props: {
          color: 'outline',
          link: false
        }
      },
      {
        text: 'Save',
        props: {
          color: 'default',
          link: false
        }
      }
    ]
  }
}

export const ManualCloseOnly = {
  ...Default,
  args: {
    ...Default.args,
    preventCloseOnClickOutside: true
  }
}

export const WithSubmit = {
  ...HeaderAndFooter,
  args: {
    ...HeaderAndFooter.args,
    onSubmit: action('submit'),
    buttons: [
      {
        text: 'Submit',
        props: {
          color: 'default',
          submit: true
        }
      }
    ]
  }
}

export const WithSlotButtons: StoryObj = {
  ...Default,
  args: {
    ...Default.args
  },
  render: (args) => ({
    components: { LayoutDialog, FormButton },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template: `<div>
      <FormButton @click="() => open = true">Trigger dialog</FormButton>
      <LayoutDialog v-model:open="open" v-bind="args">
        <div class="flex flex-col text-foreground space-y-4">
          <div class="h4 font-semibold">Hello world!</div>
          <div>Lorem ipsum blah blah blah</div>
        </div>
        <template #buttons>
            <FormButton @click="() => open = false">Close</FormButton>
        </template>
      </LayoutDialog>
    </div>`
  })
}

export const WithOverflowingTooltip: StoryObj = {
  ...Default,
  args: {
    ...Default.args
  },
  render: (args) => ({
    components: { LayoutDialog, FormButton },
    directives: { tippy: vTippy },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template: `<div>
      <FormButton @click="() => open = true">Trigger dialog</FormButton>
      <LayoutDialog v-model:open="open" v-bind="args">
        <div class="flex flex-col text-foreground space-y-4">
          <p v-tippy="\`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vehicula mauris sed tortor tempor, eget viverra arcu dapibus. Vivamus ac erat sit amet justo pulvinar condimentum. Vivamus volutpat eget justo in elementum. Quisque ut metus sed elit eleifend faucibus eget vel diam. Sed eget accumsan felis. Nullam sollicitudin a felis eget aliquet. Fusce vitae erat rutrum, convallis ipsum in, efficitur lectus. Mauris sed augue at lacus malesuada mattis. Mauris tincidunt augue nec magna mollis efficitur. Etiam suscipit pellentesque lorem, quis placerat mi tristique et. Donec at scelerisque dolor. Proin nec libero vitae ligula tincidunt interdum eget et odio.\`">Hover on me!</p>
        </div>
      </LayoutDialog>
    </div>`
  })
}
