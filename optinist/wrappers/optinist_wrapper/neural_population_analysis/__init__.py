from .correlation import correlation
from .cross_correlation import cross_correlation
from .granger import Granger


neural_population_analysis_wrapper_dict = {
    'correlation': {
        'function': correlation
    },
    'cross_correlation': {
        'function': cross_correlation
    },
    'granger': {
        'function': Granger
    },
}