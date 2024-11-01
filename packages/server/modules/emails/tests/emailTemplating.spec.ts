import { db } from '@/db/knex'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  EmailTemplateServerInfo,
  renderEmail
} from '@/modules/emails/services/emailRendering'
import { expect } from 'chai'
import sanitize from 'sanitize-html'

const HTML_LINK_MATCHER = /<a.*?href="(.*?)".*?title="(.*?)".*?>\s*(.*?)\s*<\/a>/gis

describe('Basic email template', () => {
  it('gets rendered correctly', async () => {
    const bodyStart = 'h3ll0 guy!'
    const bodyEnd = 'ayyyy000-g00dby3!'
    const url = 'https://some-fake-link.com'
    const title = 'CTA-TITLE-IS-HERE'
    const altTitle = 'ALT_CTA_TITLE'

    const server: EmailTemplateServerInfo = {
      name: 'ADADADAD',
      canonicalUrl: 'http://welcome-to-the-server.com',
      company: 'COOL COMPANY LLC',
      adminContact: 'bbbb@aaaaeeee.com'
    }

    const { text, html } = await renderEmail(
      {
        mjml: {
          bodyStart: `<mj-text>${bodyStart}</mj-text>`,
          bodyEnd: `<mj-text>${bodyEnd}</mj-text>`
        },
        text: { bodyStart, bodyEnd },
        cta: {
          url,
          title,
          altTitle
        }
      },
      server
    )

    expect(text).to.be.ok
    expect(sanitize(text, { allowedTags: [] })).to.eq(text) // there should be no HTML
    expect(text).to.contain(bodyStart)
    expect(text).to.contain(bodyEnd)
    expect(text).to.contain(url)
    expect(text).to.contain(title)
    expect(text).to.not.contain(altTitle)
    expect(text).to.contain(server.name)
    expect(text).to.contain(server.canonicalUrl)
    expect(text).to.contain(server.company)
    expect(text).to.contain(server.adminContact)

    expect(html).to.be.ok
    expect(html).to.contain(bodyStart)
    expect(html).to.contain(bodyEnd)

    const matches = [...(html.matchAll(HTML_LINK_MATCHER) || [])]
    expect(matches.length).to.be.greaterThanOrEqual(2)

    const expectedUrlsToCheck = [url, server.canonicalUrl]
    let checkedUrls = 0
    for (const match of matches) {
      const [, foundHref, foundAltTitle, foundTitle] = match
      if (!expectedUrlsToCheck.includes(foundHref)) continue

      if (foundHref === url) {
        // CTA
        expect(foundAltTitle).to.eq(altTitle)
        expect(foundTitle).to.eq(title)
        checkedUrls++
      } else if (foundHref === server.canonicalUrl) {
        // Server info
        expect(foundAltTitle).to.eq(server.name)
        expect(foundTitle).to.eq(server.canonicalUrl)
        checkedUrls++
      }
    }

    expect(checkedUrls).to.be.greaterThanOrEqual(2)

    expect(html).to.contain(server.company)
    expect(html).to.contain(server.adminContact)
  })

  it('prefills server info, if not passed in', async () => {
    const serverInfo = await getServerInfoFactory({ db })()

    const { text, html } = await renderEmail(
      {
        mjml: { bodyStart: '', bodyEnd: '' },
        text: { bodyStart: '', bodyEnd: '' }
      },
      serverInfo
    )

    expect(text).to.be.ok
    expect(text).to.contain(serverInfo.name)
    expect(text).to.contain(serverInfo.canonicalUrl)
    expect(text).to.contain(serverInfo.company)
    expect(text).to.contain(serverInfo.adminContact)

    expect(html).to.be.ok
    expect(html).to.contain(serverInfo.name)
    expect(html).to.contain(serverInfo.canonicalUrl)
    expect(html).to.contain(serverInfo.company)
    expect(html).to.contain(serverInfo.adminContact)
  })
})
