import { Node } from "reactflow"

import { createSelector } from "reselect"

import {
  AlgorithmNodePostData,
  EdgeDict,
  InputNodePostData,
  NodeDict,
  RunPostData,
} from "api/run/Run"
import {
  selectAlgorithmFunctionPath,
  selectAlgorithmIsUpdated,
  selectAlgorithmName,
  selectAlgorithmParams,
} from "store/slice/AlgorithmNode/AlgorithmNodeSelectors"
import {
  selectFlowEdges,
  selectFlowNodes,
} from "store/slice/FlowElement/FlowElementSelectors"
import { NODE_TYPE_SET } from "store/slice/FlowElement/FlowElementType"
import { isAlgorithmNodeData } from "store/slice/FlowElement/FlowElementUtils"
import {
  selectInputNodeFileType,
  selectInputNodeHDF5Path,
  selectInputNodeMatlabPath,
  selectInputNodeParam,
  selectInputNodeSelectedFilePath,
} from "store/slice/InputNode/InputNodeSelectors"
import { selectNwbParams } from "store/slice/NWB/NWBSelectors"
import { selectPipelineNodeResultStatus } from "store/slice/Pipeline/PipelineSelectors"
import { NODE_RESULT_STATUS } from "store/slice/Pipeline/PipelineType"
import { selectSnakemakeParams } from "store/slice/Snakemake/SnakemakeSelectors"
import { RootState } from "store/store"

/**
 * 前回の結果で、エラーまたはParamに変更があるnodeのリストを返す
 */
const selectForceRunList = (state: RootState) => {
  const nodes = selectFlowNodes(state)
  return nodes
    .filter(isAlgorithmNodeData)
    .filter((node) => {
      const originalValue = selectAlgorithmIsUpdated(node.id)(state)
      const status = selectPipelineNodeResultStatus(node.id)(state)
      return originalValue || status === NODE_RESULT_STATUS.ERROR
    })
    .map((node) => ({
      nodeId: node.id,
      name: selectAlgorithmName(node.id)(state),
    }))
}

const selectNodeDictForRun = (state: RootState): NodeDict => {
  const nodes = selectFlowNodes(state)
  const nodeDict: NodeDict = {}
  nodes.forEach((node) => {
    if (isAlgorithmNodeData(node)) {
      const param = selectAlgorithmParams(node.id)(state) ?? {}
      const functionPath = selectAlgorithmFunctionPath(node.id)(state)
      const algorithmNodePostData: Node<AlgorithmNodePostData> = {
        ...node,
        data: {
          ...node.data,
          label: node.data?.label ?? "",
          type: NODE_TYPE_SET.ALGORITHM,
          path: functionPath,
          param,
        },
      }
      nodeDict[node.id] = algorithmNodePostData
    } else {
      const filePath = selectInputNodeSelectedFilePath(node.id)(state)
      const fileType = selectInputNodeFileType(node.id)(state)
      const param = selectInputNodeParam(node.id)(state)
      const hdf5Path = selectInputNodeHDF5Path(node.id)(state)
      const matPath = selectInputNodeMatlabPath(node.id)(state)
      const inputNodePosyData: Node<InputNodePostData> = {
        ...node,
        data: {
          ...node.data,
          label: node.data?.label ?? "",
          type: NODE_TYPE_SET.INPUT,
          path: filePath ?? "",
          param,
          matPath: matPath,
          hdf5Path: hdf5Path,
          fileType,
        },
      }
      nodeDict[node.id] = inputNodePosyData
    }
  })
  return nodeDict
}

const selectEdgeDictForRun = (state: RootState) => {
  const edgeDict: EdgeDict = {}
  selectFlowEdges(state).forEach((edge) => {
    edgeDict[edge.id] = edge
  })
  return edgeDict
}

export const selectRunPostData = createSelector(
  selectNwbParams,
  selectSnakemakeParams,
  selectEdgeDictForRun,
  selectNodeDictForRun,
  selectForceRunList,
  (
    nwbParams,
    snakemakeParams,
    edgeDictForRun,
    nodeDictForRun,
    forceRunList,
  ) => {
    const runPostData: Omit<RunPostData, "name"> = {
      nwbParam: nwbParams,
      snakemakeParam: snakemakeParams,
      edgeDict: edgeDictForRun,
      nodeDict: nodeDictForRun,
      forceRunList,
    }
    return runPostData
  },
)
