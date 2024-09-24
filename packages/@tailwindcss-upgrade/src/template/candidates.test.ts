import { __unstable__loadDesignSystem } from '@tailwindcss/node'
import { describe, expect, test } from 'vitest'
import { parseCandidate } from '../../../tailwindcss/src/candidate'
import { extractCandidates, toString } from './candidates'

let html = String.raw

test.skip('extracts candidates with positions from a template', () => {
  let content = html`
    <div class="bg-blue-500 hover:focus:text-white [color:red]">
      <button class="bg-blue-500 text-white">My button</button>
    </div>
  `

  expect(extractCandidates(content)).resolves.toMatchInlineSnapshot(`
    [
      {
        "candidate": {
          "important": false,
          "kind": "functional",
          "modifier": null,
          "negative": false,
          "raw": "bg-blue-500",
          "root": "bg",
          "value": {
            "fraction": null,
            "kind": "named",
            "value": "blue-500",
          },
          "variants": [],
        },
        "end": 28,
        "start": 17,
      },
      {
        "candidate": {
          "important": false,
          "kind": "functional",
          "modifier": null,
          "negative": false,
          "raw": "hover:focus:text-white",
          "root": "text",
          "value": {
            "fraction": null,
            "kind": "named",
            "value": "white",
          },
          "variants": [
            {
              "compounds": true,
              "kind": "static",
              "root": "focus",
            },
            {
              "compounds": true,
              "kind": "static",
              "root": "hover",
            },
          ],
        },
        "end": 51,
        "start": 29,
      },
      {
        "candidate": {
          "important": false,
          "kind": "arbitrary",
          "modifier": null,
          "property": "color",
          "raw": "[color:red]",
          "value": "red",
          "variants": [],
        },
        "end": 63,
        "start": 52,
      },
      {
        "candidate": {
          "important": false,
          "kind": "functional",
          "modifier": null,
          "negative": false,
          "raw": "bg-blue-500",
          "root": "bg",
          "value": {
            "fraction": null,
            "kind": "named",
            "value": "blue-500",
          },
          "variants": [],
        },
        "end": 98,
        "start": 87,
      },
      {
        "candidate": {
          "important": false,
          "kind": "functional",
          "modifier": null,
          "negative": false,
          "raw": "text-white",
          "root": "text",
          "value": {
            "fraction": null,
            "kind": "named",
            "value": "white",
          },
          "variants": [],
        },
        "end": 109,
        "start": 99,
      },
    ]
  `)
})

describe('toString()', () => {
  test.each([
    // Arbitrary candidates
    ['[color:red]', '[color:red]'],
    ['[color:red]/50', '[color:red]/50'],
    ['[color:red]/[0.5]', '[color:red]/[0.5]'],
    ['[color:red]/50!', '[color:red]/50!'],
    ['![color:red]/50', '[color:red]/50!'],
    ['[color:red]/[0.5]!', '[color:red]/[0.5]!'],

    // Static candidates
    ['box-border', 'box-border'],
    ['underline!', 'underline!'],
    ['!underline', 'underline!'],
    ['-inset-full', '-inset-full'],

    // Functional candidates
    ['bg-red-500', 'bg-red-500'],
    ['bg-red-500/50', 'bg-red-500/50'],
    ['bg-red-500/[0.5]', 'bg-red-500/[0.5]'],
    ['bg-red-500!', 'bg-red-500!'],
    ['!bg-red-500', 'bg-red-500!'],
    ['bg-[#0088cc]/50', 'bg-[#0088cc]/50'],
    ['bg-[#0088cc]/[0.5]', 'bg-[#0088cc]/[0.5]'],
    ['bg-[#0088cc]!', 'bg-[#0088cc]!'],
    ['!bg-[#0088cc]', 'bg-[#0088cc]!'],
    ['w-1/2', 'w-1/2'],
  ])('%s', async (candidate: string, result: string) => {
    let designSystem = await __unstable__loadDesignSystem('@import "tailwindcss";', {
      base: __dirname,
    })

    let candidates = parseCandidate(candidate, designSystem)

    // TODO: This seems unexpected?
    // Sometimes we will have a functional and a static candidate for the same
    // raw input string (e.g. `-inset-full`). Dedupe in this case.
    let cleaned = new Set([...candidates].map(toString))

    expect([...cleaned]).toEqual([result])
  })
})
