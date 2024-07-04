#!/usr/bin/env python
import os
import sys

import psycopg2
from prometheus_client import start_http_server, Gauge
import time
import structlog
from logging import INFO, basicConfig

basicConfig(format="%(message)s", stream=sys.stdout, level=INFO)

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.UnicodeDecoder(),
        structlog.processors.CallsiteParameterAdder(
            {
                structlog.processors.CallsiteParameter.FILENAME,
                structlog.processors.CallsiteParameter.FUNC_NAME,
                structlog.processors.CallsiteParameter.LINENO,
            }
        ),
        structlog.processors.EventRenamer("msg"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(INFO),
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)
LOG = structlog.get_logger()
PG_CONNECTION_STRING = os.environ["PG_CONNECTION_STRING"]

PROM = {
    "db_size": Gauge("speckle_db_size", "Size of the entire database (in bytes)"),
    "objects": Gauge("speckle_db_objects", "Number of objects"),
    "streams": Gauge("speckle_db_streams", "Number of streams"),
    "commits": Gauge("speckle_db_commits", "Number of commits"),
    "users": Gauge("speckle_db_users", "Number of users"),
    "fileimports": Gauge(
        "speckle_db_fileimports",
        "Number of imported files, by type and status",
        labelnames=("filetype", "status"),
    ),
    "webhooks": Gauge(
        "speckle_db_webhooks",
        "Number of webhook calls, by status",
        labelnames=("status",),
    ),
    "previews": Gauge(
        "speckle_db_previews", "Number of previews, by status", labelnames=("status",)
    ),
    "filesize": Gauge(
        "speckle_db_filesize",
        "Size of imported files, by type (in bytes)",
        labelnames=("filetype",),
    ),
    "tablesize": Gauge(
        "speckle_db_tablesize",
        "Size of tables in the database, by table (in bytes)",
        labelnames=("table",),
    ),
}


def tick(cur):
    # Total DB size
    cur.execute("SELECT pg_database_size(%s)", (cur.connection.info.dbname,))
    PROM["db_size"].set(cur.fetchone()[0])

    # Counts for users, streams, commits, objects
    cur.execute("SELECT reltuples AS estimate FROM pg_class WHERE relname = 'objects';")
    PROM["objects"].set(cur.fetchone()[0])
    cur.execute("SELECT reltuples AS estimate FROM pg_class WHERE relname = 'streams';")
    PROM["streams"].set(cur.fetchone()[0])
    cur.execute("SELECT reltuples AS estimate FROM pg_class WHERE relname = 'commits';")
    PROM["commits"].set(cur.fetchone()[0])
    cur.execute("SELECT reltuples AS estimate FROM pg_class WHERE relname = 'users';")
    PROM["users"].set(cur.fetchone()[0])

    # File Imports
    cur.execute(
        """
        SELECT LOWER("fileType"), "convertedStatus", count(*)
          FROM file_uploads
          GROUP BY (LOWER("fileType"), "convertedStatus");
        """
    )
    # put in a dictionary so we fill non-existing statuses with zeroes
    # (query can return PENDING files, then the next query will not return any PENDING rows. -> need to reset the metric to 0)
    used_labels = {}
    for row in cur:
        if row[0] not in used_labels:
            used_labels[row[0]] = {}
        used_labels[row[0]][str(row[1])] = row[2]
    for file_type in used_labels:
        for status in range(4):
            if str(status) in used_labels[file_type]:
                PROM["fileimports"].labels(file_type, str(status)).set(
                    used_labels[file_type][str(status)]
                )
            else:
                PROM["fileimports"].labels(file_type, str(status)).set(0)

    cur.execute(
        """
        SELECT LOWER("fileType") AS fileType, SUM("fileSize") AS fileSize
            FROM file_uploads
            GROUP BY LOWER("fileType");
        """
    )
    for row in cur:
        PROM["filesize"].labels(row[0]).set(row[1])

    # Webhooks
    cur.execute(
        """
        SELECT status, count(*)
        FROM webhooks_events
        GROUP BY status
        """
    )
    values = {}
    for row in cur:
        values[str(row[0])] = row[1]
    for status in range(4):
        if str(status) in values:
            PROM["webhooks"].labels(str(status)).set(values[str(status)])
        else:
            PROM["webhooks"].labels(str(status)).set(0)

    # Previews
    cur.execute(
        """
        SELECT "previewStatus", count(*)
        FROM object_preview
        GROUP BY "previewStatus"
        """
    )
    values = {}
    for row in cur:
        values[str(row[0])] = row[1]
    for status in range(4):
        if str(status) in values:
            PROM["previews"].labels(str(status)).set(values[str(status)])
        else:
            PROM["previews"].labels(str(status)).set(0)

    # Table sizes
    cur.execute(
        """
      SELECT
        relname,
        table_size

      FROM (
            SELECT
              pg_catalog.pg_namespace.nspname           AS schema_name,
              relname,
              pg_relation_size(pg_catalog.pg_class.oid) AS table_size

            FROM pg_catalog.pg_class
              JOIN pg_catalog.pg_namespace ON relnamespace = pg_catalog.pg_namespace.oid
          ) t
      WHERE schema_name = 'public'
      ORDER BY table_size DESC;
      """
    )
    values = {}
    for row in cur:
        PROM["tablesize"].labels(row[0]).set(row[1])


def main():
    start_http_server(9092)

    while True:
        conn = None
        cur = None
        try:
            t0 = time.time()
            conn = psycopg2.connect(
                PG_CONNECTION_STRING,
                application_name="speckle_monitor_deployment",
            )
            cur = conn.cursor()
            t1 = time.time()
            tick(cur)
            t2 = time.time()
            LOG.info(
                "Updated metrics.", connection_period=(t1 - t0), query_period=(t2 - t1)
            )
        except Exception as ex:
            LOG.exception(ex)
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()

        time.sleep(120)


if __name__ == "__main__":
    main()
