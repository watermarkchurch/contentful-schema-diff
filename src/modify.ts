import { IContentType, IField } from "./model";

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

  const typeDefDiff: Diff<IField> = diff(fromTypeDef, toTypeDef)
  const fieldsDiff: Diff<IField> = diff(from.fields, to.fields)

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

  const created = new Map<string, IField>()
  const deleted = new Map<string, IField>()

  fieldsDiff.forEach(item => {
    const val = item[1]
    switch(item[0]) {
      case "+":
        if (!isDiff(val)) {
          created.set(val.id, val)
        }
        break;
      case "-":
        if (!isDiff(val)) {
          deleted.set(val.id, val)
        }
        break;
      // Don't know how to handle other diffs yet
    }
  })

  const moved = new Map<string, IField>()
  created.forEach((val, key) => {
    if (deleted.has(key)) {
      moved.set(key, val)
    } else {
      write(createField(val))
    }
  })
  moved.forEach((val, key) => {
    created.delete(key)
    deleted.delete(key)
    write(moveField(val))
  })
  deleted.forEach((val) => write(deleteField(val)))

  // writer functions
  function createField(field: IField): string {
    const fieldDef = Object.assign({}, field)
    delete(fieldDef.id)
  
    return `
    ${v}.createField('${field.id}', ${fieldDef.dump()})
  `
  }
  
  function deleteField(field: IField): string {
    return `
    ${v}.deleteField('${field.id}')
  `
  }
  
  function moveField(field: IField): string {
    return `
    ${v}.moveField('${field.id}')
      .afterField( ?where? )
  `
  }
}

// utilities
function empty(arr: Array<any>): boolean {
  return !arr || arr.length == 0
}

function isDiff<T>(obj: T | IDiffObj): obj is IDiffObj {
  if (typeof obj != "object" || Object.keys(obj).length == 0) {
    return false;
  }
  
  return Object.keys(obj).every((key) => {
    const val = (obj as any)[key]

    if (!Array.isArray(val) || val.length == 0 || val.length > 2) {
      return false
    }
    return val[0] == " " ||
      val[0] == "~" ||
      val[0] == "+" ||
      val[0] == "-"
  })
}

// modeling the Diff type
type Diff<T> = DiffItem<T>[]

type DiffItem<T> = [
  " " | "~" | "+" | "-",
  T | IDiffObj
]

interface IDiffObj {
  [field: string]: Diff<any>
}