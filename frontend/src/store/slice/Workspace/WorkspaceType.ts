import { UserDTO } from "api/users/UsersApiDTO"
import { StatusROI } from "components/Workspace/Visualize/Plot/ImagePlot"

export const WORKSPACE_SLICE_NAME = "workspace"

export type ItemsWorkspace = {
  id: number
  name: string
  user: {
    id: number
    name: string
    email: string
    created_at: string
    updated_at: string
  }
  created_at: string
  updated_at: string
}

export type WorkspaceDataDTO = {
  items: ItemsWorkspace[]
  total: number
  limit: number
  offset: number
}

export type Workspace = {
  workspace: WorkspaceDataDTO
  currentWorkspace: {
    statusRoi?: StatusROI
    roiFilePath?: string
    workspaceId?: number
    workspaceName?: string
    selectedTab: number
    ownerId?: number
  }
  loading: boolean
  listUserShare?: ListUserShareWorkspaceDTO
}

export type ListUserShareWorkSpace = {
  id: number
  name: string
  email: string
  created_at: string
  updated_at: string
}

export type ListUserShareWorkspaceDTO = {
  users: UserDTO[]
}

export type WorkspaceParams = {
  [key: string]: string | undefined | number | string[] | object
}
