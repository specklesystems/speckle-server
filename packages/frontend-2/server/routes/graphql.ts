import { useApiOrigin } from '~/composables/env'

/**
 * Taken from apollo-server-core source code. Loads the Apollo Studio sandbox at /graphql.
 * Won't work in production, because in production the backend /graphql route takes precedence.
 */

function getConfigStringForHtml(config: Record<string, unknown>) {
  return JSON.stringify(config)
    .replace('<', '\\u003c')
    .replace('>', '\\u003e')
    .replace('&', '\\u0026')
    .replace("'", '\\u0027')
}

export default defineEventHandler(() => {
  const apiOrigin = useApiOrigin()

  const version = '_latest'
  const embeddedExplorerParams = {
    initialEndpoint: `${apiOrigin}/graphql`,
    target: '#embeddableSandbox',
    initialState: {}
  }

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link
      rel="icon"
      href="https://apollo-server-landing-page.cdn.apollographql.com/${version}/assets/favicon.png"
    />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="preconnect" href="https://fonts.gstatic.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro&display=swap"
      rel="stylesheet"
    />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Apollo server landing page" />
    <link
      rel="apple-touch-icon"
      href="https://apollo-server-landing-page.cdn.apollographql.com/${version}/assets/favicon.png"
    />
    <link
      rel="manifest"
      href="https://apollo-server-landing-page.cdn.apollographql.com/${version}/manifest.json"
    />
    <title>Apollo Server</title>
  </head>
  <body style="margin: 0; overflow-x: hidden; overflow-y: hidden">
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="react-root">
      <style>
        .fallback {
          opacity: 0;
          animation: fadeIn 1s 1s;
          animation-iteration-count: 1;
          animation-fill-mode: forwards;
          padding: 1em;
        }
        @keyframes fadeIn {
          0% {opacity:0;}
          100% {opacity:1; }
        }
      </style>
    <div class="fallback">
      <h1>Welcome to Apollo Server</h1>
      <p>Apollo Sandbox cannot be loaded; it appears that you might be offline.</p>
    </div>
    <style>
      iframe {
        background-color: white;
      }
    </style>
    <div
    style="width: 100vw; height: 100vh; position: absolute; top: 0;"
    id="embeddableSandbox"
    ></div>
    <script src="https://embeddable-sandbox.cdn.apollographql.com/v2/embeddable-sandbox.umd.production.min.js?runtime=%40apollo%2Fserver%404.11.0"></script>
    <script>
      var initialEndpoint = window.location.href;
      new window.EmbeddedSandbox({
        ...${getConfigStringForHtml(embeddedExplorerParams)},
        // Speckle auth
        handleRequest: (url, options) => {
          let token = undefined

          // Try to load token from cookie
          const cookies = document.cookie.split('; ')
          const authCookie = cookies.find(c => c.startsWith('authn='))
          if (authCookie) {
            token = authCookie.split('=')[1]
          }

          const headers = options.headers || {}
          if (token) {
            headers['Authorization'] = 'Bearer ' + token
          }

          return fetch(url, {
            ...options,
            headers
          })
        }
      });
    </script>
    </div>
  </body>
</html>`
})
