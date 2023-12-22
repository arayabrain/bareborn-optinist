import { TreeNodeTypeDTO } from "api/files/Files"
import { TreeNodeType } from "store/slice/FilesTree/FilesTreeType"

export function convertToTreeNodeType(dto: TreeNodeTypeDTO[]): TreeNodeType[] {
  return dto.map((node) =>
    node.isdir
      ? {
          path: node.path,
          name: node.name,
          isDir: true,
          nodes: convertToTreeNodeType(node.nodes),
          shape: node.shape,
        }
      : {
          path: node.path,
          name: node.name,
          isDir: false,
          shape: node.shape,
        },
  )
}

export function isDirNodeByPath(path: string, tree: TreeNodeType[]): boolean {
  const node = getNodeByPath(path, tree)
  if (node != null) {
    return node.isDir
  } else {
    throw new Error(`failed to get node: ${path}`)
  }
}

export function getNodeByPath(
  path: string,
  tree: TreeNodeType[],
): TreeNodeType | null {
  let targetNode: TreeNodeType | null = null
  for (const node of tree) {
    if (path === node.path) {
      targetNode = node
      break
    } else {
      if (node.isDir) {
        targetNode = getNodeByPath(path, node.nodes)
        if (targetNode != null) {
          break
        }
      }
    }
  }
  return targetNode
}
