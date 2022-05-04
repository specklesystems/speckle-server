FROM python:3.8-slim

RUN pip install psycopg2-binary prometheus-client

COPY utils/monitor-deployment/src /app
WORKDIR /app

CMD ["python", "-u", "run.py"]
