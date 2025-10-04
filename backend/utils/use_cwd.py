import logging
from os import path
import inspect

logger = logging.getLogger(__name__)


def use_cwd(filename: str) -> str:
    """Get the path to the caller's current working directory."""
    if not filename:
        raise ValueError("Filename is required.")
    try:
        caller_frame = inspect.stack()[1]
        caller_path = path.dirname(path.abspath(caller_frame.filename))
        return path.join(caller_path, filename)
    except Exception as e:
        logger.error(f"Error getting caller path: {e}")
        raise ValueError(
            "Failed to get caller path. Make sure you're calling this function from a script."
        )
