import { IEditorInterface } from "./model"
import { eachInSequence } from "./utils";
import { IContext } from "./runners";

export async function writeEditorInterfaceChange(
      from: IEditorInterface,
      to: IEditorInterface,
      write: (chunk: string) => Promise<any>,
      context?: IContext
    ): Promise<void> {

  let fieldsToWrite = to.controls
  if (from) {
    fieldsToWrite = fieldsToWrite.filter(control => {
      const previous = from.controls.find(prev => prev.fieldId == control.fieldId)
      if (!previous) {
        // new control
        return true;
      }

      // widget ID changed
      return previous.widgetId != control.widgetId
    })
  }

  if (fieldsToWrite.length == 0) {
    return
  }

  context = context || {}
  if (!context.varname) {
    const v = to.sys.contentType.sys.id.camelCase()
    await write(`
  var ${v} = migration.editContentType('${to.sys.contentType.sys.id}')
`)
    context.varname = v
  }

  await eachInSequence(fieldsToWrite, (field) =>
    write(`
  ${context.varname}.changeEditorInterface('${field.fieldId}', '${field.widgetId}')
`)
  )
}