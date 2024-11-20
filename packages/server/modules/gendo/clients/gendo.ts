import { RequestNewImageGeneration } from '@/modules/gendo/domain/operations'
import { GendoRenderRequestError } from '@/modules/gendo/errors/main'

/**
 * 
{
  "userId": "user1234",
  "prompt": "a beautiful stone barn next to a lake, sunset, water",
  "webhookUrl": "<speckle gendo webhook handler endpoint>",
  "depthMapBase64": "<base64 encoded png depth map>"
}
 */

export const requestNewImageGenerationFactory =
  ({
    endpoint,
    token,
    serverOrigin
  }: {
    endpoint: string
    token: string
    serverOrigin: string
  }): RequestNewImageGeneration =>
  async (input) => {
    const webhookUrl = `${serverOrigin}/api/thirdparty/gendo/${input.projectId}`

    // TODO: Fn handles too many concerns, refactor (e.g. the client fetch call)
    // TODO: Fire off request to gendo api & get generationId, create record in db. Note: use gendo api key from env
    const depthMapBase64 = input.baseImage.replace(/^data:image\/\w+;base64,/, '')
    const gendoRequestBody = {
      userId: input.userId,
      depthMapBase64,
      prompt: input.prompt,
      webhookUrl
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': token
      },
      body: JSON.stringify(gendoRequestBody)
    })

    const status = response.status
    if (status !== 201) {
      const body = await response.json().catch((e) => ({ error: `${e}` }))
      throw new GendoRenderRequestError('Failed to enqueue gendo render.', {
        info: { body }
      })
    }

    const gendoResponseBody = (await response.json()) as {
      status: string
      generationId: string
    }
    return gendoResponseBody
  }
