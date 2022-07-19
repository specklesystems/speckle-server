export function getCurrentQueryParams() {
  return new URL(window.location.href).searchParams
}
