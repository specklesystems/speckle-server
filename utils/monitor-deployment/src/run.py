#!/usr/bin/env python
import os

import psycopg2
from prometheus_client import start_http_server, Gauge
import time
import logging
LOG = logging.getLogger(__name__)
PG_CONNECTION_STRING = os.environ['PG_CONNECTION_STRING']

PROM = {
    'db_size': Gauge('speckle_db_size', 'Size of the entire database (in bytes)'),
    'objects': Gauge('speckle_db_objects', 'Number of objects'),
    'streams': Gauge('speckle_db_streams', 'Number of streams'),
    'commits': Gauge('speckle_db_commits', 'Number of commits'),
    'users': Gauge('speckle_db_users', 'Number of users'),
    'fileimports': Gauge('speckle_db_fileimports', 'Number of imported files, by type and status', labelnames=('filetype','status')),
    'webhooks': Gauge('speckle_db_webhooks', 'Number of webhook calls, by status', labelnames=('status',)),
    'previews': Gauge('speckle_db_previews', 'Number of previews, by status', labelnames=('status',)),
    'filesize': Gauge('speckle_db_filesize', 'Size of imported files, by type (in bytes)', labelnames=('filetype',)),
}


def tick(cur):
    # Total DB size
    cur.execute('SELECT pg_database_size(%s)', (cur.connection.info.dbname,))
    PROM['db_size'].set(cur.fetchone()[0])

    # Counts for users, streams, commits, objects
    cur.execute("SELECT count(*) FROM objects;")
    PROM['objects'].set(cur.fetchone()[0])
    cur.execute("SELECT count(*) FROM streams;")
    PROM['streams'].set(cur.fetchone()[0])
    cur.execute("SELECT count(*) FROM commits;")
    PROM['commits'].set(cur.fetchone()[0])
    cur.execute("SELECT count(*) FROM users;")
    PROM['users'].set(cur.fetchone()[0])

    # File Imports
    cur.execute(
        '''
        SELECT "fileType", "convertedStatus", count(*)
        FROM file_uploads
        GROUP BY ("fileType", "convertedStatus")
        '''
    )
    for row in cur:
        PROM['fileimports'].labels(row[0], str(row[1])).set(row[2])

    cur.execute(
        '''
        SELECT "fileType", SUM("fileSize")
        FROM file_uploads
        GROUP BY "fileType"
        '''
    )
    for row in cur:
        PROM['filesize'].labels(row[0]).set(row[1])

    # Webhooks
    cur.execute(
        '''
        SELECT status, count(*)
        FROM webhooks_events
        GROUP BY status
        '''
    )
    for row in cur:
        PROM['webhooks'].labels(str(row[0])).set(row[1])

    # Previews
    cur.execute(
        '''
        SELECT "previewStatus", count(*)
        FROM object_preview
        GROUP BY "previewStatus"
        '''
    )
    for row in cur:
        PROM['previews'].labels(str(row[0])).set(row[1])

def main():
    start_http_server(9092)

    while True:
        conn = None
        cur = None
        try:
            conn = psycopg2.connect(PG_CONNECTION_STRING)
            cur = conn.cursor()
            tick(cur)
        except Exception as ex:
            LOG.error("Error: %s", str(ex))
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()

        time.sleep(60)


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    main()
