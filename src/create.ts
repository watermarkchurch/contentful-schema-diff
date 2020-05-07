import { Writable } from 'stream'
import { IContentType } from './model'

import { IContext } from './runners'
import {extendPrototypes} from './utils'
extendPrototypes()

export async function writeCreate(
  newType: IContentType,
  write: (chunk: string) => Promise<any>,
  context: IContext,
): Promise<void> {
  const v = newType.sys.id.camelCase()
  const typeDef = Object.assign({}, newType)
  delete(typeDef.fields)
  delete(typeDef.sys)

  await write(`
  const ${v} = migration.createContentType('${newType.sys.id}', ${typeDef.dump()})
`)
  context.varname = v

  for (const field of newType.fields) {
    const fieldDef = Object.assign({}, field)
    delete(fieldDef.id)

    await write(`
  ${v}.createField('${field.id}', ${fieldDef.dump()})
`)
  }
}
