import { asyncWriter } from '../async_writer'

// tslint:disable:no-unused-expression
describe('AsyncWriter', () => {
  test('writes chunks to the stream', async () => {
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

    expect(chunks).toEqual(['1', '2', '3'])
  })

  test('rejects the promise if write sends an error', async () => {
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

    expect(caught).toBeTruthy()
  })

  test('waits for the drain event if draining', async () => {
    const chunks = [] as string[]
    const drainers = [] as Array<() => void>
    const stream = {
      write: (chunk: string, cb: () => void) => {
        chunks.push(chunk)
        setTimeout(() => cb(), 1)
        return false
      },
      once: (event: string, drainer: () => void) => {
        expect(event).toBe('drain')
        drainers.push(drainer)
      },
    }

    const write = asyncWriter(stream as any)

    await write('1')
    const p2 = write('2')
    let p2done = false
    let p2err: any = null
    p2.then(() => (p2done = true), (err) => (p2err = err))

    expect(chunks).toEqual(['1'])
    expect(drainers.length).toBe(1)
    expect(p2done).toBeFalsy()
    expect(p2err).toBeFalsy()
  })

  test('recursively writes the chunk after drain event', async () => {
    const chunks = [] as string[]
    const drainers = [] as Array<() => void>
    const stream = {
      write: (chunk: string, cb: () => void) => {
        chunks.push(chunk)
        setTimeout(() => cb(), 1)
        return false
      },
      once: (event: string, drainer: () => void) => {
        expect(event).toBe('drain')
        drainers.push(drainer)
      },
    }

    const write = asyncWriter(stream as any)

    await write('1')
    const p2 = write('2')
    const p3 = write('3')
    let p3done = false
    let p3err: any = null
    p3.then(() => (p3done = true), (err) => (p3err = err))

    // drain event
    drainers[0]()
    await p2

    expect(p3done).toBeFalsy()
    expect(p3err).toBeFalsy()
    expect(chunks).toEqual(['1', '2'])
    expect(drainers.length).toBe(2)

    // drain event
    drainers[1]()
    await p3

    expect(chunks).toEqual(['1', '2', '3'])
  })

  test('catches errors after a drain event', async () => {
    const chunks = [] as string[]
    const drainers = [] as Array<() => void>
    const stream = {
      write: (chunk: string, cb: (err?: any) => void) => {
        chunks.push(chunk)
        setTimeout(
          () => cb(chunks.length == 2 ? new Error('test err') : undefined),
          1,
        )
        return false
      },
      once: (event: string, drainer: () => void) => {
        expect(event).toBe('drain')
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

    expect(caught2).toBeTruthy()
  })
})
