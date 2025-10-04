from utils import use_cwd


def create_dict_from_csv(file_name):
    import csv

    with open(file_name, "r") as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=",")
        next(csv_reader)
        return {rows[0]: (rows[1], rows[2]) for rows in csv_reader}


if __name__ == "__main__":
    with open("regression_dict.py", "w") as f:
        f.write(f'regression_dict = {create_dict_from_csv(use_cwd('data/regression_results.csv'))}\n')
