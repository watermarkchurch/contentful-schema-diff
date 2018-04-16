

// modeling the Diff type
export type Diff = DiffArray<any> | DiffObj

export type DiffArray<T> = DiffItem<T>[]

export type DiffItem<T> = ["-" | "+", T]  | ["~", DiffObj] | [" ", undefined]

export type SimpleDiff<T> = { "__old": T, "__new": T}

export type DiffObj = {
  [field: string]: Diff | SimpleDiff<any>
}


export function isDiff(obj: any | Diff): obj is Diff {
  return isDiffArray(obj) || isDiffObj(obj)
}

export function isDiffObj(obj: any | DiffObj): obj is DiffObj {
  if (typeof obj != "object" || Object.keys(obj).length == 0) {
    return false;
  }
  
  return Object.keys(obj).every((key) => {
    const val = (obj as any)[key]
    return isSimpleDiff(val) || isDiff(val)    
  })
}

export function isDiffArray<T>(arr: T[] | DiffArray<T>[]): arr is DiffArray<T>[] {
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
  return val[0] == " " ||
    val[0] == "~" ||
    val[0] == "+" ||
    val[0] == "-"
}

export function isSimpleDiff<T>(diff: Diff | SimpleDiff<T>): diff is SimpleDiff<T> {
  const obj = (diff as any)
  return obj["__old"] !== undefined || obj["__new"] !== undefined
}