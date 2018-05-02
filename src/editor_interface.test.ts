import { expect } from 'chai'

import { writeEditorInterfaceChange } from './editor_interface'
import { IEditorInterface } from './model'

describe('editor interfaces', () => {

  const from: { [id: string]: IEditorInterface } = {
    menu: {
      'sys': {
        'id': 'default',
        'type': 'EditorInterface',
        'space': {
          'sys': {
            'id': '7yx6ovlj39n5',
            'type': 'Link',
            'linkType': 'Space'
          }
        },
        'version': 14,
        'createdAt': '2018-03-27T18:04:12.981Z',
        'createdBy': {
          'sys': {
            'id': '0SUbYs2vZlXjVR6bH6o83O',
            'type': 'Link',
            'linkType': 'User'
          }
        },
        'updatedAt': '2018-04-06T20:02:28.673Z',
        'updatedBy': {
          'sys': {
            'id': '0SUbYs2vZlXjVR6bH6o83O',
            'type': 'Link',
            'linkType': 'User'
          }
        },
        'contentType': {
          sys: {
            id: 'menu',
            'type': 'Link',
            'linkType': 'ContentType'
          }
        }
      },
      controls: [
        {
          fieldId: 'name',
          widgetId: 'singleLine'
        },
        {
          fieldId: 'topButton',
          widgetId: 'entryLinkEditor'
        },
        {
          fieldId: 'items',
          widgetId: 'entryLinksEditor'
        }
      ]
    },
    'section-video-highlight': {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "space": {
          "sys": {
            "id": "7yx6ovlj39n5",
            "type": "Link",
            "linkType": "Space"
          }
        },
        "version": 4,
        "createdAt": "2018-03-29T21:49:59.179Z",
        "createdBy": {
          "sys": {
            "id": "0SUbYs2vZlXjVR6bH6o83O",
            "type": "Link",
            "linkType": "User"
          }
        },
        "updatedAt": "2018-03-29T21:51:13.861Z",
        "updatedBy": {
          "sys": {
            "id": "0SUbYs2vZlXjVR6bH6o83O",
            "type": "Link",
            "linkType": "User"
          }
        },
        "contentType": {
          "sys": {
            "id": "section-video-highlight",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "tag",
          "settings": {
            "helpText": "This will be displayed in small text above the video title"
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "title",
          "widgetId": "singleLine"
        },
        {
          "fieldId": "subtext",
          "settings": {
            "helpText": "This text will be subdued beneath the title"
          },
          "widgetId": "multipleLine"
        },
        {
          "fieldId": "embedCode",
          "settings": {
            "helpText": "This must be an \"iframe\" or \"script\" snippet"
          },
          "widgetId": "multipleLine"
        }
      ]
    }
  }

  const to: { [id: string]: IEditorInterface } = {
    menu: {
      'sys': {
        'id': 'default',
        'type': 'EditorInterface',
        'space': {
          'sys': {
            'id': '7yx6ovlj39n5',
            'type': 'Link',
            'linkType': 'Space'
          }
        },
        'version': 14,
        'createdAt': '2018-03-27T18:04:12.981Z',
        'createdBy': {
          'sys': {
            'id': '0SUbYs2vZlXjVR6bH6o83O',
            'type': 'Link',
            'linkType': 'User'
          }
        },
        'updatedAt': '2018-04-06T20:02:28.673Z',
        'updatedBy': {
          'sys': {
            'id': '0SUbYs2vZlXjVR6bH6o83O',
            'type': 'Link',
            'linkType': 'User'
          }
        },
        'contentType': {
          sys: {
            id: 'menu',
            'type': 'Link',
            'linkType': 'ContentType'
          }
        }
      },
      controls: [
        {
          fieldId: 'name',
          widgetId: 'singleLine'
        },
        {
          fieldId: 'topButton',
          widgetId: 'entryLinkEditor'
        },
        {
          fieldId: 'items',
          widgetId: 'entryLinksEditor'
        }
      ]
    },
    'section-video-highlight': {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "space": {
          "sys": {
            "id": "7yx6ovlj39n5",
            "type": "Link",
            "linkType": "Space"
          }
        },
        "version": 4,
        "createdAt": "2018-03-29T21:49:59.179Z",
        "createdBy": {
          "sys": {
            "id": "0SUbYs2vZlXjVR6bH6o83O",
            "type": "Link",
            "linkType": "User"
          }
        },
        "updatedAt": "2018-03-29T21:51:13.861Z",
        "updatedBy": {
          "sys": {
            "id": "0SUbYs2vZlXjVR6bH6o83O",
            "type": "Link",
            "linkType": "User"
          }
        },
        "contentType": {
          "sys": {
            "id": "section-video-highlight",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "tag",
          "settings": {
            "helpText": "Choose from one of the available tags"
          },
          "widgetId": "dropdown"
        },
        {
          "fieldId": "title",
          "widgetId": "singleLine"
        },
        {
          "fieldId": "subtext",
          "settings": {
            "helpText": "This text will be subdued beneath the title"
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "embedCode",
          "settings": {
            "helpText": "This must be an \"iframe\" or \"script\" snippet"
          },
          "widgetId": "custom-editor-extension"
        }
      ]
    }
  }

  context('brand new content type', () => {

    it('explicitly writes default on initial', async () => {
      const buf = new Buffer('')
      const chunks: string[] = []

      await writeEditorInterfaceChange(null, to.menu, async (chunk) => chunks.push(chunk))

      const written = chunks.join('')
      expect(written).to.include("menu.changeEditorInterface('name', 'singleLine')")
      expect(written).to.include("menu.changeEditorInterface('topButton', 'entryLinkEditor')")
      expect(written).to.include("menu.changeEditorInterface('items', 'entryLinksEditor')")
    })

    it('writes nothing if no diff', async () => {
      const buf = new Buffer('')
      const chunks: string[] = []

      await writeEditorInterfaceChange(from.menu, to.menu, async (chunk) => chunks.push(chunk))

      const written = chunks.join('')
      expect(written).to.eq('')
    })

    it('writes changes for diffs', async () => {
      const buf = new Buffer('')
      const chunks: string[] = []

      await writeEditorInterfaceChange(from['section-video-highlight'], to['section-video-highlight'], async (chunk) => chunks.push(chunk))

      const written = chunks.join('')
      expect(written).to.include("sectionVideoHighlight.changeEditorInterface('tag', 'dropdown')")
      expect(written).to.include("sectionVideoHighlight.changeEditorInterface('subtext', 'singleLine')")
      expect(written).to.include("sectionVideoHighlight.changeEditorInterface('embedCode', 'custom-editor-extension')")

      expect(written).to.not.include("title")
    })

    // contentful-migration-cli does not yet support writing help text
    it('writes help text if present')
  })
})
