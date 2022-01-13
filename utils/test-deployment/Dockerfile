FROM python:3.8-slim

COPY install_prerequisites.sh requirements.txt run_tests.py ./
RUN ./install_prerequisites.sh

CMD [ "./run_tests.py" ]