import { UserEmail } from './types'

export type CreateUserEmail = (
  userEmail: Pick<UserEmail, 'email' | 'userId'> & { primary?: boolean }
) => Promise<string>

export type UpdateUserEmail = (
  query:
    | (Pick<UserEmail, 'email' | 'userId'> & { primary?: boolean })
    | (Pick<UserEmail, 'userId'> & { primary: true }),
  update: Pick<Partial<UserEmail>, 'email' | 'primary'>
) => Promise<UserEmail>

export type DeleteUserEmail = ({
  userId,
  email
}: {
  userId: string
  email: string
}) => Promise<boolean>
