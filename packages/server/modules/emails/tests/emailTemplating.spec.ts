import { getServerInfo } from '@/modules/core/services/generic'
import {
  buildBasicTemplateEmail,
  buildBasicTemplateServerInfo,
  EmailTemplateServerInfo
} from '@/modules/emails/services/templateFormatting'
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
      url: 'http://welcome-to-the-server.com',
      company: 'COOL COMPANY LLC',
      contact: 'bbbb@aaaaeeee.com'
    }

    const { text, html } = await buildBasicTemplateEmail({
      html: { bodyStart, bodyEnd },
      text: { bodyStart, bodyEnd },
      cta: {
        url,
        title,
        altTitle
      },
      server
    })

    expect(text).to.be.ok
    expect(sanitize(text, { allowedTags: [] })).to.eq(text) // there should be no HTML
    expect(text).to.contain(bodyStart)
    expect(text).to.contain(bodyEnd)
    expect(text).to.contain(url)
    expect(text).to.contain(title)
    expect(text).to.not.contain(altTitle)
    expect(text).to.contain(server.name)
    expect(text).to.contain(server.url)
    expect(text).to.contain(server.company)
    expect(text).to.contain(server.contact)

    expect(html).to.be.ok
    expect(html).to.contain(bodyStart)
    expect(html).to.contain(bodyEnd)

    const matches = [...(html.matchAll(HTML_LINK_MATCHER) || [])]
    expect(matches.length).to.be.greaterThanOrEqual(2)

    const expectedUrlsToCheck = [url, server.url]
    let checkedUrls = 0
    for (const match of matches) {
      const [, foundHref, foundAltTitle, foundTitle] = match
      if (!expectedUrlsToCheck.includes(foundHref)) continue

      if (foundHref === url) {
        // CTA
        expect(foundAltTitle).to.eq(altTitle)
        expect(foundTitle).to.eq(title)
        checkedUrls++
      } else if (foundHref === server.url) {
        // Server info
        expect(foundAltTitle).to.eq(server.name)
        expect(foundTitle).to.eq(server.url)
        checkedUrls++
      }
    }

    expect(checkedUrls).to.be.greaterThanOrEqual(2)

    expect(html).to.contain(server.company)
    expect(html).to.contain(server.contact)
  })

  it('prefills server info, if not passed in', async () => {
    const serverInfo = buildBasicTemplateServerInfo(await getServerInfo())

    const { text, html } = await buildBasicTemplateEmail({
      html: { bodyStart: '', bodyEnd: '' },
      text: { bodyStart: '', bodyEnd: '' }
    })

    expect(text).to.be.ok
    expect(text).to.contain(serverInfo.name)
    expect(text).to.contain(serverInfo.url)
    expect(text).to.contain(serverInfo.company)
    expect(text).to.contain(serverInfo.contact)

    expect(html).to.be.ok
    expect(html).to.contain(serverInfo.name)
    expect(html).to.contain(serverInfo.url)
    expect(html).to.contain(serverInfo.company)
    expect(html).to.contain(serverInfo.contact)
  })
})
