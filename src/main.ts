
import * as fs from 'fs-extra'
import {diff} from 'deep-diff'
import { IContentType } from './model'
import * as util from 'util'

export interface IArgs {
  from: string,
  to: string
}

export default async function Run(args: IArgs) {

  const [from, to] = (await Promise.all([
    fs.readFile(args.from),
    fs.readFile(args.to)
  ])).map(b => JSON.parse(b.toString()))

  const fromTypes = indexById(from.contentTypes)
  const toTypes = indexById(to.contentTypes)


  const outputStream = fs.createWriteStream('test.ts')
  const write = asyncWrite(outputStream)

  const promises = Object.keys(toTypes).map(async (id) => {
    let chunk: string
    if (fromTypes[id]) {
      chunk = await writeModify(fromTypes[id], toTypes[id])
    } else {
      chunk = await writeCreate(toTypes[id])
    }

    if (chunk && chunk.length > 0) {
      await write(chunk)
    }
  })
  promises.push(...Object.keys(fromTypes).map(async (id) => {
    if (toTypes[id]) {
      // handled above in 'writeModify'
      return
    }
    const chunk = await writeDelete(id)
    await write(chunk)
  }))

  await Promise.all(promises)

  outputStream.close();
}

function indexById(types: IContentType[]): { [id: string]: IContentType } {
  const ret: any = {}
  types.forEach(type => {
    ret[type.sys.id] = type
  })
  return ret
}

function asyncWrite(stream: fs.WriteStream): (chunk: any) => Promise<void> {
  let draining = true

  function doWrite(chunk: any) {
    return new Promise<void>((resolve, reject) => {
      if (draining) {
        draining = stream.write(chunk, (err: any) => {
          if(err) {
            reject(err)
          } else {
            resolve()
          }
        })
      } else {
        stream.on('drain', () => {
          // await recursive
          doWrite(chunk)
            .then(resolve)
            .catch(reject)
        })
      }
    })
  }

  return doWrite
}

async function writeDelete(id: string): Promise<string> {
  return `
  migration.deleteContentType('${id}')
`
}

async function writeModify(from: IContentType, to: IContentType): Promise<string> {
  return `
  // TODO: modify ${from.sys.id}
`
}

async function writeCreate(newType: IContentType): Promise<string> {
  const v = camelCase(newType.sys.id)
  const typeDef = Object.assign({}, newType)
  delete(typeDef.fields)
  delete(typeDef.sys)

  let str = `
  var ${v} = migration.createContentType('${newType.sys.id}', ${dump(typeDef)})
`
  newType.fields.forEach(field => {
    const fieldDef = Object.assign({}, field)
    delete(fieldDef.id)

    str += `
  ${v}.createField('${field.id}', ${dump(fieldDef)})
`
  })
  
  return str;
}

function dump(obj: any): string {
  return util.inspect(obj, {
    depth: null,
    maxArrayLength: null,
    breakLength: 0
  })
}

function camelCase(input: string) { 
  return input.toLowerCase().replace(/-(.)/g, function(match, group1) {
      return group1.toUpperCase();
  });
}