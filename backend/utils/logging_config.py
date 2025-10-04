import logging
from typing import ClassVar
import sys

class CustomFormatter(logging.Formatter):

    grey: str = "\x1b[38;20m"
    yellow: str = "\x1b[33;20m"
    green: str = "\x1b[32;20m"
    blue: str = "\x1b[34;20m"
    red: str = "\x1b[31;20m"
    bold_red: str = "\x1b[31;1m"
    reset: str = "\x1b[0m"
    format: str = (
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s (%(filename)s:%(lineno)d)"  # type: ignore
    )

    FORMATS: ClassVar = {
        logging.DEBUG: grey + format + reset,
        logging.INFO: green + format + reset,
        logging.WARNING: yellow + format + reset,
        logging.ERROR: red + format + reset,
        logging.CRITICAL: bold_red + format + reset,
    }

    def format(self, record):  #ignore type
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt, datefmt="%Y-%m-%d %H:%M:%S")
        return formatter.format(record)


logging_handler = logging.StreamHandler(sys.stdout)
logging_handler.setFormatter(CustomFormatter())
logging.basicConfig(level=logging.INFO, handlers=[logging_handler])