import fs from 'fs'

export type UpdateHealthcheckData = () => void
export const updateHealthcheckDataFactory =
  (deps: { healthCheckFilePath: string }) => () =>
    fs.writeFile(deps.healthCheckFilePath, Date.now().toLocaleString(), () => {})
