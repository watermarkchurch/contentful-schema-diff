import * as fs from 'fs-extra'

import { IArgs } from "./main";
import { IContentType } from "./model";

const {createClient} = require('contentful-management')

export function loadSources(args: IArgs): Promise<IContentType[][]> {
  return Promise.all([
    loadSource(args.from, args),
    loadSource(args.to, args)
  ])
}

async function loadSource(source: string, args: IArgs): Promise<IContentType[]> {
  if (await fs.pathExists(source)) {
    const contents = await fs.readFile(source)
    return JSON.parse(contents.toString()).contentTypes
  }

  // get from space
  if (!args.managementToken) {
    throw new Error(`${source} is not a file and I don't have a management token to talk to contentful.`)
  }

  const client = createClient({
    accessToken: args.managementToken
  })

  let env: any = undefined
  try {
    const space = await client.getSpace(source)
    env = await space.getEnvironment('master')
  } catch(e) {
    // the source may not be a space - it might be an environment on the '--from' space
    if (args.from == source) {
      throw(e)
    }
    // we're loading the args.to
    const space = await client.getSpace(args.from)
    env = await space.getEnvironment(source)
  }

  const types = await env.getContentTypes()
  return types.toPlainObject().items
}