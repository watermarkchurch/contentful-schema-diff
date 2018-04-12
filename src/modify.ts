import { IContentType } from "./model";

const { diff } = require('json-diff')
const { colorize } = require('json-diff/lib/colorize')

export async function writeModify(from: IContentType, to: IContentType, write: (chunk: string) => Promise<any>): Promise<void> {

  const v = from.sys.id.camelCase()
  const fromTypeDef = Object.assign({}, to)
  delete(fromTypeDef.fields)
  delete(fromTypeDef.sys)
  const toTypeDef = Object.assign({}, to)
  delete(toTypeDef.fields)
  delete(toTypeDef.sys)

  const typeDefDiff = diff(fromTypeDef, toTypeDef)
  const fieldsDiff = diff(from.fields, to.fields)


  if (empty(typeDefDiff) && empty(fieldsDiff)) {
    return
  }

  if (empty(typeDefDiff)) {
    await write(`
  var ${v} = migration.editContentType('${from.sys.id}')
  `)
  } else {
    await write(`
  var ${v} = migration.editContentType('${from.sys.id}', ${toTypeDef.dump()})
`)
  }
  
  await write(`
  /* TODO: automatically generate edits from this diff
${colorize(fieldsDiff, { color: false } )} */
  `)
}

function empty(arr: Array<any>): boolean {
  return !arr || arr.length == 0
}