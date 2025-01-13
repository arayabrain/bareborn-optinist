import {
  ChangeEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { shallowEqual, useDispatch, useSelector } from "react-redux"

import styled from "@emotion/styled"
import { Box, Button, Input, InputProps } from "@mui/material"

import { DialogContext } from "components/Workspace/FlowChart/Dialog/DialogContext"
import { selectAlgorithmDataFilterParam } from "store/slice/AlgorithmNode/AlgorithmNodeSelectors"
import { updateFilterParams } from "store/slice/AlgorithmNode/AlgorithmNodeSlice"
import { TDim } from "store/slice/AlgorithmNode/AlgorithmNodeType"

type InputDim = {
  title: string
  onChangeInput?: (value?: string) => void
  max?: number
  multiple?: boolean
} & InputProps

const InputDim = (props: InputDim) => {
  const { title, onChangeInput, max, multiple, ...p } = props
  const [value, setValue] = useState(p.value)
  const [valuePassed, setValuePassed] = useState<string>(p.value as string)

  useEffect(() => {
    setValue(p.value)
  }, [p.value])

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      let regex = /[^0-9,:]/g
      if (!multiple) regex = /[^0-9:]/g
      let value = event.target.value.replace(regex, "")
      let regexTest = /^(\d+:\d+)(,\d+:\d+)*$/
      if (!multiple) regexTest = /^(\d+:\d+)(\d+:\d+)*$/
      if (max) {
        value = value
          .split(",")
          .map((e) => {
            const dims = e.split(":")
            if (!dims.filter(Boolean).length) return e
            const dim0 = dims[0]
            const dim1 = dims[1]
            if (dim0 && !dim1 && Number(dim0) > max) return `${max}:`
            if (dim0 && dim1) {
              return `${Number(dim0) > max ? max : dim0}:${Number(dim1) > max ? max : dim1}`
            }
            return e
          })
          .join(",")
      }
      if (regexTest.test(value) || !value) setValuePassed(value)
      setValue(value)
    },
    [max, multiple],
  )

  const error = useMemo(() => {
    if (value !== valuePassed) return "Invalid format"
    const values = valuePassed.split(",").filter(Boolean)
    if (values.length) {
      const errorEnd = values.find((v) => {
        const dim1 = v.split(":")[1]
        const dim0 = v.split(":")[0]
        return dim1 && Number(dim1) < Number(dim0) ? dim0 : undefined
      })
      if (errorEnd) {
        return `The 'to' value must be >= ${errorEnd.split(":")[0]}`
      }
    }
    return null
  }, [value, valuePassed])

  const _onBlur = useCallback(() => {
    if (error && value) return
    setValue(valuePassed)
    onChangeInput?.(valuePassed)
  }, [error, onChangeInput, value, valuePassed])

  return (
    <Box flex={1}>
      <Box mb={1}>{title}</Box>
      <InputStyled
        {...p}
        error={value !== valuePassed}
        value={value}
        onChange={onChange}
        onBlur={_onBlur}
        autoCapitalize="off"
        autoComplete="off"
      />
      <TextError>{error}</TextError>
    </Box>
  )
}

const InputStyled = styled(Input, {
  shouldForwardProp: (props) => props !== "error",
})<{ error?: boolean }>`
  input {
    text-align: center;
  }
  &::after {
    border-color: ${({ error }) => (error ? "#ff0000" : "#1976d2")};
  }
  margin-bottom: 2px;
  width: 100%;
`

const TextError = styled("div")`
  font-size: 12px;
  color: #ff0000;
  min-height: 15px;
`

const BoxFilter = ({ nodeId }: { nodeId: string }) => {
  const dataFilterParamsSelector = useSelector(
    selectAlgorithmDataFilterParam(nodeId),
    shallowEqual,
  )
  const maxDim = 12 // TODO: WIP - get from api

  const { onOpenFilterDialog } = useContext(DialogContext)

  const dataFilterParams = useMemo(() => {
    if (!dataFilterParamsSelector) return undefined
    const { dim1, roi } = dataFilterParamsSelector
    return {
      dim1: dim1?.filter(Boolean),
      roi: roi?.filter(Boolean),
    }
  }, [dataFilterParamsSelector])

  const dispatch = useDispatch()

  const getData = useCallback(
    (value?: TDim[]) =>
      value
        ?.map((r) => {
          if (!isNaN(r.start!) && !isNaN(r.end!)) return `${r.start}:${r.end}`
          if (!isNaN(r.start!)) return r.start
          if (!isNaN(r.end!)) return r.end
          return ""
        })
        .toString(),
    [],
  )

  const { dim1, roi } = useMemo(() => {
    return {
      dim1: getData(dataFilterParams?.dim1),
      roi: getData(dataFilterParams?.roi),
    }
  }, [dataFilterParams, getData])

  const onChange = useCallback(
    (name: string, value?: string) => {
      const values = value?.split(",").map((v) => {
        if (!v) return ""
        const array = v.split(":")
        const dim: TDim = {}
        if (array[0]) dim.start = Number(array[0])
        if (array[1]) dim.end = Number(array[1])
        return dim
      })

      dispatch(
        updateFilterParams({
          nodeId,
          dataFilterParam: {
            ...dataFilterParams,
            [name]: values?.filter(Boolean),
          },
        }),
      )
    },
    [dataFilterParams, dispatch, nodeId],
  )

  return (
    <Box display="flex" justifyContent="flex-end">
      <Box display="flex" alignItems="center" flexDirection="column">
        <Box display="flex" gap={2} textAlign="center" pt={2} width={500}>
          <InputDim
            title="ROI"
            name="roi"
            placeholder="1:23,50:52"
            value={roi || ""}
            onChangeInput={(v) => onChange("roi", v)}
            multiple
          />
          <InputDim
            title="Time(Dim1)"
            name="dim1"
            placeholder={`0:${maxDim}`}
            value={dim1 || ""}
            onChangeInput={(v) => onChange("dim1", v)}
            max={maxDim}
          />
        </Box>
        <Box mt={2} display="flex" gap={1}>
          <Button variant="outlined" size="small" style={{ width: 120 }}>
            APPLY
          </Button>
          <Button
            color="error"
            variant="outlined"
            size="small"
            onClick={() => onOpenFilterDialog("")}
            style={{ width: 120 }}
          >
            CANCEL
          </Button>
          <Button variant="outlined" size="small" style={{ width: 120 }}>
            RESET
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default BoxFilter
