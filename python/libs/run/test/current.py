import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
logger.addHandler(console_handler)

logger.info("hello from logger")  # This should now appear in the console
print("hello from print")