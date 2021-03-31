import _fetch, { Response } from 'node-fetch'
import { URL } from 'url'
import { IEditorInterface } from '../model'
import { wait } from '../utils'

interface ClientOptions {
  baseUrl: string,
  spaceId: string,
  environmentId: string
  accessToken: string
}

export default class SimpleCMAClient {
  private readonly options: ClientOptions

  constructor(
    options?: Partial<ClientOptions>,
    private readonly fetch: typeof _fetch = _fetch,
  ) {
    this.options = {
      baseUrl: 'https://api.contentful.com',
      spaceId: process.env.CONTENTFUL_SPACE_ID!,
      accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN!,
      environmentId: process.env.CONTENTFUL_ENVIRONMENT || 'master',
      ...options,
    }
  }

  public async getContentType(contentType: string): Promise<IEditorInterface> {
    const {spaceId, environmentId} = this.options
    const resp = await this.get(`/spaces/${spaceId}/environments/${environmentId}/content_types/${contentType}`)

    return await resp.json()
  }

  public async getEditorInterface(contentType: string): Promise<IEditorInterface> {
    const {spaceId, environmentId} = this.options
    const resp = await this.get(`/spaces/${spaceId}/environments/${environmentId}/content_types/${contentType}/editor_interface`)

    return await resp.json()
  }

  private async get(path: string, query: Record<string, string> = {}): Promise<Response> {
    const url = new URL(path, this.options.baseUrl)
    Object.keys(query).forEach((k) => {
      url.searchParams.set(k, query[k])
    })

    let resp: Response

    do {
      resp = await this.fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.options.accessToken}`,
        },
        redirect: 'follow',
      })

      if (resp.status == 429) {
        const reset = resp.headers.get('X-Contentful-RateLimit-Reset')
        if (!reset) { throw new Error(`Rate-limited with no X-Contentful-RateLimit-Reset header!`) }

        await wait(parseFloat(reset) * 1000)
        continue
      }

      if (resp.status != 200) {
        throw new Error(`Unexpected status code ${resp.status} for '${path}'`)
      }
    } while (resp.status != 200)

    return resp
  }
}
