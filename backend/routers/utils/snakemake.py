import os
import yaml
import sys
import copy
import inspect
import pickle
from snakemake import snakemake
from wrappers.data_wrapper import *
from wrappers import wrapper_dict
from .params import get_params
from .utils import nest2dict, check_types


def create_snakemake_files(BASE_DIR, OPTINIST_DIR, nodeDict, edgeList, endNodeList):
    '''
    flowListを受け取り、Snakemakeに渡すconfig.yamlとして出力する。
    '''

    flow_config = {}
    rules_to_execute = {}
    prev_algo_output = None

    # storage = PersistentDict("mystorage")
    # storage.clear()

    all_outputs = {}
    last_outputs = []

    for key, node in nodeDict.items():
        algo_label = node['data']['label']
        algo_path = node['data']['path']

        if node["type"] == 'ImageFileNode':
            filepath = os.path.join(OPTINIST_DIR, 'config', f'nwb.yaml')
            nwb_dict = copy.deepcopy(get_params(filepath))

            # if nwb_params != {}:
            #     nwb_dict = check_types(nest2dict(nwb_params), nwb_dict)
            for edge in edgeList:
                if edge["source"] == key:
                    arg_name = edge["targetHandle"].split("--")[1]
                    info = {arg_name: ImageData(algo_path, '')}
            nwb_dict['image_series']['external_file'] = info[arg_name].data
            # nwbfile = nwb_add_acquisition(nwb_dict)
            # nwbfile.create_processing_module(
            #     name='ophys',
            #     description='optical physiology processed data'
            # )
            # nwb_add_ophys(nwbfile)
            info['nwbfile'] = None #nwbfile
            # storage.store(algo_path, info)

            # output to pickle
            path = algo_path.split(".")[0] + ".pkl"
            with open(path, 'wb') as f:
                pickle.dump(info, f)
        
        elif node["type"] == "CsvFileNode":
            for edge in edgeList:
                if edge["source"] == key:
                    arg_name = edge["targetHandle"].split("--")[1]
                    info = {arg_name: TimeSeriesData(algo_path, '')}

            # info['nwbfile'] = None
            # with open(algo_path, 'wb') as f:
            #     pickle.dump(info, f)
            path = algo_path.split(".")[0] + ".pkl"
            with open(path, 'wb') as f:
                pickle.dump(info, f)

        elif node["type"] == "AlgorithmNode":

            algo_input = []
            args_type_dict = {}
            return_arg_names = {}
            for edge in edgeList:
                # inputとして入れる
                if edge["target"] == key:
                    arg_name = edge["targetHandle"].split("--")[1]
                    return_name = edge["sourceHandle"].split("--")[1]
                    sourceNode = nodeDict[edge["source"]]
                    if sourceNode["type"] == "AlgorithmNode":
                        algo_input.append(os.path.join(
                            BASE_DIR, sourceNode["data"]["path"], f"{sourceNode['data']['label']}_out.pkl"))
                    else:
                        return_name = arg_name
                        algo_input.append(sourceNode["data"]["path"])

                    return_arg_names[return_name] = arg_name

            # parameter
            params = get_algo_params(OPTINIST_DIR, algo_path, node)

            algo_output = os.path.join(BASE_DIR, algo_path, f"{algo_label}_out.pkl")

            rules_to_execute[algo_label] = {   
                "rule_file": f"rules/smk/{algo_path}.py",
                "input": algo_input,
                "return_arg": return_arg_names,
                "params": params,
                "output": algo_output,
                "path": algo_path,
            }

            if node["id"] in endNodeList:
                last_outputs.append(algo_output)

            all_outputs[algo_output] = {
                "label": algo_label,
                "path": algo_path,
            }

    flow_config["rules"] = rules_to_execute
    flow_config["last_output"] = last_outputs

    with open(os.path.join(OPTINIST_DIR, 'config.yaml'), "w") as f:
        yaml.dump(flow_config, f)

    # run snakemake
    snakemake(
        os.path.join(OPTINIST_DIR, 'Snakefile'),
        use_conda=True,
        cores=2,
        forceall=True,
        forcetargets=True,
        lock=False
    )
    # snakemake(os.path.join(OPTINIST_DIR, 'Snakefile'), cores=2, use_conda=True)

    print("finish snakemake run")

    # Send message to the client
    for key, value in all_outputs.items():
        import time
        time.sleep(5)
        with open(key, "rb") as f:
            data = pickle.load(f)
            all_outputs[key]['info'] = data

    return all_outputs


def get_algo_params(OPTINIST_DIR, algo_path, node):
    filepath = os.path.join(OPTINIST_DIR, 'config', f'{algo_path.split("/")[-1]}.yaml')
    default_params = copy.deepcopy(get_params(filepath))
    params = default_params
    if 'param' in node['data'].keys() and node['data']['param'] is not None:
        params = nest2dict(node['data']['param'])
        params = check_types(params, default_params)
    return params