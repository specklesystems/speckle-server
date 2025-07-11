import asyncio

from ifc_importer.job_processor import job_processor


async def main():
    task = asyncio.create_task(job_processor())

    # we do not need any sort of signal handling logic,
    # cause if the context of the job transaction exits,
    # the job gets back into a queue-d state
    try:
        await task
    except Exception as ex:
        print(f"Execution failed with exception {ex}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
