import { MaybeAsync, ServerScope } from '@speckle/shared'
import type { Express, RequestHandler } from 'express'
import type { Session, SessionData } from 'express-session'
import type { TokenSet, UserinfoResponse } from 'openid-client'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends AuthStrategyPassportUser {}

    interface Request extends AuthRequestData {}
  }
}

declare module 'express-session' {
  interface SessionData extends AuthSessionData {}
}

declare module 'http' {
  interface IncomingMessage extends AuthRequestData {
    /**
     * Not sure why I have to do this, the session type is picked up correctly in some places, but not others
     */
    session: Session & Partial<SessionData>
  }
}

export type AuthStrategyPassportUser = {
  id: string
  email: string
  isNewUser?: boolean
  isInvite?: boolean
}

export type AuthSessionData = {
  // Common session auth params used across strategies
  challenge?: string
  token?: string
  newsletterConsent?: boolean

  // More specific params used in OpenID based strategies
  tokenSet?: TokenSet
  userinfo?: UserinfoResponse
  codeVerifier?: string
}

export type AuthRequestData = {
  /**
   * Used in auth flows to specify where to redirect the user to, after successful auth
   * @deprecated FE2 ignores this
   */
  authRedirectPath?: string
}

export type ScopeRecord = {
  name: ServerScope
  description: string
  public: boolean
}

export type ServerAppsScopesRecord = {
  appId: string
  scopeName: ServerScope
}

export type UserServerAppTokenRecord = {
  userId: string
  appId: string
  tokenId: string
}

export type PersonalApiTokenRecord = {
  userId: string
  tokenId: string
}

export type TokenScopeRecord = {
  tokenId: string
  scopeName: ServerScope
}

export type AuthStrategyMetadata = {
  id: string
  name: string
  icon: string
  color: string
  url: string
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
) => MaybeAsync<AuthStrategyMetadata>
