# contentful-schema-diff

[![npm version](https://img.shields.io/npm/v/contentful-schema-diff.svg)](https://www.npmjs.com/package/contentful-schema-diff)
[![License](https://img.shields.io/npm/l/contentful-schema-diff.svg)](LICENSE.txt)
[![CircleCI](https://circleci.com/gh/watermarkchurch/contentful-schema-diff.svg?style=svg)](https://circleci.com/gh/watermarkchurch/contentful-schema-diff)
[![Coverage Status](https://coveralls.io/repos/github/watermarkchurch/contentful-schema-diff/badge.svg)](https://coveralls.io/github/watermarkchurch/contentful-schema-diff)

A tool to automatically generate a starting point for a schema migration
between two Contentful spaces

`npm install --global contentful-schema-diff`

usage:
```bash
contentful-schema-diff --from <export file or space> --to <export file or space>

Options:
  --help              Show help                                        [boolean]
  --version           Show version number                              [boolean]
  --from, -f          A contentful export file, or Contentful Space ID[required]
  --to, -t            A contentful export file, space ID, or environment within
                      the "from" space                                [required]
  --content-type, -c  Generate a migration only for this content type.  Repeat
                      to select multiple types.
  --out, -o           The output directory (or file if "--one-file" was
                      specified) in which to place the migration
  --js                force writing javascript files                   [boolean]
  --ts                force writing typescript files                   [boolean]
  --token, -a         A Contentful management token to download content types
                      from a space
  --one-file          Write all the migrations in a single file
  --no-format, -F     disables formatting the output file              [boolean]
```

Note: "from" indicates the space with the *old versions* of the content types.
You will be generating a migration *from* the state of the current production space
*to* the state of your dev space.  Thus 'from = production' and 'to = dev'.

The tool works either on Contentful export files, or by directly downloading content
from a space.

> ## ⚠️ WARNING! ⚠️
> This tool outputs Typescript files by default.  You cannot run these files directly with the contenful-migration tool.
> See https://github.com/watermarkchurch/contentful-schema-diff/issues/49 for instructions on how to run them directly,
> or https://github.com/watermarkchurch/contentful-schema-diff/issues/59 for how to run them programmatically.
> Or better yet, send us a pull request that would make the tool output javascript migrations!

## Method 1: download content types from the space directly

```bash
$ contentful-schema-diff --from <from space> --to <to space> --token <my contentful management token>
```

Or you can compare any environment to master, for example to generate a migration
that will fast-forward your master environment to match the staging environment in 
that space:

```bash
$ contentful-schema-diff --from <from space> --to staging --token <my contentful management token>
```

Or you can use another environment as the source with the 'slash syntax', for example
to do a migration that will fast-forward the tip of the unreleased "develop"
branch (which runs in staging against the "Staging" environment in contentful)
to your current working environment.  Then you can check this migration into your
pull request.

```bash
$ contentful-schema-diff --from 1xab12345678/staging --to dev --token <my contentful management token>
```

## Method 2: Export the files first

```bash
$ contentful-export --space-id <from space> --management-token $CONTENTFUL_MANAGEMENT_TOKEN \
  --skip-content --skip-roles --skip-webhooks


$ contentful-export --space-id <to space> --management-token $CONTENTFUL_MANAGEMENT_TOKEN \
  --skip-content --skip-roles --skip-webhooks
```

Alternately this could also used to generate a migration between two environments

```bash
$ contentful-export --space-id <space> --management-token $CONTENTFUL_MANAGEMENT_TOKEN \
  --skip-content --skip-roles --skip-webhooks --environment-id=gburgett


$ contentful-export --space-id <space> --management-token $CONTENTFUL_MANAGEMENT_TOKEN \
  --skip-content --skip-roles --skip-webhooks --environment-id=dev
```

After you have downloaded the files, run the contentful-schema-diff tool:

```bash
$ contentful-schema-diff --from contentful-export-<from space>-<date>.json \
  --to contentful-export-<to space>-<date>.json
```

## Results

One or many new typescript file(s) will be created.  They will include many of the migrations
necessary to transition the "from" space to have the same structure as the "to"
space.  Where it couldn't figure out how to do the migration, it has left
a code comment with the diff of the fields for that content type.

example:

```ts
import Migration from 'contentful-migration'

// Generated by contentful-schema-diff
// from 7yx6ovlj39n5/staging
// to   gburgett
export = function(migration : Migration) {

  const resource = migration.createContentType('resource', {
    displayField: 'name',
    name: 'Resource',
    description: ''
  })

  resource.createField('name', {
    name: 'Name',
    type: 'Symbol',
    localized: false,
    required: true,
    validations: [],
    disabled: false,
    omitted: false
  })

  resource.createField('type', {
    name: 'Type',
    type: 'Symbol',
    localized: false,
    required: false,
    validations:
      [{
        in:
          ['document',
            'video',
            'article',
            'asset']
      }],
    disabled: false,
    omitted: false
  })

  resource.createField('tags', {
    name: 'Tags',
    type: 'Array',
    localized: false,
    required: false,
    validations: [],
    disabled: false,
    omitted: false,
    items:
      {
        type: 'Symbol',
        validations: []
      }
  })

  resource.createField('asset', {
    name: 'Asset',
    type: 'Link',
    localized: false,
    required: false,
    validations: [],
    disabled: false,
    omitted: false,
    linkType: 'Asset'
  })

  resource.createField('externalAsset', {
    name: 'External Asset',
    type: 'Symbol',
    localized: false,
    required: false,
    validations: [{ regexp: { pattern: '^(ftp|http|https):\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-\\/]))?$' } }],
    disabled: false,
    omitted: false
  })

  resource.changeEditorInterface('name', 'singleLine')

  resource.changeEditorInterface('type', 'dropdown')

  resource.changeEditorInterface('tags', 'tagEditor')

  resource.changeEditorInterface('asset', 'assetLinkEditor')

  resource.changeEditorInterface('externalAsset', 'urlEditor')

}

```

```ts
import Migration from 'contentful-migration'

// Generated by contentful-schema-diff
// from 7yx6ovlj39n5
// to   gburgett
export = function(migration : Migration) {

  let menu = migration.editContentType('menu')

  /*
 [
   ...
   {
     items: {
       validations: [
         {
           linkContentType: [
-            "menu"
+            "dropdownMenu"
             "menuButton"
           ]
         }
       ]
     }
   }
-  {
-    id: "sideMenu"
-    name: "Side Menu"
-    type: "Link"
-    validations: [
-      {
-        linkContentType: [
-          "menu"
-        ]
-        message: "The Side Menu must be a Menu"
-      }
-    ]
-    linkType: "Entry"
-  }
 ]
 */

  menu.deleteField('sideMenu')

  menu.editField('items')
    .items({
      type: 'Link',
      validations:
        [{
          linkContentType:
            ['dropdownMenu',
              'menuButton'],
          message: 'The items must be either buttons or drop-down menus.'
        }],
      linkType: 'Entry',
    })

}
```
