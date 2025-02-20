# Linux

```{contents}
:depth: 4
```

## Installation

We introduce how to install optinist.
Please follow instructions below.

```{eval-rst}
.. note::
    We have tested OptiNiSt on Ubuntu 20.04/22.04.
```

## 1. Make Backend Environment

### Install Tools

#### Install gcc, g++

- For installing CaImAn, you need to install gcc and g++.

```bash
sudo apt install gcc g++
```

#### Install Conda Tool

- Install [Miniforge](https://github.com/conda-forge/miniforge)

```bash
# install (*latest version is fine)
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash Miniforge3-$(uname)-$(uname -m).sh

# initial setting (re-login required)
$HOME/miniforge3/bin/conda init
logout

# setting configs
conda config --set channel_priority flexible
```

### Create Conda Environment

```bash
conda create -n optinist python=3.8
conda activate optinist
```

### Install Library

```bash
pip install optinist
```

### Set Saving Directory

Optinist default saving directory is `/tmp/studio`. If you reboot your PC, this repository content is deleted. And setting the saving directory in environment path.

```bash
export OPTINIST_DIR="your_saving_dir"
```

## 2. Run Backend

```bash
run_optinist
```

- `run_optinist` log is as below:

```bash
$ run_optinist
INFO:     Will watch for changes in these directories: ['/home/oist/optinist']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxx] using statreload
INFO:     Started server process [xxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

- Launch browser, and go to `http://localhost:8000`

Done!
