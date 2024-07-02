import fs from 'fs'

export type UpdateHealthcheckData = () => void
export const updateHealthcheckDataFactory =
  (deps: { healthCheckFilePath: string }) => () =>
    //FIXME we should not deal with file system in this service
    fs.writeFile(deps.healthCheckFilePath, '' + Date.now(), () => {})
