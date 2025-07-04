import path from 'node:path'
import url from 'node:url'
import file from 'node:fs'

export const isDevEnv = () => {
  return process.env.NODE_ENV === 'development'
}

export const isTestEnv = () => {
  return process.env.NODE_ENV === 'test'
}

export function isProdEnv() {
  return process.env.NODE_ENV === 'production'
}

export const isDevOrTestEnv = () => isDevEnv() || isTestEnv()

export const getPackageRootDirPath = () => {
  const __filename = url.fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  let root = path.resolve(__dirname, '../../../')
  if (root.endsWith('dist')) {
    // Resolved path may differ depending on whether running from dist or src (w/ ts-node)
    root = path.resolve(root, '../')
  }

  return root
}

let cachedIfcDllPath: string | undefined = undefined
export const getIfcDllPath = () => {
  if (cachedIfcDllPath) return cachedIfcDllPath

  const absolutePath = process.env['IFC_DOTNET_DLL_PATH']
  if (absolutePath && file.existsSync(absolutePath)) {
    cachedIfcDllPath = absolutePath
    return absolutePath
  }

  if (isDevOrTestEnv()) {
    const possiblePath = path.resolve(
      getPackageRootDirPath(),
      './src/ifc-dotnet/bin/Release/net8.0/ifc-converter.dll'
    )
    if (file.existsSync(possiblePath)) {
      cachedIfcDllPath = absolutePath
      return possiblePath
    }
  }

  const fallback =
    '/speckle-server/packages/fileimport-service/src/ifc-dotnet/ifc-converter.dll'
  if (file.existsSync(fallback)) {
    cachedIfcDllPath = fallback
    return fallback
  }

  throw new Error('Could not resolve .NET IFC DLL')
}
