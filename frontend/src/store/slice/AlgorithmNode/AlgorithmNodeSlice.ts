import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit"

import { isAlgorithmNodePostData } from "api/run/RunUtils"
import { getAlgoParams } from "store/slice/AlgorithmNode/AlgorithmNodeActions"
import {
  ALGORITHM_NODE_SLICE_NAME,
  AlgorithmNode,
  TDataFilterParam,
} from "store/slice/AlgorithmNode/AlgorithmNodeType"
import { addAlgorithmNode } from "store/slice/FlowElement/FlowElementActions"
import {
  clearFlowElements,
  deleteFlowNodes,
  deleteFlowNodeById,
} from "store/slice/FlowElement/FlowElementSlice"
import { NODE_TYPE_SET } from "store/slice/FlowElement/FlowElementType"
import { run, runByCurrentUid } from "store/slice/Pipeline/PipelineActions"
import {
  reproduceWorkflow,
  importWorkflowConfig,
  fetchWorkflow,
} from "store/slice/Workflow/WorkflowActions"
import { convertToParamMap, getChildParam } from "utils/param/ParamUtils"

const initialState: AlgorithmNode = {}

export const algorithmNodeSlice = createSlice({
  name: ALGORITHM_NODE_SLICE_NAME,
  initialState,
  reducers: {
    updateParam: (
      state,
      action: PayloadAction<{
        nodeId: string
        path: string
        newValue: unknown
        initValue: unknown
      }>,
    ) => {
      const { nodeId, path, newValue, initValue } = action.payload
      const param = state[nodeId].params
      if (param != null) {
        const target = getChildParam(path, param)
        if (target != null) {
          target.value = newValue
          state[nodeId].isUpdate = !(
            JSON.stringify(initValue) === JSON.stringify(newValue)
          )
        }
      }
    },
    updateFilterParams: (
      state,
      action: PayloadAction<{
        nodeId: string
        dataFilterParam: TDataFilterParam
      }>,
    ) => {
      const { nodeId, dataFilterParam } = action.payload
      state[nodeId].dataFilterParam = dataFilterParam
      state[nodeId].isUpdateFilter =
        JSON.stringify(dataFilterParam) !==
        JSON.stringify(state[nodeId]?.originalDataFilterValue)
    },
    resetDataFilterParams: (state, action: PayloadAction<string>) => {
      state[action.payload].dataFilterParam = state[action.payload]
        .originalDataFilterValue as TDataFilterParam
      state[action.payload].isUpdateFilter = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAlgoParams.fulfilled, (state, action) => {
        const { nodeId } = action.meta.arg
        state[nodeId].params = convertToParamMap(action.payload)
      })
      .addCase(addAlgorithmNode.fulfilled, (state, action) => {
        const { node, functionPath, name, runAlready } = action.meta.arg
        const params = action.payload
        if (node.data?.type === NODE_TYPE_SET.ALGORITHM) {
          state[node.id] = {
            ...state[node.id],
            functionPath,
            name,
            params: convertToParamMap(params),
            isUpdate: runAlready ?? false,
            isUpdateFilter: runAlready ?? false,
          }
        }
      })
      .addCase(clearFlowElements, () => initialState)
      .addCase(deleteFlowNodes, (state, action) => {
        action.payload.forEach((node) => {
          if (node.data?.type === NODE_TYPE_SET.ALGORITHM) {
            delete state[node.id]
          }
        })
      })
      .addCase(deleteFlowNodeById, (state, action) => {
        if (Object.keys(state).includes(action.payload)) {
          delete state[action.payload]
        }
      })
      .addCase(run.fulfilled, (state, action) => {
        const runPostData = action.meta.arg.runPostData
        Object.values(runPostData.nodeDict)
          .filter(isAlgorithmNodePostData)
          .forEach((node) => {
            if (state[node.id].dataFilterParam) {
              state[node.id].dataFilterParam = undefined
            }
          })
      })
      .addCase(runByCurrentUid.fulfilled, (state, action) => {
        const runPostData = action.meta.arg.runPostData
        Object.values(runPostData.nodeDict)
          .filter(isAlgorithmNodePostData)
          .forEach((node) => {
            state[node.id].originalDataFilterValue =
              state[node.id].dataFilterParam
          })
      })
      .addMatcher(
        isAnyOf(
          fetchWorkflow.fulfilled,
          reproduceWorkflow.fulfilled,
          importWorkflowConfig.fulfilled,
        ),
        (_, action) => {
          const newState: AlgorithmNode = {}
          Object.values(action.payload.nodeDict)
            .filter(isAlgorithmNodePostData)
            .forEach((node) => {
              if (node.data != null) {
                newState[node.id] = {
                  name: node.data.label,
                  functionPath: node.data.path,
                  params: node.data.param,
                  dataFilterParam: node.data.dataFilterParam,
                  originalValue: node.data.param,
                  originalDataFilterValue: node.data.dataFilterParam,
                  isUpdate: false,
                  isUpdateFilter: false,
                }
              }
            })
          return newState
        },
      )
      .addMatcher(
        isAnyOf(run.fulfilled, runByCurrentUid.fulfilled),
        (state, action) => {
          const runPostData = action.meta.arg.runPostData
          Object.values(runPostData.nodeDict)
            .filter(isAlgorithmNodePostData)
            .forEach((node) => {
              state[node.id].isUpdate = false
              state[node.id].isUpdateFilter = false
            })
        },
      )
  },
})

export const { updateParam, updateFilterParams, resetDataFilterParams } =
  algorithmNodeSlice.actions
export default algorithmNodeSlice.reducer
