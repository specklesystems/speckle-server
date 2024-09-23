import { Scopes } from '@speckle/shared'

export default [
  {
    name: Scopes.Apps.Read,
    description: 'See created or authorized applications.',
    public: false
  },
  {
    name: Scopes.Apps.Write,
    description: 'Register new applications.',
    public: false
  }
]
