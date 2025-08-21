import asyncio
import logging
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

import structlog
from structlog_to_seq import CelfProcessor

from ifc_importer.job_processor import job_processor


def configure_logger() -> structlog.stdlib.BoundLogger:
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=logging.DEBUG)

    structlog.configure(
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        processors=[
            # Prevent exception formatting if logging is not configured
            # Add file, line, function information of where log occurred
            # Add a timestamp to log message
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.stdlib.add_log_level,
            CelfProcessor(),
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer(),
        ],
    )
    logger = structlog.stdlib.get_logger()
    return logger


class HealthcheckHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        match self.path:
            case "/healthz":
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"status": "OK"}')
            case _:
                self.send_response(404)
                self.end_headers()


async def main():
    logger = configure_logger()
    task = asyncio.create_task(job_processor(logger))
    httpd = HTTPServer(("0.0.0.0", 9080), HealthcheckHTTPRequestHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()

    # we do not need any sort of signal handling logic,
    # cause if the context of the job transaction exits,
    # the job gets back into a queue-d state
    try:
        await task
    except Exception as ex:
        logger.error(
            "Execution failed with exception: {message}", message=str(ex), exc_info=ex
        )
        raise


if __name__ == "__main__":
    asyncio.run(main())
