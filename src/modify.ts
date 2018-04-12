import { IContentType } from "./model";

const { diff } = require('json-diff')
const { colorize } = require('json-diff/lib/colorize')

export async function writeModify(from: IContentType, to: IContentType, write: (chunk: string) => Promise<any>): Promise<void> {
  const difference = diff(from.fields, to.fields)
  if (!difference || difference.length == 0) {
    return
  }

  const v = from.sys.id.camelCase()
  const typeDef = Object.assign({}, to)
  delete(typeDef.fields)
  delete(typeDef.sys)

  await write(`
  var ${v} = migration.editContentType('${from.sys.id}', ${typeDef.dump()})
`)
  
  await write(`
  /* TODO: automatically generate edits from this diff
${colorize(difference, { color: false } )} */
  `)
}