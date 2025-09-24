from sys import argv

from ifc_importer.process_job import process_job

if __name__ == "__main__":
    _, workdir_path, job_payload = argv
    _ = process_job(workdir_path, job_payload)
