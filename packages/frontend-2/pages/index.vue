<template>
  <div>
    <header>
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 class="h3 text-foreground">Design system demo</h1>
      </div>
    </header>
    <main>
      <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div class="px-4 py-8 sm:px-0">
          <LayoutPanel>
            <template #header>
              <span class="h5">Example panel title</span>
            </template>
            <template #default>
              <div>
                <div>
                  Hello, {{ user?.name || 'guest' }}! Here are some design system
                  examples:
                </div>
                <div class="my-8">
                  <div class="h1">Heading 1</div>
                  <div class="h2">Heading 2</div>
                  <div class="h3">Heading 3</div>
                  <div class="h4">Heading 4</div>
                  <div class="h5">Heading 5</div>
                  <div class="normal">Normal text</div>
                  <div class="label">Label text</div>
                  <div class="label label--light">Label text (light)</div>
                  <div class="caption">Caption text</div>
                </div>
                <div class="my-8 flex flex-col space-y-4">
                  <div>Here are some buttons:</div>
                  <div><FormButton to="/">Basic primary button</FormButton></div>
                  <div>
                    <FormButton to="/" full-width>Full-width button</FormButton>
                  </div>
                  <div>
                    <FormButton to="/" disabled>Disabled primary button</FormButton>
                  </div>
                  <div>
                    <FormButton to="/" size="big">Big primary button</FormButton>
                  </div>
                  <div>
                    <FormButton to="/" size="small">Small primary button</FormButton>
                  </div>
                  <div>
                    <FormButton to="/" type="secondary">Secondary button</FormButton>
                  </div>
                  <div>
                    <FormButton to="/" type="danger">Danger button</FormButton>
                  </div>
                  <div>
                    <FormButton to="/" type="warning">Warning button</FormButton>
                  </div>
                  <div>
                    <FormButton to="/" type="success">Success button</FormButton>
                  </div>
                  <div>
                    <FormButton to="/" type="outline">Basic outline button</FormButton>
                  </div>
                </div>
                <div class="my-8">
                  <div>
                    <div>Here are the available background colors:</div>
                    <code class="bg-background p-4 m-4 block rounded-lg">
                      bg-background
                    </code>
                    <code class="bg-background-2 p-4 m-4 block rounded-lg">
                      bg-background-2
                    </code>
                    <code class="bg-background-3 p-4 m-4 block rounded-lg">
                      bg-background-3
                    </code>
                  </div>
                  <div>
                    <div>Here are the available foreground colors:</div>
                    <ul class="font-bold">
                      <li class="text-foreground">text-foreground</li>
                      <li class="text-foreground-2">text-foreground-2</li>
                      <li class="text-foreground-3">text-foreground-3</li>
                    </ul>
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
                    <div>
                      Example form with various elements (we use vee-validate v4):
                    </div>
                    <div>
                      <FormTextInput
                        name="Basic"
                        placeholder="Basic text input w/ label"
                      />
                    </div>
                    <div>
                      <FormTextInput
                        name="Error"
                        placeholder="Error input"
                        :rules="
                          (val) =>
                            val === 'valid'
                              ? true
                              : 'Type in `valid` to make this valid!'
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
                          (val) =>
                            val ? true : 'Check this in to get rid of the error!'
                        "
                        validate-on-mount
                      />
                    </div>
                    <div><FormButton submit full-width>Submit</FormButton></div>
                  </Form>
                </div>
                <div>And that's all, folks!</div>
              </div>
            </template>
            <template #footer>
              <FormButton to="/">Example panel footer button</FormButton>
            </template>
          </LayoutPanel>
        </div>
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import { Form } from 'vee-validate'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

const { activeUser } = useActiveUser()
const user = computed(() => activeUser.value || null)

const onSubmit = (values: unknown) => console.log(values)
</script>
