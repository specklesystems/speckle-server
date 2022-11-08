<template>
  <div>
    <header class="my-6">
      <div class="default-width text-foreground">
        <h1 class="h3 mb-2 px-2">Design System Demo</h1>
        <p class="px-2">
          Hello, {{ user?.name || 'guest' }}! Here are some design system examples.
        </p>
      </div>
    </header>
    <main>
      <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <LayoutPanel class="background text-foreground mb-4">
          <template #header>
            <span class="h3">Typograhpy</span>
          </template>
          <template #default>
            <p>Classic headings:</p>
            <div class="mt-4 flex flex-col gap-y-4">
              <div class="h1">Heading 1 YOLO</div>
              <div class="h2">Heading 2</div>
              <div class="h3">Heading 3</div>
              <div class="h4">Heading 4</div>
              <div class="h5">Heading 5</div>
              <div class="normal">Normal text</div>
              <div class="label">Label text</div>
              <div class="label label--light">Label text (light)</div>
              <div class="caption">Caption text</div>
            </div>
            <div class="mt-4 px-4 py-12 rounded-lg shadow-inner bg-background-accent">
              <b>Font faces?</b>
              system ui only - using github's stack. Lighter, better performance, no
              more google fonts trakcing and a more native look.
            </div>
          </template>
        </LayoutPanel>
        <LayoutPanel class="background text-foreground mb-4">
          <template #header>
            <span class="h3">Colors</span>
          </template>
          <template #default>
            <div>Here are the available foreground colors:</div>
            <div class="mt-4">
              <div class="mt-4 px-4 py-12 rounded-lg shadow-inner bg-background-accent">
                <b class="text-primary">Text colors? &nbsp;</b>
                <span class="text-foreground">
                  <b>foreground</b>
                  for text you want to stand out.
                </span>
                <span class="text-foreground-dim">
                  <b>foreground-dim</b>
                  for text you don't want to stand out.
                </span>
              </div>
            </div>
            <div class="mt-4">
              <ul class="font-bold">
                <li class="text-foreground">text-foreground</li>
                <li class="text-foreground-dim">text-foreground-2</li>
              </ul>
            </div>
            <div class="my-8">
              <div>
                <div>Here are the available background colors:</div>
                <div
                  class="bg-background px-4 py-12 mt-2 block rounded-lg border-4 border-background-accent"
                >
                  <b>bg-background</b>
                  - for use in any element that needs to stand out from the page.
                </div>
                <div
                  class="bg-background-base px-4 py-12 mt-2 block rounded-lg border-4 border-background-accent"
                >
                  <b>bg-background-base</b>
                  - for use as the page background.
                </div>
                <div
                  class="bg-background-accent px-4 py-12 mt-2 block rounded-lg border-4 border-background-accent"
                >
                  <b>bg-background-accent</b>
                  - for use as the background for anything that needs to stand out.
                </div>
                <div
                  class="bg-primary text-white px-4 py-12 mt-2 block rounded-lg border-4 border-primary"
                >
                  <b>bg-primary</b>
                  - for use when you want to something to really pop.
                </div>
              </div>
            </div>
          </template>
        </LayoutPanel>
        <LayoutPanel class="background text-foreground mb-4">
          <template #header>
            <span class="h3">Buttons</span>
          </template>
          <template #default>
            <div class="flex flex-col space-y-4">
              <div>Here are some buttons:</div>
              <div class="flex flex-col gap-y-4">
                <div>
                  <FormButton to="/" size="small">Small primary button</FormButton>
                </div>
                <div><FormButton to="/">Basic primary button</FormButton></div>
                <div>
                  <FormButton to="/" size="big">Big primary button</FormButton>
                </div>
                <div>
                  <FormButton to="/" size="big" type="pop">Pop button</FormButton>
                </div>
              </div>
              <div>
                <FormButton to="/" full-width>Full-width button</FormButton>
              </div>
              <div>
                <FormButton to="/" disabled>Disabled primary button</FormButton>
              </div>
              <div>
                <FormButton to="/" type="danger">Danger button</FormButton>
              </div>
              <div>
                <FormButton to="/" type="warning">Warning button</FormButton>
              </div>
              <div>
                <FormButton to="/" type="outline">Basic outline button</FormButton>
              </div>
              <div
                class="bg-background-accent px-4 py-6 mt-2 rounded-lg border-4 border-background-base flex items-center justify-between"
              >
                <span>Use pop type buttons on accent backgrounds</span>
                <FormButton to="/" type="pop">Pop Out</FormButton>
              </div>
              <div
                class="bg-primary text-white px-4 py-6 mt-2 rounded-lg border-4 border-background-base flex items-center justify-between"
              >
                <span>A primary button to use on primary backgrounds:</span>
                <FormButton to="/" type="invert">Basic inverted button</FormButton>
              </div>
            </div>
            <div class="my-8">
              <div>Link:</div>
              <div>
                <TextLink to="/">Basic Link</TextLink>
                |
                <TextLink to="/" secondary>Secondary Link</TextLink>
                |
                <TextLink to="/" disabled>Disabled Link</TextLink>
              </div>
            </div>
            <div class="my-8">
              <Form class="flex flex-col space-y-4" @submit="onSubmit">
                <div>Example form with various elements (we use vee-validate v4):</div>
                <div>
                  <FormTextInput name="Basic" placeholder="Basic text input w/ label" />
                </div>
                <div>
                  <FormTextInput
                    name="Error"
                    placeholder="Error input"
                    :rules="
                      (val) =>
                        val === 'valid' ? true : 'Type in `valid` to make this valid!'
                    "
                    validate-on-mount
                  />
                </div>
                <div>
                  <FormTextInput
                    name="input1"
                    label="Custom label"
                    placeholder="Input w/ help text and a custom label"
                    help="Here's a tip for ya!"
                  />
                </div>
                <div>
                  <FormTextInput
                    name="Required"
                    placeholder="This field is required"
                    :rules="(val) => (val ? true : 'Required')"
                    show-required
                  />
                </div>
                <div>
                  <FormTextInput
                    name="Disabled"
                    placeholder="This field is disabled"
                    disabled
                  />
                </div>
                <div>
                  <FormTextInput
                    name="Email"
                    placeholder="test@text.com"
                    type="email"
                  />
                </div>
                <div>
                  <FormTextInput
                    name="Password"
                    placeholder="Enter PW here"
                    type="password"
                  />
                </div>
                <div>
                  <FormCheckbox name="Checkbox1" />
                </div>
                <div>
                  <FormCheckbox
                    name="Checkboxreq"
                    label="Required checkbox"
                    show-required
                    :rules="(val) => (val ? true : 'Required!')"
                  />
                </div>
                <div>
                  <FormCheckbox
                    name="Checkbox2"
                    label="Custom label"
                    description="Here's a description!"
                  />
                </div>
                <div>
                  <FormCheckbox
                    name="Checkbox3"
                    description="Here's an inline description!"
                    inline-description
                  />
                </div>
                <div>
                  <FormCheckbox
                    name="errorcheckbox1"
                    label="Checkbox with error"
                    description="Hello world!"
                    :rules="
                      (val) => (val ? true : 'Check this in to get rid of the error!')
                    "
                    validate-on-mount
                  />
                </div>
                <div><FormButton submit full-width type="pop">Submit</FormButton></div>
              </Form>
            </div>
          </template>
        </LayoutPanel>
        <LayoutPanel class="background text-foreground">
          <template #header>
            <span class="h3">Components</span>
          </template>
          <template #default>TODO</template>
        </LayoutPanel>
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import { Form } from 'vee-validate'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'

const activeUserQuery = graphql(`
  query GetActiveUser {
    activeUser {
      id
      name
      role
    }
  }
`)

const { result: activeUserResult } = useQuery(activeUserQuery)
const user = computed(() => activeUserResult.value?.activeUser || null)

const onSubmit = (values: unknown) => console.log(values)
const route = useRoute()
const nav = useNav()
onMounted(() => {
  nav.value[0] = {
    to: `/designsystem`,
    name: 'Design System Demo',
    separator: true
  }
})

onUnmounted(() => {
  nav.value.splice(0, 1)
})
</script>
