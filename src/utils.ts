import { exec } from 'child_process'
import * as path from 'path'
import * as util from 'util'
import { IContentType } from './model'
import * as fs from 'fs-extra'

declare global {
  // tslint:disable interface-name
  interface String {
    camelCase(): string
    underscore(): string
  }

  interface Object {
    dump(): string
  }
  // tslint:enable interface-name
}

const applied = false
export function extendPrototypes() {
  if (applied) { return }

  Object.prototype.dump = function(this: any): string {
    return util.inspect(this, {
      depth: null,
      maxArrayLength: null,
      breakLength: 0,
    })
  }

  String.prototype.camelCase = function(this: string) {
    return this.toLowerCase()
      .replace(/-(.)/g, (match, group1) =>
        group1.toUpperCase(),
      )
  }

  String.prototype.underscore = function(this: string) {
    return this.replace(/([A-Z])/g, (m: string) => '_' + m.toLowerCase())
  }
}

export function indexById(types: IContentType[]): { [id: string]: IContentType } {
  const ret: any = {}
  types.forEach((type) => {
    ret[type.sys.id] = type
  })
  return ret
}

export function indexByContentType<T>(items: T[]): { [id: string]: T } {
  const ret: any = {}
  items.forEach((item: any) => {
    ret[item.sys.contentType.sys.id] = item
  })
  return ret
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms)
  })
}

export async function formatFile(file: string): Promise<void> {
  if (await checkTslint()) {
    return formatFileWithTslint(file)
  }
  if (await checkEslint()) {
    return formatFileWithEslint(file)
  }
  return formatFileWithPrettier(file)
}

let tslintExists: boolean | undefined
async function checkTslint(): Promise<boolean> {
  if (tslintExists === undefined) {
    tslintExists = await fs.pathExists('./node_modules/.bin/tslint')
  }
  return tslintExists
}

let eslintExists: boolean | undefined
async function checkEslint(): Promise<boolean> {
  if (eslintExists === undefined) {
    eslintExists = await fs.pathExists('./node_modules/.bin/eslint')
  }
  return eslintExists
}

function formatFileWithTslint(file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`./node_modules/.bin/tslint --fix ${file}`, (err, stdout, stderr) => {
      if (err) {
        reject(err.message + '\n\t' + stderr)
      } else {
        resolve()
      }
    })
  })
}

function formatFileWithEslint(file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`./node_modules/.bin/eslint --fix ${file}`, (err, stdout, stderr) => {
      if (err) {
        reject(err.message + '\n\t' + stderr)
      } else {
        resolve()
      }
    })
  })
}

function formatFileWithPrettier(file: string): Promise<void> {
  const prettierBinLocation = path.join(require.resolve('prettier'), '../bin-prettier.js')

  return new Promise((resolve, reject) => {
    exec(`${prettierBinLocation} --write ${file}`, (err, stdout, stderr) => {
      if (err) {
        reject(err.message + '\n\t' + stderr)
      } else {
        resolve()
      }
    })
  })
}

export async function eachInSequence<T, U>(
    items: T[],
    op: (item: T, index?: number, items?: T[]) => Promise<U>): Promise<U[]> {
  const ret: U[] = []
  for (let i = 0; i < items.length; i++) {
    ret.push(await op(items[i], i, items))
  }
  return ret
}
