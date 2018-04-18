
/**
 * A Diff can be either an object or array, depending on what you diffed.
 * If you diffed two arrays, you can expect it to be a DiffArray<TItem> type.
 */
export type Diff = DiffArray<any> | DiffObj<any>

/**
 * A DiffArray is a Diff of two arrays.  It contains a set of DiffItems.
 */
export type DiffArray<T> = Array<DiffItem<T>>

/**
 * A DiffItem is an array with two values - the first is the operation:
 * "+" indicates the value was added to the array
 * "-" indicates the value was removed from the array
 * "~" indicates the value is still in the array but has changed
 * " " indicates the value did not change.
 *
 * The second value is either a whole object in the case of "+" or "-",
 * or a diff of an object.
 *
 * In the case of an array of arrays, the "~" value would be a DiffArray,
 * but we can't model that in typescript because it's a circluar reference.
 * Maybe if we defined the interface better...
 */
export type DiffItem<T> = ['-' | '+', T]  | ['~', DiffObj<T>] | [' ', undefined]

/**
 * Represents a change in a primitive field value
 */
export interface ISimpleDiff<T> { '__old': T, '__new': T}

/**
 * A diff of two objects.  Every key that changes is represented
 */
export type DiffObj<T> = {
  [field in keyof T]: Diff | ISimpleDiff<any>
}

export function isDiff(obj: any | Diff): obj is Diff {
  return isDiffArray(obj) || isDiffObj(obj)
}

export function isDiffObj<T>(obj: T | DiffObj<T>): obj is DiffObj<T> {
  if (typeof obj != 'object' || Object.keys(obj).length == 0) {
    return false
  }

  return Object.keys(obj).every((key) => {
    const val = (obj as any)[key]
    return isSimpleDiff(val) || isDiff(val)
  })
}

export function isDiffArray<T>(arr: T[] | Array<DiffArray<T>>): arr is Array<DiffArray<T>> {
  if (!Array.isArray(arr)) {
    return false
  }

  return (arr as any).every(isDiffItem)
}

export function isDiffItem<T>(val: T | DiffItem<T>): boolean {
  if (!Array.isArray(val)) {
    return false
  }
  if (val.length <= 0 || val.length > 2) {
    return false
  }
  return val[0] == ' ' ||
    val[0] == '~' ||
    val[0] == '+' ||
    val[0] == '-'
}

export function isSimpleDiff<T>(diff: Diff | ISimpleDiff<T>): diff is ISimpleDiff<T> {
  const obj = (diff as any)
  return obj.__old !== undefined || obj.__new !== undefined
}
