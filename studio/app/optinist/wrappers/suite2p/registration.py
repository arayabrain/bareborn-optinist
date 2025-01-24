from studio.app.common.core.experiment.experiment import ExptOutputPathIds
from studio.app.common.core.logger import AppLogger
from studio.app.common.dataclass import ImageData
from studio.app.optinist.dataclass import Suite2pData

logger = AppLogger.get_logger()


def suite2p_registration(
    ops: Suite2pData, output_dir: str, params: dict = None, **kwargs
) -> dict(ops=Suite2pData, mc_images=ImageData):
    from suite2p import default_ops, io
    from suite2p.registration import (
        registration_wrapper,
        save_registration_outputs_to_ops,
    )
    from suite2p.registration.register import enhanced_mean_image

    function_id = ExptOutputPathIds(output_dir).function_id
    logger.info("start suite2p registration: %s", function_id)

    # Unpack and prepare parameters
    ops_dict = ops.data.copy()
    ops_dict = {**default_ops(), **ops_dict, **(params or {})}

    # Validate required parameters
    required_keys = ["Ly", "Lx", "nframes", "reg_file", "fs", "batch_size"]
    for key in required_keys:
        if key not in ops_dict:
            raise ValueError(f"Missing required parameter: {key}")

    # Initialize binary file handler
    binary_data = io.BinaryFile(
        filename=ops_dict["reg_file"],
        Ly=ops_dict["Ly"],
        Lx=ops_dict["Lx"],
        n_frames=ops_dict["nframes"],
    )

    # Run registration - let registration_wrapper compute reference image
    registration_outputs = registration_wrapper(
        f_reg=binary_data,
        ops=ops_dict,
        refImg=None,  # Critical change: automatic reference computation
    )

    # Save registration outputs to ops dictionary
    ops_dict = save_registration_outputs_to_ops(registration_outputs, ops_dict)

    # Generate enhanced mean image (required for meanImgE output)
    ops_dict = enhanced_mean_image(ops_dict)

    # Compute registration metrics if enabled
    if ops_dict.get("do_regmetrics", True) and ops_dict["nframes"] >= 1500:
        from suite2p.registration.metrics import get_pc_metrics

        ops_dict = get_pc_metrics(ops_dict)

    # Prepare output with corrected meanImgE
    info = {
        "refImg": ImageData(
            ops_dict["refImg"], output_dir=output_dir, file_name="refImg"
        ),
        "meanImgE": ImageData(
            ops_dict["meanImgE"], output_dir=output_dir, file_name="meanImgE"
        ),
        "mc_images": ImageData(
            binary_data.data, output_dir=output_dir, file_name="mc_images"
        ),
        "ops": Suite2pData(ops_dict, file_name="ops"),
    }

    return info
