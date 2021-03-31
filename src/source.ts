import * as fs from 'fs-extra'
import SimpleCMAClient, { NotFoundError } from './client'

import { IArgs } from './main'
import { IContentType, IEditorInterface } from './model'

export interface ISource {
  id: string
  contentTypes: IContentType[]
  editorInterfaces: IEditorInterface[]
}

export function loadSources(args: IArgs): Promise<ISource[]> {
  return Promise.all([
    loadSource(args.from, args),
    loadSource(args.to, args),
  ])
}

async function loadSource(source: string, args: IArgs): Promise<ISource> {
  let contentTypes: IContentType[]
  let editorInterfaces: IEditorInterface[]

  if (source == 'scratch' || source == 'empty') {
    // used to create migrations for a space from scratch
    contentTypes = []
    editorInterfaces = []

  } else if (await fs.pathExists(source)) {
    const contents = await fs.readFile(source)
    const parsed = JSON.parse(contents.toString())
    contentTypes = parsed.contentTypes
    editorInterfaces = parsed.editorInterfaces

  } else {
    // get from space
    if (!args.managementToken) {
      throw new Error(`${source} is not a file and I don't have a management token to talk to contentful.`)
    }

    let {spaceId, envId} = parseEnv(source)

    let client = new SimpleCMAClient({
      accessToken: args.managementToken,
      spaceId,
      environmentId: envId,
    })

    contentTypes = []
    editorInterfaces = []
    try {
      for await (const ct of client.getContentTypes()) {
        contentTypes.push(ct)
      }
    } catch (e) {
      if (!/^404:/.test(e.message)) {
        console.log('raise', e)
        throw e
      }
      // the source may not be a space - it might be an environment on the '--from' space
      if (args.from == source) {
        throw(e)
      }
      // we're loading the args.to, assume the same space ID as the args.from
      spaceId = parseEnv(args.from).spaceId
      envId = source
      client = new SimpleCMAClient({
        accessToken: args.managementToken,
        spaceId,
        environmentId: envId,
      })

      for await (const ct of client.getContentTypes()) {
        contentTypes.push(ct)
      }
    }

    if (args.contentTypes && args.contentTypes.length > 0) {
      contentTypes = contentTypes.filter((ct) =>
        args.contentTypes.indexOf(ct.sys.id) >= 0,
      )
    }
    for (const ct of contentTypes) {
      editorInterfaces.push(await client.getEditorInterface(ct.sys.id))
    }
  }
  return {
    id: source,
    contentTypes,
    editorInterfaces,
  }
}

function parseEnv(source: string): { spaceId: string, envId: string } {
  const parts = source.split('/')
  return {
    spaceId: parts[0],
    envId: parts.length > 1 ? parts[1] : 'master',
  }
}
