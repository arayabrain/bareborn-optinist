import os
import shutil

from studio.app.common.core.logger import AppLogger
from studio.app.common.core.storage.remote_storage_controller import (
    BaseRemoteStorageController,
    RemoteSyncAction,
    RemoteSyncStatusFileUtil,
)
from studio.app.common.core.utils.filepath_creater import (
    create_directory,
    join_filepath,
)
from studio.app.dir_path import DIRPATH

logger = AppLogger.get_logger()


class MockStorageController(BaseRemoteStorageController):
    """
    Mock Storage Controller (uses of development)
    """

    MOCK_STORAGE_DIR = (
        os.environ.get("MOCK_STORAGE_DIR")
        if "MOCK_STORAGE_DIR" in os.environ
        else "/tmp/studio/mock-storage"
    )
    MOCK_INPUT_DIR = f"{MOCK_STORAGE_DIR}/input"
    MOCK_OUTPUT_DIR = f"{MOCK_STORAGE_DIR}/output"

    def __init__(self):
        # initialization: create directories
        create_directory(__class__.MOCK_INPUT_DIR)
        create_directory(__class__.MOCK_OUTPUT_DIR)

    def make_experiment_local_path(self, workspace_id: str, unique_id: str) -> str:
        experiment_local_path = join_filepath(
            [DIRPATH.OUTPUT_DIR, workspace_id, unique_id]
        )
        return experiment_local_path

    def make_experiment_remote_path(self, workspace_id: str, unique_id: str) -> str:
        experiment_remote_path = join_filepath(
            [__class__.MOCK_OUTPUT_DIR, workspace_id, unique_id]
        )
        return experiment_remote_path

    def download_experiment_metas(self, workspace_id: str, unique_id: str) -> bool:
        # TODO: Implementation is required
        pass

    def download_experiment(self, workspace_id: str, unique_id: str) -> bool:
        # make paths
        experiment_local_path = self.make_experiment_local_path(workspace_id, unique_id)
        experiment_remote_path = self.make_experiment_remote_path(
            workspace_id, unique_id
        )

        if not os.path.isdir(experiment_remote_path):
            logger.warn("remote path is not exists. [%s]", experiment_remote_path)
            return False

        logger.debug(
            "download data from remote storage (mock). [%s -> %s]",
            experiment_remote_path,
            experiment_local_path,
        )

        # ----------------------------------------
        # exec downloading
        # ----------------------------------------

        # clear remote-sync-status file.
        RemoteSyncStatusFileUtil.delete_sync_status_file(workspace_id, unique_id)

        # cleaning data from local path
        if os.path.isdir(experiment_local_path):
            shutil.rmtree(experiment_local_path)

        # do copy data from remote storage
        shutil.copytree(
            experiment_remote_path, experiment_local_path, dirs_exist_ok=True
        )

        # creating remote-sync-status file.
        RemoteSyncStatusFileUtil.create_sync_status_file(
            workspace_id, unique_id, RemoteSyncAction.DOWNLOAD
        )

        return True

    def upload_experiment(self, workspace_id: str, unique_id: str) -> bool:
        # make paths
        experiment_local_path = self.make_experiment_local_path(workspace_id, unique_id)
        experiment_remote_path = self.make_experiment_remote_path(
            workspace_id, unique_id
        )

        create_directory(experiment_remote_path, delete_dir=True)

        logger.debug(
            "upload data to remote storage (mock). [%s -> %s]",
            experiment_local_path,
            experiment_remote_path,
        )

        # ----------------------------------------
        # exec uploading
        # ----------------------------------------

        # clear remote-sync-status file.
        RemoteSyncStatusFileUtil.delete_sync_status_file(workspace_id, unique_id)

        # do copy data to remote storage
        shutil.copytree(
            experiment_local_path, experiment_remote_path, dirs_exist_ok=True
        )

        # creating remote-sync-status file.
        RemoteSyncStatusFileUtil.create_sync_status_file(
            workspace_id, unique_id, RemoteSyncAction.UPLOAD
        )

        return True

    def delete_experiment(self, workspace_id: str, unique_id: str) -> bool:
        # make paths
        experiment_remote_path = self.make_experiment_remote_path(
            workspace_id, unique_id
        )

        logger.debug(
            "delete data from remote storage (mock). [%s]",
            experiment_remote_path,
        )

        # ----------------------------------------
        # exec deleting
        # ----------------------------------------

        # do delete data from remote storage
        if os.path.isdir(experiment_remote_path):
            shutil.rmtree(experiment_remote_path)

        return True