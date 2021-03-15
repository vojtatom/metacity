import numpy as np



array = np.array([[1, 2, 3], [45, 56, 78]])

array[:, [0, 1]] = array[:, [1, 0]]

print(array)