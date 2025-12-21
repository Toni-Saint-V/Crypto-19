# Silence Starlette's pending deprecation warning about multipart import
import warnings

def pytest_configure(config):
    warnings.filterwarnings(
        "ignore",
        message=r"Please use `import python_multipart` instead\.",
        category=PendingDeprecationWarning,
    )
