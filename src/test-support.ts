import { IContentType, IField } from './model'

export function fakeContentType(
  id: string = 'test',
  ...fields: IContentType['fields']
): IContentType {
  return {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: '7yx6ovlj39n5',
        },
      },
      id,
      type: 'ContentType',
      createdAt: '2018-03-27T18:04:12.590Z',
      updatedAt: '2018-04-06T20:02:28.519Z',
      environment: {
        sys: {
          id: 'gburgett',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      createdBy: {
        sys: {
          type: 'Link',
          linkType: 'User',
          id: '0SUbYs2vZlXjVR6bH6o83O',
        },
      },
      updatedBy: {
        sys: {
          type: 'Link',
          linkType: 'User',
          id: '0SUbYs2vZlXjVR6bH6o83O',
        },
      },
      publishedCounter: 8,
      version: 16,
      publishedBy: {
        sys: {
          type: 'Link',
          linkType: 'User',
          id: '0SUbYs2vZlXjVR6bH6o83O',
        },
      },
      publishedVersion: 15,
      firstPublishedAt: '2018-03-27T18:04:12.855Z',
      publishedAt: '2018-04-06T20:02:28.519Z',
    },
    displayField: 'name',
    name: 'Menu',
    description:
      'A Menu contains a number of Menu Buttons or other Menus, which will be rendered as drop-downs.',
    fields,
  }
}

export function fakeField(field: Partial<IField>): IField {
  return Object.assign(
    {
      id: 'test',
      name: 'Test',
      type: 'Symbol',
      localized: false,
      required: false,
      validations: [],
      disabled: false,
      omitted: false,
    },
    field,
  )
}
