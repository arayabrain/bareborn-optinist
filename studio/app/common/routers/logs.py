from fastapi import APIRouter, Query

from studio.app.common.core.utils.file_reader import LogReader

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get(
    "",
    summary="Fetch log data with pagination",
)
async def get_log_data(
    offset: int = Query(
        default=-1,
        ge=-1,
        description="The starting position in the log file from which to fetch data."
        "A value of `-1` indicates the request should start from the end of the file",
    ),
    line_limit: int = Query(
        default=50,
        gt=0,
        description="Max number of log lines to return.",
    ),
    reverse: bool = Query(
        default=True,
        description="Fetch logs in reverse order.",
    ),
):
    return LogReader.read_lines(
        offset=offset,
        line_limit=line_limit,
        reverse=reverse,
    )
