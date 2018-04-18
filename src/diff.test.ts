import { expect } from "chai"

import { isDiff, isDiffItem, isDiffObj } from "./diff"

const { diff } = require("json-diff")

describe("isDiff", () => {
  it("handles simple diff", () => {
    const a = { test: 1 }
    const b = { test: 2 }
    const d = diff(a, b)

    // act
    expect(isDiff(d)).to.be.true
  })

  it("returns false for empty diff", () => {
    const a = { test: 1 }
    const b = { test: 1 }
    const d = diff(a, b)

    // act
    expect(isDiff(d)).to.be.false
  })

  it("returns false for non-diff", () => {
    // act
    expect(isDiff({ test: "data" })).to.be.false
  })

  it("handles complex diff", () => {
    const d = [
      ["~", {
        type: { __old: "Symbol", __new: "Text" },
      }],
    ["+",
      {
        id: "movedField",
        name: "Moved Field",
        type: "Number",
        localized: false,
        required: true,
        validations: [],
        disabled: false,
        omitted: false,
      }],
    ["+",
      {
        id: "newField",
        name: "New Field",
        type: "Symbol",
        localized: false,
        required: true,
        validations: [],
        disabled: false,
        omitted: false,
      }],
    ["~",
      {
        validations:
          [["~",
            {
              message:
                {
                  __old: "The Top Button must be a button linking to a URL or page.  If the menu is a dropdown, this button is visible when it is collapsed.",
                  __new: "A new message",
                },
            }]],
      }],
    ["-",
      {
        id: "movedField",
        name: "Moved Field",
        type: "Number",
        localized: false,
        required: true,
        validations: [],
        disabled: false,
        omitted: false,
      }],
    ["~",
      {
        disabled:
          {
            __old: false,
            __new: true,
          },
        items:
          {
            validations:
              [["-",
                {
                  range:
                    {
                      min: 1,
                      max: 4,
                    },
                }],
              [" "]],
          },
      }],
    ["-",
      {
        id: "sideMenu",
        name: "Side Menu",
        type: "Link",
        localized: false,
        required: false,
        validations:
          [{
            range:
              {
                min: 1,
                max: 5,
              },
          },
          {
            linkContentType: ["menu"],
            message: "The Side Menu must be a Menu",
          }],
        disabled: false,
        omitted: false,
        linkType: "Entry",
      }]]

    // act
    expect(isDiff(d)).to.be.true
  })

})

describe("isDiffItem", () => {
  it("returns false for empty array", () => {
    const d = []

    //act
    expect(isDiffItem(d)).to.be.false
  })

  it("returns false for array with wrong length", () => {
    const d = ["-", "a", "B"]

    //act
    expect(isDiffItem(d)).to.be.false
  })

  it("returns false for array with wrong key", () => {
    const d = ["a", "B"]

    //act
    expect(isDiffItem(d)).to.be.false
  })

  it("handles corner case", () => {
    const d = ["~", {disabled: {__old: false, __new: true}, items: {validations: [["-", {range: {min: 1, max: 4}}], [" "]]}}]

    //act
    expect(isDiffItem(d)).to.be.true
  })
})

describe("isDiffObj", () => {
  it("returns false for empty obj", () => {
    const d = {}

    // act
    expect(isDiffObj(d)).to.be.false
  })

  it("returns false for non-obj", () => {
    const d = ["+", {test: "data"}]

    // act
    expect(isDiffObj(d)).to.be.false
  })

  it("returns true for simple diff", () => {
    const a = { test: 1 }
    const b = { test: 2 }
    const d = diff(a, b)

    // act
    expect(isDiffObj(d)).to.be.true
  })

  it("returns true for diff with sub-diffs", () => {
    const d = { validations:
      [ [ "~",
          { message:
             { __old: "The Top Button must be a button linking to a URL or page.  If the menu is a dropdown, this button is visible when it is collapsed.",
               __new: "A new message" } } ] ] }

    // act
    expect(isDiffObj(d)).to.be.true
  })

  it("returns true for complex diff", () => {
    const d = {disabled: {__old: false, __new: true}, items: {validations: [["-", {range: {min: 1, max: 4}}], [" "]]}}

    // act
    expect(isDiffObj(d)).to.be.true
  })
})
