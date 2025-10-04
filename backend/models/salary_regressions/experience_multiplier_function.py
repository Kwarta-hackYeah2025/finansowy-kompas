import numpy as np


def experience_multiplier_function(experience, alpha, beta, x0=0.0):
    x = np.maximum(0.0, np.array(experience) - x0)
    return 1 + alpha * (1 - np.exp(-beta * x))
