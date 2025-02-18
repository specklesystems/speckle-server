export function useDesktopService() {
  const pingDesktopService = async () => {
    try {
      const response = await fetch('http://localhost:29364/ping', { method: 'GET' })
      if (response.ok) {
        return true
      }
      return false
    } catch (error) {
      console.warn('Failed to reach background service:', error)
      return false
    }
  }

  return { pingDesktopService }
}
