rule:
    input:
        config["rules"]["dummy_image2scatter"]["input"]
    output:
        config["rules"]["dummy_image2scatter"]["output"]
    # run:
    #     __func_config = config["rules"]["dummy_image2scatter"]
    #     run_script(__func_config)
    script:
        "../../scripts/dummy/dummy_image2scatter.py"