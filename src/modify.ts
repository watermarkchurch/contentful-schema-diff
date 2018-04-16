import { IContentType, IField } from "./model";
import { DiffArray, Diff, DiffObj, isDiff, isDiffItem, isDiffObj } from "./diff";

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

  const typeDefDiff: DiffArray<IField> = diff(fromTypeDef, toTypeDef)
  const fieldsDiff: DiffArray<IField> = diff(from.fields, to.fields)

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
  /*
${colorize(fieldsDiff, { color: false } )} */
  `)

  const created = new Map<string, IField>()
  const deleted = new Map<string, IField>()
  const modified = new Map<string, { field: IField, diff: DiffObj<IField> }>()

  let fromFieldIndex = 0;
  let toFieldIndex = 0;

  fieldsDiff.forEach(item => {
    const val = item[1]
    switch(item[0]) {
      case "+":
        if (!isDiffObj(val)) {
          created.set(val.id, val)
        } else {
          throw new Error('Diff produced a "+" with a diff obj:\n' + JSON.stringify(item))
        }
        toFieldIndex++;
        break;
      case "-":
        if (!isDiffObj(val)) {
          deleted.set(val.id, val)
        } else {
          throw new Error('Diff produced a "-" with a diff obj:\n' + JSON.stringify(item))
        }
        fromFieldIndex++;
        break;
      case "~":
        if (isDiffObj(val)) {
          modified.set(to.fields[toFieldIndex].id, 
            { field: to.fields[toFieldIndex], diff: val })
        } else {
          throw new Error('Diff produced a "~" with a non-diff obj:\n' + JSON.stringify(item))
        }
        fromFieldIndex++;
        toFieldIndex++;
        break;
      default:
        fromFieldIndex++;
        toFieldIndex++;
        
        break;
    }
  })

  const moved = new Map<string, IField>()
  created.forEach((val, key) => {
    if (deleted.has(key)) {
      moved.set(key, val)
      created.delete(key)
    } else {
      write(createField(val))
    }
  })
  moved.forEach((val, key) => {
    write(moveField(val, to, deleted.get(key)))
    deleted.delete(key)
  })
  deleted.forEach((val) => write(deleteField(val)))
  modified.forEach((val) => {
    write(modifyField(val.field, val.diff))
  })

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
  
  function moveField(field: IField, to: IContentType, oldField: IField): string {
    let move = `
    ${v}.moveField('${field.id}')`

    const newIndex = to.fields.map(f => f.id).indexOf(field.id)
    if (newIndex == 0) {
      move += `
        .toTheTop()`
    } else {
      move += `
        .afterField('${to.fields[newIndex - 1].id}')`
    }

    const changes = <DiffObj<IField>>diff(oldField, field)
    if(changes) {
      move += modifyField(field, changes)
    }
    return move
  }

  function modifyField(toField: IField, diff: DiffObj<IField>): string {
    let base = `
    ${v}.editField('${toField.id}')`
    Object.keys(diff).forEach(key => {
      const newValue = (toField as any)[key]
      base += `
        .${key}(${newValue.dump()})`
    })

    return base + '\n';
  }
}

// utilities
function empty(arr: Array<any>): boolean {
  return !arr || arr.length == 0
}
