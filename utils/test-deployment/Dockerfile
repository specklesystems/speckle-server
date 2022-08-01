FROM python:3.8-slim

WORKDIR /speckle
COPY utils/test-deployment .
RUN pip install --no-cache-dir -r requirements.txt

CMD [ "/speckle/run_tests.py" ]
