# flake8: noqa
# Exclude from lint for the following reason
# This file is executed by snakemake and cause the following lint errors
# - E402: sys.path.append is required to import optinist modules
# - F821: do not import snakemake
import sys
from os.path import abspath, dirname

ROOT_DIRPATH = dirname(dirname(dirname(dirname(dirname(dirname(abspath(__file__)))))))
sys.path.append(ROOT_DIRPATH)

from studio.app.common.core.rules.file_writer import FileWriter
from studio.app.common.core.snakemake.snakemake_reader import RuleConfigReader
from studio.app.common.core.utils.pickle_handler import PickleWriter
from studio.app.const import FILETYPE

if __name__ == "__main__":
    last_output = snakemake.config["last_output"]

    rule_config = RuleConfigReader.read(snakemake.params.name)
    if rule_config.type in [FILETYPE.IMAGE]:
        rule_config.input = snakemake.input
    elif rule_config.type in [FILETYPE.CSV, FILETYPE.BEHAVIOR, FILETYPE.HDF5]:
        rule_config.input = snakemake.input[0]

    rule_config.output = snakemake.output[0]

    if rule_config.type in [FILETYPE.CSV, FILETYPE.BEHAVIOR]:
        outputfile = FileWriter.csv(rule_config, rule_config.type)
        PickleWriter.write(rule_config.output, outputfile)
    elif rule_config.type == FILETYPE.IMAGE:
        outputfile = FileWriter.image(rule_config)
        PickleWriter.write(rule_config.output, outputfile)
    elif rule_config.type == FILETYPE.HDF5:
        outputfile = FileWriter.hdf5(rule_config)
        PickleWriter.write(rule_config.output, outputfile)