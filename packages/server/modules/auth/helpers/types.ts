import { MaybeAsync } from '@speckle/shared'
import type { Express, RequestHandler } from 'express'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends AuthStrategyPassportUser {}

    interface Request {
      authRedirectPath?: string
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    challenge?: string
    token?: string
    newsletterConsent?: boolean
  }
}

export type ServerAppsScopesRecord = {
  appId: string
  scopeName: string
}

export type AuthStrategy = {
  id: string
  name: string
  icon: string
  color: string
  url: string
}

export type AuthStrategyPassportUser = {
  id: string
  email: string
  isNewUser?: boolean
  isInvite?: boolean
}

export type AuthStrategyBuilder = (
  app: Express,
  /**
   * Initializes session in Express. Should be attached before any auth strategy request handlers
   * that use it.
   */
  sessionMiddleware: RequestHandler,
  /**
   * Middleware that moves auth initialization params (like invite token, challenge etc.)
   * to session so they're accessible in auth strategy callback handlers.
   * Should be invoked after sessionMiddleware() and before any auth process init handlers
   */
  moveAuthParamsToSessionMiddleware: RequestHandler,
  /**
   * Middleware that takes the User object that passport should've attached to the request
   * and finalizes the auth process by redirecting the user to the correct page
   */
  finalizeAuthMiddleware: RequestHandler
) => MaybeAsync<AuthStrategy>
