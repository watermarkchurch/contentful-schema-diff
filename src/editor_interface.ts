import { IEditorInterface } from "./model"
import { eachInSequence } from "./utils";

export async function writeEditorInterfaceChange(
      from: IEditorInterface,
      to: IEditorInterface,
      write: (chunk: string) => Promise<any>,
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
  const v = to.sys.contentType.sys.id.camelCase()

  await eachInSequence(fieldsToWrite, (field) =>
    write(`
  ${v}.changeEditorInterface('${field.fieldId}', '${field.widgetId}')
`)
  )
}