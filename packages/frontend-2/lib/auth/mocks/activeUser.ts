import { Optional, Roles } from '@speckle/shared'
import { Get } from 'type-fest'
import { fakeUsers } from '~~/components/form/select/Users.stories'
import {
  ActiveUserMainMetadataQuery,
  ActiveUserMainMetadataQueryVariables,
  ProfileEditDialogQuery,
  ProfileEditDialogQueryVariables
} from '~~/lib/common/generated/gql/graphql'
import { ApolloMockData } from '~~/lib/common/helpers/storybook'
import { apolloMockRequestWithDefaults } from '~~/lib/fake-nuxt-env/utils/betterMockLink'

type CombinedUserType = ApolloMockData<
  NonNullable<
    Get<ActiveUserMainMetadataQuery, 'activeUser'> &
      Get<ProfileEditDialogQuery, 'activeUser'>
  >
>

const randomDate = new Date('01-01-2020')
const randomLoggedInUser: CombinedUserType = {
  __typename: 'User',
  id: 'random-logged-in-user',
  email: 'loggedin@user.com',
  name: 'Logged in user',
  role: Roles.Server.User,
  avatar: fakeUsers[0].avatar,
  isOnboardingFinished: false,
  createdAt: randomDate.toISOString(),
  verified: false,
  company: 'Random company',
  bio: 'Random bio',
  notificationPreferences: {}
}

export const mockActiveUserQuery = apolloMockRequestWithDefaults<
  ActiveUserMainMetadataQuery,
  ActiveUserMainMetadataQueryVariables,
  Optional<Partial<{ forceGuest: boolean }>>
>({
  request: ({ operationName }) => operationName === 'ActiveUserMainMetadata',
  result: (_, values) => ({
    data: {
      __typename: 'Query',
      activeUser: values?.forceGuest
        ? null
        : {
            __typename: randomLoggedInUser.__typename,
            id: randomLoggedInUser.id,
            email: randomLoggedInUser.email,
            name: randomLoggedInUser.name,
            role: randomLoggedInUser.role,
            avatar: randomLoggedInUser.avatar,
            isOnboardingFinished: randomLoggedInUser.isOnboardingFinished,
            createdAt: randomLoggedInUser.createdAt,
            verified: randomLoggedInUser.verified
          }
    }
  })
})

export const mockProfileEditDialogQuery = apolloMockRequestWithDefaults<
  ProfileEditDialogQuery,
  ProfileEditDialogQueryVariables,
  Optional<Partial<{ forceGuest: boolean }>>
>({
  request: ({ operationName }) => operationName === 'ProfileEditDialog',
  result: (_, values) => ({
    data: {
      __typename: 'Query',
      activeUser: values?.forceGuest
        ? null
        : {
            __typename: randomLoggedInUser.__typename,
            id: randomLoggedInUser.id,
            email: randomLoggedInUser.email,
            name: randomLoggedInUser.name,
            company: randomLoggedInUser.company,
            avatar: randomLoggedInUser.avatar,
            bio: randomLoggedInUser.bio,
            notificationPreferences: randomLoggedInUser.notificationPreferences
          }
    }
  })
})
