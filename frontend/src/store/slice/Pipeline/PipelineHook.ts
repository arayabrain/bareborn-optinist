import {
  useCallback,
  useEffect,
  useState,
  createElement,
  MouseEvent,
} from "react"
import { useDispatch, useSelector } from "react-redux"
import { useLocation, useNavigate, useParams } from "react-router-dom"

import { OptionsObject, SnackbarKey, useSnackbar, VariantType } from "notistack"

import { isRejected } from "@reduxjs/toolkit"

import { STANDALONE_WORKSPACE_ID } from "const/Mode"
import { selectAlgorithmNodeNotExist } from "store/slice/AlgorithmNode/AlgorithmNodeSelectors"
import { getExperiments } from "store/slice/Experiments/ExperimentsActions"
import { clearExperiments } from "store/slice/Experiments/ExperimentsSlice"
import { selectFilePathIsUndefined } from "store/slice/InputNode/InputNodeSelectors"
import {
  run,
  pollRunResult,
  runByCurrentUid,
  cancelResult,
} from "store/slice/Pipeline/PipelineActions"
import {
  selectPipelineIsCanceled,
  selectPipelineIsStartedSuccess,
  selectPipelineLatestUid,
  selectPipelineStatus,
} from "store/slice/Pipeline/PipelineSelectors"
import { RUN_STATUS } from "store/slice/Pipeline/PipelineType"
import { selectRunPostData } from "store/slice/Run/RunSelectors"
import { selectModeStandalone } from "store/slice/Standalone/StandaloneSeclector"
import { fetchWorkflow } from "store/slice/Workflow/WorkflowActions"
import { getWorkspace } from "store/slice/Workspace/WorkspaceActions"
import { selectIsWorkspaceOwner } from "store/slice/Workspace/WorkspaceSelector"
import {
  clearCurrentWorkspace,
  setActiveTab,
  setCurrentWorkspace,
} from "store/slice/Workspace/WorkspaceSlice"
import { AppDispatch } from "store/store"

const POLLING_INTERVAL = 5000

export type UseRunPipelineReturnType = ReturnType<typeof useRunPipeline>

