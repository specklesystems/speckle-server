import asyncio


async def run(cmd):
    proc = await asyncio.create_subprocess_shell(
        cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )

    # stdout, stderr = await proc.communicate()
    #
    print(proc.pid)
    if not proc.stdout:
        return
    async for line in proc.stdout:
        print(line.decode("ascii").rstrip())

    data = await proc.stdout.readline()
    line = data.decode("ascii").rstrip()

    # print(f'[{cmd!r} exited with {proc.returncode}]')
    # if stdout:
    #     print(f'[stdout]\n{stdout.decode()}')
    # if stderr:
    #     print(f'[stderr]\n{stderr.decode()}')


async def main(cmd: str):
    try:
        print("foo")
        await asyncio.wait_for(run(cmd), timeout=5)
    except TimeoutError as te:
        print(te)
        raise


asyncio.run(main('while sleep 1; do echo "Hi"; done'))
