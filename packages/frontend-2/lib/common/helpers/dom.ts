export function scrollToBottom(el: HTMLElement) {
  el.scroll({
    top: el.scrollHeight
  })
}
