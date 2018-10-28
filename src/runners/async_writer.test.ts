import test from 'ava'

import { asyncWriter } from './async_writer'

// tslint:disable:no-unused-expression

test('writes chunks to the stream', async (t) => {
  const chunks = [] as string[]
  const stream = {
    write: (chunk: string, cb: () => void) => {
      chunks.push(chunk)
      setTimeout(() => cb(), 1)
      return true
    },
  }

  const write = asyncWriter(stream as any)

  await write('1')
  await write('2')
  await write('3')

  t.deepEqual(chunks, ['1', '2', '3'])
})

test('rejects the promise if write sends an error', async (t) => {
  const stream = {
    write: (chunk: string, cb: (err: any) => void) => {
      setTimeout(() => cb('test err'), 1)
      return true
    },
  }

  const write = asyncWriter(stream as any)

  let caught: any
  try {
    await write('1')
  } catch (e) {
    // expected
    caught = e
  }

  t.truthy(caught)
})

test('waits for the drain event if draining', async (t) => {
  const chunks = [] as string[]
  const drainers = [] as Array<() => void>
  const stream = {
    write: (chunk: string, cb: () => void) => {
      chunks.push(chunk)
      setTimeout(() => cb(), 1)
      return false
    },
    once: (event: string, drainer: () => void) => {
      t.deepEqual(event, 'drain')
      drainers.push(drainer)
    },
  }

  const write = asyncWriter(stream as any)

  await write('1')
  const p2 = write('2')
  let p2done = false
  let p2err: any = null
  p2.then(() => p2done = true, (err) => p2err = err)

  t.deepEqual(chunks, ['1'])
  t.deepEqual(drainers.length, 1)

  t.false(p2done)
  t.falsy(p2err)
})

test('recursively writes the chunk after drain event', async (t) => {
  const chunks = [] as string[]
  const drainers = [] as Array<() => void>
  const stream = {
    write: (chunk: string, cb: () => void) => {
      chunks.push(chunk)
      setTimeout(() => cb(), 1)
      return false
    },
    once: (event: string, drainer: () => void) => {
      t.deepEqual(event, 'drain')
      drainers.push(drainer)
    },
  }

  const write = asyncWriter(stream as any)

  await write('1')
  const p2 = write('2')
  const p3 = write('3')
  let p3done = false
  let p3err: any = null
  p3.then(() => p3done = true, (err) => p3err = err)

  // drain event
  drainers[0]()
  await p2

  t.false(p3done)
  t.falsy(p3err)
  t.deepEqual(chunks, ['1', '2'])
  t.deepEqual(drainers.length, 2)

  // drain event
  drainers[1]()
  await p3

  t.deepEqual(chunks, ['1', '2', '3'])
})

test('catches errors after a drain event', async (t) => {
  const chunks = [] as string[]
  const drainers = [] as Array<() => void>
  const stream = {
    write: (chunk: string, cb: (err?: any) => void) => {
      chunks.push(chunk)
      setTimeout(() =>
        cb(chunks.length == 2 ? new Error('test err') : undefined),
        1,
      )
      return false
    },
    once: (event: string, drainer: () => void) => {
      t.deepEqual(event, 'drain')
      drainers.push(drainer)
    },
  }

  const write = asyncWriter(stream as any)

  await write('1')
  const p2 = write('2')
  const p3 = write('3')

  // drain event
  drainers[0]()
  let caught2: any
  try {
    await p2
  } catch (e) {
    // expected
    caught2 = e
  }

  // should not throw
  drainers[1]()
  await p3

  t.truthy(caught2)
})
