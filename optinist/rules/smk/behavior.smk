from optinist.api.dir_path import DIRPATH
from optinist.api.snakemake.smk_dir import smk_input, smk_output

name="behavior"

rule:
    input:
        smk_input(config, name)
    output:
        smk_output(config, name)
    params:
        name=name
    script:
        f'{DIRPATH.ROOT_DIR}/rules/scripts/data.py'