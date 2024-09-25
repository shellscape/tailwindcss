import { AtRule, type ChildNode, type Plugin, type Root } from 'postcss'

export function migrateMissingLayers(): Plugin {
  function migrate(root: Root) {
    let lastLayer = ''
    let bucket: ChildNode[] = []
    let buckets: [layer: string, bucket: typeof bucket][] = []

    root.each((node) => {
      if (node.type === 'atrule') {
        // Known Tailwind directives that should not be inside a layer.
        if (node.name === 'theme' || node.name === 'utility') {
          if (bucket.length > 0) {
            buckets.push([lastLayer, bucket.splice(0)])
          }
          return
        }

        // Base
        if (
          (node.name === 'tailwind' && node.params === 'base') ||
          (node.name === 'import' && node.params.match(/^["']tailwindcss\/base["']/))
        ) {
          if (bucket.length > 0) {
            buckets.push([lastLayer, bucket.splice(0)])
          }

          lastLayer = 'base'
          return
        }

        // Components
        if (
          (node.name === 'tailwind' && node.params === 'components') ||
          (node.name === 'import' && node.params.match(/^["']tailwindcss\/components["']/))
        ) {
          if (bucket.length > 0) {
            buckets.push([lastLayer, bucket.splice(0)])
          }

          lastLayer = 'components'
          return
        }

        // Utilities
        if (
          (node.name === 'tailwind' && node.params === 'utilities') ||
          (node.name === 'import' && node.params.match(/^["']tailwindcss\/utilities["']/))
        ) {
          if (bucket.length > 0) {
            buckets.push([lastLayer, bucket.splice(0)])
          }

          lastLayer = 'utilities'
          return
        }

        // Already in a layer
        if (node.name === 'layer') {
          if (bucket.length > 0) {
            buckets.push([lastLayer, bucket.splice(0)])
          }
          return
        }

        // Add layer to `@import` at-rules
        if (node.name === 'import') {
          if (!node.params.includes('layer(')) {
            node.params += ` layer(${lastLayer})`
          }

          if (bucket.length > 0) {
            buckets.push([lastLayer, bucket.splice(0)])
          }
          return
        }
      }

      // Track the node
      if (lastLayer !== '') {
        bucket.push(node)
      }
    })

    // Wrap each bucket in an `@layer` at-rule
    for (let [layerName, nodes] of buckets) {
      let target = nodes[0]
      let layerNode = new AtRule({
        name: 'layer',
        params: layerName,
        nodes: nodes.map((node) => {
          // Keep the target node as-is, because we will be replacing that one
          // with the new layer node.
          if (node === target) {
            return node
          }

          // Every other node should be removed from its original position. They
          // will be added to the new layer node.
          return node.remove()
        }),
        raws: {
          tailwind_pretty: true,
        },
      })
      target.replaceWith(layerNode)
    }
  }

  return {
    postcssPlugin: '@tailwindcss/upgrade/migrate-missing-layers',
    OnceExit: migrate,
  }
}