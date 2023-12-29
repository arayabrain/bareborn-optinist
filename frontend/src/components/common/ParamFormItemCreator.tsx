import {
  ChangeEvent,
  FC,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { useDispatch, useSelector } from "react-redux"

import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import { AnyAction } from "@reduxjs/toolkit"

import { Accordion } from "components/common/Accordion"
import { ParamSwitch } from "components/common/ParamSwitch"
import { ParamTextField } from "components/common/ParamTextField"
import { DialogContext } from "components/Workspace/FlowChart/Dialog/DialogContext"
import {
  selectPipelineLatestUid,
  selectPipelineStatus,
} from "store/slice/Pipeline/PipelineSelectors"
import { RUN_STATUS } from "store/slice/Pipeline/PipelineType"
import { RootState } from "store/store"
import { ParamType } from "utils/param/ParamType"
import { isParamChild } from "utils/param/ParamUtils"

type ParamSelectorType = (paramKey: string) => (state: RootState) => ParamType
type ParamValueSelectorType = (path: string) => (state: RootState) => unknown
type ParamUpdateActionCreatorType = (
  path: string,
  newValue: unknown,
  initValue: unknown,
) => AnyAction

export type CreateParamFormItemComponentProps = {
  paramSelector: ParamSelectorType
  paramValueSelector: ParamValueSelectorType
  paramUpdateActionCreator: ParamUpdateActionCreatorType
  requireConfirm?: boolean
}

export function createParamFormItemComponent({
  paramSelector,
  paramValueSelector,
  paramUpdateActionCreator,
  requireConfirm,
}: CreateParamFormItemComponentProps): FC<{ paramKey: string }> {
  function useParamValueUpdate(
    path: string,
  ): [unknown, (newValue: unknown, initValue: unknown) => AnyAction] {
    const value = useSelector(paramValueSelector(path))
    const updateParamAction = (newValue: unknown, initValue: unknown) => {
      return paramUpdateActionCreator(path, newValue, initValue)
    }
    return [value, updateParamAction]
  }

  const ParamItemForString = memo(function ParamItemForString({
    name,
    path,
    pipelineStatus,
  }: ParamChildItemProps) {
    const dispatch = useDispatch()
    const [initValue, setInitValue] = useState<unknown>()
    const [value, updateParamAction] = useParamValueUpdate(path)
    const isArray = useRef(Array.isArray(value))
    const currentWorkflowId = useSelector(selectPipelineLatestUid)
    const { onOpenClearWorkflowIdDialog } = useContext(DialogContext)

    useEffect(() => {
      setInitValue(value)
      //eslint-disable-next-line
    }, [])

    useEffect(() => {
      if (pipelineStatus !== RUN_STATUS.START_PENDING) return
      setInitValue(value)
      //eslint-disable-next-line
    }, [pipelineStatus])

    const onChange = (
      e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    ) => {
      const newValue = e.target.value as string
      if (requireConfirm && currentWorkflowId != null) {
        onOpenClearWorkflowIdDialog({
          open: true,
          handleOk: () => {
            dispatch(updateParamAction(newValue, initValue))
          },
          handleCancel: () => null,
        })
      } else {
        dispatch(updateParamAction(newValue, initValue))
      }
    }

    const splitValue = (value: string) =>
      value
        .split(",")
        .filter(Boolean)
        .map((e) => Number(e))

    const onBlur = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const newValue = e.target.value as string
      if (requireConfirm && currentWorkflowId != null) {
        onOpenClearWorkflowIdDialog({
          open: true,
          handleOk: () => {
            dispatch(
              updateParamAction(
                splitValue(newValue),
                splitValue(initValue as string),
              ),
            )
          },
          handleCancel: () => null,
        })
      } else {
        dispatch(
          updateParamAction(
            splitValue(newValue),
            splitValue(initValue as string),
          ),
        )
      }
    }
    const valueField = Array.isArray(value)
      ? value.toLocaleString()
      : (value as string) || ""
    return (
      <ParamTextField
        label={name}
        value={valueField === undefined ? "" : valueField}
        onChange={onChange}
        onBlur={isArray.current ? onBlur : undefined}
      />
    )
  })

  const ParamItemForNumber = memo(function ParamItemForNumber({
    name,
    path,
    pipelineStatus,
  }: ParamChildItemProps) {
    const dispatch = useDispatch()
    const [value, updateParamAction] = useParamValueUpdate(path)
    const [initValue, setInitValue] = useState<unknown>()
    const currentWorkflowId = useSelector(selectPipelineLatestUid)
    const { onOpenClearWorkflowIdDialog } = useContext(DialogContext)

    useEffect(() => {
      setInitValue(value)
      //eslint-disable-next-line
    }, [])

    useEffect(() => {
      if (pipelineStatus !== RUN_STATUS.START_PENDING) return
      setInitValue(value)
      //eslint-disable-next-line
    }, [pipelineStatus])

    if (typeof value === "number") {
      const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newValue =
          event.target.value === "" ? "" : Number(event.target.value)
        if (typeof newValue === "number") {
          if (requireConfirm && currentWorkflowId != null) {
            onOpenClearWorkflowIdDialog({
              open: true,
              handleOk: () => {
                dispatch(updateParamAction(newValue, initValue))
              },
              handleCancel: () => null,
            })
          } else {
            dispatch(updateParamAction(newValue, initValue))
          }
        }
      }
      return (
        <ParamTextField
          type="number"
          label={name}
          value={value}
          onChange={onChange}
        />
      )
    } else {
      return null
    }
  })

  const ParamItemForBoolean = memo(function ParamItemForBoolean({
    name,
    path,
    pipelineStatus,
  }: ParamChildItemProps) {
    const dispatch = useDispatch()
    const [initValue, setInitValue] = useState<unknown>()
    const [value, updateParamAction] = useParamValueUpdate(path)
    const currentWorkflowId = useSelector(selectPipelineLatestUid)
    const { onOpenClearWorkflowIdDialog } = useContext(DialogContext)

    useEffect(() => {
      setInitValue(value)
      //eslint-disable-next-line
    }, [])

    useEffect(() => {
      if (pipelineStatus !== RUN_STATUS.START_PENDING) return
      setInitValue(value)
      //eslint-disable-next-line
    }, [pipelineStatus])

    if (typeof value === "boolean") {
      const onChange = () => {
        if (requireConfirm && currentWorkflowId != null) {
          onOpenClearWorkflowIdDialog({
            open: true,
            handleOk: () => {
              dispatch(updateParamAction(!value, initValue))
            },
            handleCancel: () => null,
          })
        } else {
          dispatch(updateParamAction(!value, initValue))
        }
      }
      return <ParamSwitch label={name} value={value} onChange={onChange} />
    } else {
      return null
    }
  })

  const ParamItemForValueType = memo(function ParamItemForValueType({
    name,
    path,
  }: ParamChildItemProps) {
    const pipelineStatus = useSelector(selectPipelineStatus)
    const [value] = useParamValueUpdate(path)
    if (typeof value === "number") {
      return (
        <ParamItemForNumber
          name={name}
          path={path}
          pipelineStatus={pipelineStatus}
        />
      )
    } else if (typeof value === "string") {
      return (
        <ParamItemForString
          name={name}
          path={path}
          pipelineStatus={pipelineStatus}
        />
      )
    } else if (typeof value === "boolean") {
      return (
        <ParamItemForBoolean
          name={name}
          path={path}
          pipelineStatus={pipelineStatus}
        />
      )
    } else {
      return (
        <ParamItemForString
          name={name}
          path={path}
          pipelineStatus={pipelineStatus}
        />
      )
    }
  })

  const ParamChildItem = memo(function ParamChildItem({
    path,
    name,
  }: ParamChildItemProps) {
    return <ParamItemForValueType name={name} path={path} />
  })

  const ParamItem = memo(function ParamItem({
    paramKey,
    param,
  }: ParamItemProps) {
    if (isParamChild(param)) {
      return <ParamChildItem path={param.path} name={paramKey} />
    } else {
      return (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            {paramKey}
          </AccordionSummary>
          <AccordionDetails>
            <div>
              {Object.entries(param.children).map(([paramKey, param]) => (
                <ParamItem key={paramKey} param={param} paramKey={paramKey} />
              ))}
            </div>
          </AccordionDetails>
        </Accordion>
      )
    }
  })

  return memo(function CreateParamFormItemComponen({
    paramKey,
  }: ParamKeyProps) {
    const param = useSelector(paramSelector(paramKey)) // 一階層目
    return <ParamItem paramKey={paramKey} param={param} />
  })
}

interface ParamKeyProps {
  paramKey: string
}

interface ParamItemProps extends ParamKeyProps {
  param: ParamType
}

interface ParamChildItemProps {
  name: string
  path: string
  pipelineStatus?: string
}
