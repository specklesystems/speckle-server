import sharp from 'sharp'
import xmlescape from 'xml-escape'
import pixelWidth from 'string-pixel-width'

type SharpInput =
  | Buffer
  | ArrayBuffer
  | Uint8Array
  | Uint8ClampedArray
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array
  | string

export async function makeOgImage(
  previewBufferOrFilename: SharpInput,
  streamName: string
) {
  const imgWidth = 1200
  const imgHeight = 627

  const panelPadding = 20
  const panelWidth = imgWidth - 2 * panelPadding
  const panelHeight = 80

  let title = '/ ' + streamName
  const maxTitleSize = 750
  if (pixelWidth(title, { font: 'open sans', size: 48 }) > maxTitleSize) {
    while (pixelWidth(title, { font: 'open sans', size: 48 }) > maxTitleSize) {
      title = title.slice(0, -1)
    }
    title += '...'
  }

  const logo = await sharp(
    require.resolve('#/assets/previews/images/speckle_logo_and_text.png')
  )
    .resize({ height: panelHeight })
    .toBuffer()

  const topPanel = Buffer.from(`
      <svg width="${imgWidth}" height="${panelHeight + 2 * panelPadding}">
        <defs>
          <filter id="dropshadow" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="5" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <rect x="${panelPadding}" y="${panelPadding}" width="${panelWidth}" height="${panelHeight}" fill="#fff" rx="15" filter="url(#dropshadow)" />
        <text x="${panelPadding + 305}" y="${
    panelPadding + 60
  }" fill="#000" font-family="DejaVu Sans, sans-serif" font-size="48px">
          ${xmlescape(title)}
        </text>
      </svg>
    `)

  return await sharp(previewBufferOrFilename)
    .resize({ width: imgWidth, height: imgHeight })
    .composite([
      { input: topPanel, top: 0, left: 0 },
      { input: logo, left: panelPadding + 10, top: panelPadding }
    ])
    .png()
    .toBuffer()
}
