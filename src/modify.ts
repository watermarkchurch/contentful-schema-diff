import { Diff, DiffArray, DiffObj, isDiff, isDiffItem, isDiffObj, isSimpleDiff } from './diff'
import { IContentType, IField } from './model'
import { IContext } from './runners'
import {extendPrototypes} from './utils'
extendPrototypes()

const { diff } = require('json-diff')
const { colorize } = require('json-diff/lib/colorize')

export async function writeModify(
    from: IContentType,
    to: IContentType,
    write: (chunk: string) => Promise<any>,
    context: IContext,
  ): Promise<void> {
  context.operations.push('modify')

  const v = from.sys.id.camelCase()
  const fromTypeDef = Object.assign({}, to)
  delete(fromTypeDef.fields)
  delete(fromTypeDef.sys)
  const toTypeDef = Object.assign({}, to)
  delete(toTypeDef.fields)
  delete(toTypeDef.sys)

  const typeDefDiff: DiffArray<IField> = diff(fromTypeDef, toTypeDef)
  const fieldsDiff: DiffArray<IField> = diff(from.fields, to.fields)

  if (empty(typeDefDiff) && empty(fieldsDiff)) {
    return
  }

  if (empty(typeDefDiff)) {
    await write(`
  const  ${v} = migration.editContentType('${from.sys.id}')
  `)
  } else {
    await write(`
  const ${v} = migration.editContentType('${from.sys.id}', ${toTypeDef.dump()})
`)
  }
  context.varname = v

  await write(`
  /*
${colorize(fieldsDiff, { color: false } )} */
  `)

  const created = new Map<string, IField>()
  const deleted = new Map<string, IField>()
  const modified = new Map<string, { field: IField, diff: DiffObj<IField> } | null>()

  let fromFieldIndex = 0
  let toFieldIndex = 0

  fieldsDiff.forEach((item) => {
    const val = item[1]
    switch (item[0]) {
      case '+':
        if (val && !isDiffObj(val)) {
          created.set(val.id, val)
        } else {
          throw new Error('Diff produced a "+" with a diff obj:\n' + JSON.stringify(item))
        }
        toFieldIndex++
        break
      case '-':
        if (val && !isDiffObj(val)) {
          deleted.set(val.id, val)
        } else {
          throw new Error('Diff produced a "-" with a diff obj:\n' + JSON.stringify(item))
        }
        fromFieldIndex++
        break
      case '~':
        if (val && isDiffObj(val)) {
          modified.set(to.fields[toFieldIndex].id,
            { field: to.fields[toFieldIndex], diff: val })
        } else {
          throw new Error('Diff produced a "~" with a non-diff obj:\n' + JSON.stringify(item))
        }
        fromFieldIndex++
        toFieldIndex++
        break
      default:
        fromFieldIndex++
        toFieldIndex++

        break
    }
  })

  const moved = new Map<string, IField>()
  modified.forEach((val) => {
    if (val && val.diff && val.diff.id && isSimpleDiff(val.diff.id) && created.has(val.diff.id.__old)) {
      // A new field was inserted just before this field and the diff got confused
      created.delete(val.diff.id.__old)
      created.set(val.field.id, val.field)

      // re-diff the old field that was moved to see if we had any changes
      val = reDiff(val.diff.id.__old)
    }
    if (val && val.diff) {
      write(modifyField(val.field, val.diff))
    }
  })
  created.forEach((val, key) => {
    if (deleted.has(key)) {
      moved.set(key, val)
      created.delete(key)
    } else {
      write(createField(val))
    }
  })
  moved.forEach((val, key) => {
    write(moveField(val, deleted.get(key)))
    deleted.delete(key)
  })
  deleted.forEach((val) => write(deleteField(val)))

  // writer functions
  function createField(field: IField): string {
    const fieldDef = Object.assign({}, field)
    delete(fieldDef.id)

    let create = `
    ${v}.createField('${field.id}', ${fieldDef.dump()})
  `
    create += moveField(field)

    return create
  }

  function deleteField(field: IField): string {
    return `
    ${v}.deleteField('${field.id}')
  `
  }

  function moveField(field: IField, oldField?: IField): string {
    let move = `
    ${v}.moveField('${field.id}')`

    const newIndex = fieldIndex(to.fields, field)
    if (newIndex === 0) {
      move += `
        .toTheTop()`
    } else {
      move += `
        .afterField('${to.fields[newIndex - 1].id}')`
    }

    const changes = oldField && diff(oldField, field) as DiffObj<IField>
    if (changes) {
      move += modifyField(field, changes)
    }
    return move
  }

  function modifyField(toField: IField, fieldDiff: DiffObj<IField>): string {
    let base = `
    ${v}.editField('${toField.id}')`
    Object.keys(fieldDiff).forEach((key) => {
      const newValue = (toField as any)[key]
      base += `
        .${key}(${newValue.dump()})`
    })

    return base + '\n'
  }

  function reDiff(id: string): { field: IField, diff: DiffObj<IField> } | null {
    const toField = to.fields.find((f) => f.id == id)
    const fromField = from.fields.find((f) => f.id == id)
    if (!toField || !fromField) {
      throw new Error(`Unable to find field ${id} in re-diff of ${to.name}`)
    }
    const d = diff(fromField, toField)
    return d ? { field: toField, diff: d } : null
  }
}

// utilities
function empty(arr: any[]): boolean {
  return !arr || arr.length === 0
}

function fieldIndex(fields: IField[], field: IField): number {
  return fields.map((f) => f.id).indexOf(field.id)
}