export function useRunPipeline() {
  const dispatch = useDispatch<AppDispatch>()
  const appDispatch: AppDispatch = useDispatch()
  const isStandalone = useSelector(selectModeStandalone)
  const navigate = useNavigate()
  const location = useLocation()

  const { workspaceId } = useParams<{ workspaceId: string }>()
  const _workspaceId = Number(workspaceId)

  useEffect(() => {
    if (isStandalone) {
      dispatch(setCurrentWorkspace(STANDALONE_WORKSPACE_ID))
      dispatch(fetchWorkflow(STANDALONE_WORKSPACE_ID))
    } else {
      appDispatch(getWorkspace({ id: _workspaceId }))
        .unwrap()
        .then((_) => {
          dispatch(fetchWorkflow(_workspaceId))
          const selectedTab = location.state?.tab
          selectedTab && dispatch(setActiveTab(selectedTab))
        })
        .catch((_) => {
          navigate("/console/workspaces")
        })
    }
    return () => {
      dispatch(clearExperiments())
      dispatch(clearCurrentWorkspace())
    }
  }, [
    dispatch,
    appDispatch,
    navigate,
    _workspaceId,
    location.state,
    isStandalone,
  ])

  const uid = useSelector(selectPipelineLatestUid)
  const isCanceled = useSelector(selectPipelineIsCanceled)
  const isStartedSuccess = useSelector(selectPipelineIsStartedSuccess)
  const isOwner = useSelector(selectIsWorkspaceOwner)
  const runDisabled = isOwner ? isStartedSuccess : true

  const filePathIsUndefined = useSelector(selectFilePathIsUndefined)
  const algorithmNodeNotExist = useSelector(selectAlgorithmNodeNotExist)
  const runPostData = useSelector(selectRunPostData)
  const { enqueueSnackbar } = useSnackbar()

  const handleRunPipeline = useCallback(
    (name: string) => {
      dispatch(run({ runPostData: { name, ...runPostData, forceRunList: [] } }))
        .unwrap()
        .catch((error) => {
          // Catch workflow yaml parameter errors
          if (error?.response?.status === 422) {
            const snackbarOptions: OptionsObject = {
              variant: "warning",
              autoHideDuration: 30000,
              action: function (_key: SnackbarKey) {
                return createElement(
                  "span",
                  {
                    role: "button",
                    onMouseDown: (e: MouseEvent<HTMLSpanElement>) => {
                      e.stopPropagation()
                      window.open(
                        "https://github.com/oist/optinist/wiki/FAQ",
                        "_blank",
                      )
                    },
                    className: "text-inherit underline cursor-pointer",
                  },
                  "Click here",
                )
              },
            }
            enqueueSnackbar("Workflow yaml error, see FAQ\n", snackbarOptions)
          } else {
            enqueueSnackbar("Failed to Run workflow", { variant: "error" })
          }
        })
    },
    [dispatch, enqueueSnackbar, runPostData],
  )

  const handleClickVariant = (variant: VariantType, mess: string) => {
    enqueueSnackbar(mess, { variant })
  }
  const handleRunPipelineByUid = useCallback(() => {
    dispatch(runByCurrentUid({ runPostData }))
      .unwrap()
      .catch((error) => {
        // Catch workflow yaml parameter errors
        if (error?.response?.status === 422) {
          const snackbarOptions: OptionsObject = {
            variant: "warning",
            autoHideDuration: 30000,
            action: function (_key: SnackbarKey) {
              return createElement(
                "span",
                {
                  role: "button",
                  onMouseDown: (e: MouseEvent<HTMLSpanElement>) => {
                    e.stopPropagation()
                    window.open(
                      "https://github.com/oist/optinist/wiki/FAQ",
                      "_blank",
                    )
                  },
                  className: "text-inherit underline cursor-pointer",
                },
                "Click here",
              )
            },
          }
          enqueueSnackbar("Workflow yaml error, see FAQ\n", snackbarOptions)
        } else {
          enqueueSnackbar("Failed to Run workflow", { variant: "error" })
        }
      })
  }, [dispatch, enqueueSnackbar, runPostData])

  const handleCancelPipeline = useCallback(async () => {
    if (uid != null) {
      const data = await dispatch(cancelResult({ uid }))
      if (isRejected(data)) {
        handleClickVariant(
          "error",
          "Failed to cancel workflow. Please try again.",
        )
      }
    }
    //eslint-disable-next-line
  }, [dispatch, uid])
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isStartedSuccess && !isCanceled && uid != null) {
        dispatch(pollRunResult({ uid: uid }))
      }
    }, POLLING_INTERVAL)
    return () => {
      clearInterval(intervalId)
    }
  }, [dispatch, uid, isCanceled, isStartedSuccess])
  const status = useSelector(selectPipelineStatus)
  // タブ移動による再レンダリングするたびにスナックバーが実行されてしまう挙動を回避するために前回の値を保持
  const [prevStatus, setPrevStatus] = useState(status)
  useEffect(() => {
    if (prevStatus !== status) {
      if (status === RUN_STATUS.FINISHED) {
        enqueueSnackbar("Finished", { variant: "success" })
        dispatch(getExperiments())
      } else if (status === RUN_STATUS.START_SUCCESS) {
        dispatch(getExperiments())
      } else if (status === RUN_STATUS.ABORTED) {
        enqueueSnackbar("Aborted", { variant: "error" })
        dispatch(getExperiments())
      } else if (status === RUN_STATUS.CANCELED) {
        enqueueSnackbar("Workflow canceled.", { variant: "success" })
        dispatch(getExperiments())
      }
      setPrevStatus(status)
    }
  }, [dispatch, status, prevStatus, enqueueSnackbar])
  return {
    filePathIsUndefined,
    algorithmNodeNotExist,
    uid,
    status,
    runDisabled,
    handleRunPipeline,
    handleRunPipelineByUid,
    handleCancelPipeline,
  }
}
