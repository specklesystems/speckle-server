FROM python:3.8-slim

COPY utils/test-deployment .
RUN ./install_prerequisites.sh

CMD [ "./run_tests.py" ]