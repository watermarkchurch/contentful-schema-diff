import * as fs from 'fs-extra'

import { IArgs } from './main'
import { IContentType, IEditorInterface } from './model'
import { eachInSequence } from './utils'

const {createClient} = require('contentful-management')

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
  let contentTypes: any[]
  let editorInterfaces: IEditorInterface[]

  if (await fs.pathExists(source)) {
    const contents = await fs.readFile(source)
    const parsed = JSON.parse(contents.toString())
    contentTypes = parsed.contentTypes
    editorInterfaces = parsed.editorInterfaces
  } else {
    // get from space
    if (!args.managementToken) {
      throw new Error(`${source} is not a file and I don't have a management token to talk to contentful.`)
    }

    const client = createClient({
      accessToken: args.managementToken,
    })

    let {spaceId, envId} = parseEnv(source)
    let env: any
    try {
      const space = await client.getSpace(spaceId)
      env = await space.getEnvironment(envId)
    } catch (e) {
      // the source may not be a space - it might be an environment on the '--from' space
      if (args.from == source) {
        throw(e)
      }
      // we're loading the args.to

      spaceId = parseEnv(args.from).spaceId
      envId = source
      const space = await client.getSpace(spaceId)
      env = await space.getEnvironment(envId)
    }

    contentTypes = (await env.getContentTypes()).items
    if (args.contentTypes && args.contentTypes.length > 0) {
      contentTypes = contentTypes.filter((ct) =>
        args.contentTypes.indexOf(ct.sys.id) >= 0,
      )
    }
    editorInterfaces = await eachInSequence(contentTypes,
      (ct: any) => ct.getEditorInterface() as Promise<IEditorInterface>)
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
