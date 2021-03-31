import test from 'ava'
import {performance} from 'perf_hooks'
import sinon, { expectation } from 'sinon'

import { IContentType, IEditorInterface } from '../model'
import SimpleCMAClient from './index'

const fakeContentType: IContentType = {
  sys: { id: 'test-content-type' },
  displayField: 'name',
  name: 'test123',
  description: '',
  fields: [],
} as any

const fakeEditorInterface: IEditorInterface = {
  sys: { id: 'test-editor-interface' },
  controls: [],
} as any

test('SimpleCMAClient gets a content type', async (t) => {
  const fetch = sinon.stub()
    .resolves({
      status: 200,
      json: sinon.stub().resolves(fakeContentType),
    })

  const uut = new SimpleCMAClient({
    spaceId: '1234',
    environmentId: 'staging',
    accessToken: 'my-token',
  }, fetch as any)

  // act
  const resp = await uut.getContentType(`some-type`)

  // assert
  t.deepEqual(resp as any, fakeContentType)
  t.true(fetch.calledOnce)
  const [call0] = fetch.getCalls()
  t.deepEqual(call0.args[0],
    `https://api.contentful.com/spaces/1234/environments/staging/content_types/some-type`)
  t.deepEqual(call0.args[1], {
    method: 'GET',
    headers: {
      Authorization: 'Bearer my-token',
    },
    redirect: 'follow',
  })
})

test('SimpleCMAClient gets an editor interface', async (t) => {
  const fetch = sinon.stub()
    .resolves({
      status: 200,
      json: sinon.stub().resolves(fakeEditorInterface),
    })

  const uut = new SimpleCMAClient({
    spaceId: '1234',
    environmentId: 'staging',
    accessToken: 'my-token',
  }, fetch as any)

  // act
  const resp = await uut.getEditorInterface(`some-type`)

  // assert
  t.deepEqual(resp as any, fakeEditorInterface)
  t.true(fetch.calledOnce)
  const [call0] = fetch.getCalls()
  t.deepEqual(call0.args[0],
    `https://api.contentful.com/spaces/1234/environments/staging/content_types/some-type/editor_interface`)
  t.deepEqual(call0.args[1], {
    method: 'GET',
    headers: {
      Authorization: 'Bearer my-token',
    },
    redirect: 'follow',
  })
})

test('SimpleCMAClient handles rate limiting', async (t) => {
  const fetch = sinon.stub()
    .resolves({
      status: 200,
      json: sinon.stub().resolves(fakeContentType),
    })
    .onFirstCall().resolves({
      status: 429,
      headers: {
        get: sinon.stub().returns(2.1),
      },
    })

  const uut = new SimpleCMAClient({
    spaceId: '1234',
    environmentId: 'staging',
    accessToken: 'my-token',
  }, fetch as any)

  // act
  const before = performance.now()
  const resp = await uut.getContentType(`some-type`)
  const after = performance.now()

  // assert
  t.deepEqual(resp as any, fakeContentType)
  t.true(fetch.calledTwice)
  t.true(after - before > 2100)
})
