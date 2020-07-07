import * as _ from 'lodash'
import { IEditorInterface } from './model'
import { IContext } from './runners'
import { eachInSequence, extendPrototypes } from './utils'
extendPrototypes()

export async function writeEditorInterfaceChange(
      from: IEditorInterface | null,
      to: IEditorInterface,
      write: (chunk: string) => Promise<any>,
      context?: IContext,
    ): Promise<void> {

  let fieldsToWrite = to.controls
  if (from) {
    fieldsToWrite = fieldsToWrite.filter((control) => {
      const previous = from.controls.find((prev) => prev.fieldId == control.fieldId)
      if (!previous) {
        // new control
        return true
      }

      // widget ID changed
      if (previous.widgetId != control.widgetId) {
        return true
      }

      // settings changed
      if (!_.isEqual(previous.settings, control.settings)) {
        return true
      }
      return false
    })
  }

  if (fieldsToWrite.length == 0) {
    return
  }

  const ctx: IContext = context || { operations: [] }
  if (!ctx.varname) {
    const v = to.sys.contentType.sys.id.camelCase()
    await write(`
  var ${v} = migration.editContentType('${to.sys.contentType.sys.id}')
`)
    ctx.varname = v
  }

  await eachInSequence(fieldsToWrite, async (field) => {
    await write(`
  ${ctx.varname}.changeFieldControl('${field.fieldId}', '${field.widgetNamespace}', '${field.widgetId}'`)

    if (field.settings) {
      await write(`, ${field.settings.dump()}`)
    }

    await write(`)
`)
  })
}
