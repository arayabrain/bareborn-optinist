import { memo, useContext, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"

import { Launch } from "@mui/icons-material"
import { Tooltip } from "@mui/material"

import { createParamFormItemComponent } from "components/common/ParamFormItemCreator"
import { SectionTitle } from "components/common/ParamSection"
import { ParamFormContext } from "components/Workspace/FlowChart/RightDrawer/ParamFormContents"
import { getAlgoParams } from "store/slice/AlgorithmNode/AlgorithmNodeActions"
import {
  selectAlgorithmName,
  selectAlgorithmParamsExit,
  selectAlgorithmParamsKeyList,
  selectAlgorithmParamsValue,
  selectAlgorithmParam,
} from "store/slice/AlgorithmNode/AlgorithmNodeSelectors"
import { updateParam } from "store/slice/AlgorithmNode/AlgorithmNodeSlice"
import { ParamItemProps } from "store/slice/RightDrawer/RightDrawerType"
import { AppDispatch } from "store/store"
import { arrayEqualityFn } from "utils/EqualityUtils"

export const AlgorithmParamForm = memo(function AlgorithmParamForm() {
  const nodeId = useContext<string>(ParamFormContext)
  const dispatch = useDispatch<AppDispatch>()
  const algoName = useSelector(selectAlgorithmName(nodeId))
  const algoParamIsLoaded = useSelector(selectAlgorithmParamsExit(nodeId))
  const paramKeyList = useSelector(
    selectAlgorithmParamsKeyList(nodeId),
    arrayEqualityFn,
  )
  const parameterUrl = `https://github.com/arayabrain/barebone-studio/blob/develop-main/docs/specifications/algorithm_nodes.md#${algoName.toLowerCase()}`
  useEffect(() => {
    if (!algoParamIsLoaded) {
      dispatch(getAlgoParams({ nodeId, algoName }))
    }
  }, [dispatch, nodeId, algoName, algoParamIsLoaded])
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex" }}>
        <SectionTitle>{algoName}</SectionTitle>
        <a
          href={parameterUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: "underline",
            color: "inherit",
            cursor: "pointer",
            marginLeft: "5px",
          }}
        >
          <Tooltip title="Check Documentation">
            <Launch style={{ fontSize: "16px" }} />
          </Tooltip>
        </a>
      </div>
      {paramKeyList.map((paramKey) => (
        <ParamItem key={paramKey} paramKey={paramKey} />
      ))}
    </div>
  )
})

const ParamItem = memo(function ParamItem({ paramKey }: ParamItemProps) {
  const nodeId = useContext(ParamFormContext)
  const Component = createParamFormItemComponent({
    paramSelector: (paramKey) => selectAlgorithmParam(nodeId, paramKey),
    paramValueSelector: (path) => selectAlgorithmParamsValue(nodeId, path),
    paramUpdateActionCreator: (path, newValue, initValue) =>
      updateParam({ nodeId, path, newValue, initValue }),
  })
  return <Component paramKey={paramKey} />
})
