import { ref, watch } from 'vue'
import Konva from 'konva'
import type { Shape, ViewerContainer } from '~/lib/paper'
import { useCRS } from './useCRS'
import { useCanvasStore } from '../../../stores/canvas'
import { getUniqueId } from '../../../utils/index'

export function useTextInput(
  paperId: string,
  canvasTransform: {
    x: number
    y: number
    scaleX: number
    scaleY: number
  },
  liveShape: Ref<Shape>,
  finishDrawing: () => void
) {
  const store = useCanvasStore()
  const viewerContainer = ref<ViewerContainer | undefined>()
  const caretPos = ref({ x: 0, y: 0 })
  const showCaret = ref(true)
  const dimensions = ref({ width: 0, height: 30 })
  let caretInterval: number | null = null

  const { getWorldCoords, getContainerAtPosition } = useCRS(canvasTransform)

  const measureText = (text: string, fontSize = 30, fontFamily = 'Arial') => {
    const temp = new Konva.Text({ text, fontSize, fontFamily, visible: false })
    return { width: temp.width(), height: temp.height() }
  }

  const getCaretPosition = (text: string, fontSize = 30, fontFamily = 'Arial') => {
    const lines = text.split('\n')
    const lastLine = lines[lines.length - 1]
    const temp = new Konva.Text({
      text: lastLine,
      fontSize,
      fontFamily,
      visible: false
    })
    return { x: temp.width(), y: (lines.length - 1) * fontSize }
  }

  watch(
    () => liveShape.value?.text,
    (text) => {
      if (liveShape.value?.type === 'text' && text != null) {
        dimensions.value = measureText(text, 30, 'Arial')
        caretPos.value = getCaretPosition(text, 30, 'Arial')
      }
    }
  )

  watch(
    () => liveShape.value?.type,
    (type) => {
      if (type === 'text') {
        caretInterval = window.setInterval(() => {
          showCaret.value = !showCaret.value
        }, 500)
      } else {
        if (caretInterval) {
          clearInterval(caretInterval)
          caretInterval = null
        }
        showCaret.value = true
      }
    }
  )

  const onKeyDown = (e: KeyboardEvent) => {
    if (liveShape.value?.type !== 'text') return
    if (e.key === 'Enter') {
      liveShape.value.text += '\n'
    } else if (e.key === 'Escape') {
      e.preventDefault()
      console.log('Escape key pressed')
      if (
        liveShape.value &&
        liveShape.value.text &&
        liveShape.value.text?.length !== 0
      ) {
        submitText()
      } else {
        finishDrawing()
      }
    } else if (
      (e.key === 'Delete' || e.key === 'Backspace') &&
      liveShape.value.text &&
      liveShape.value.text.length > 0
    ) {
      if (e.ctrlKey) {
        liveShape.value.text = liveShape.value.text?.replace(/\s*\S+\s*$/, '')
      } else {
        liveShape.value.text = liveShape.value.text?.slice(0, -1)
      }
    } else {
      const ignored = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab']
      if (!ignored.includes(e.key)) {
        if (!liveShape.value.text) liveShape.value.text = ''
        liveShape.value.text += e.key
      }
    }
  }

  const onMouseDown = (e: any) => {
    const pos = getWorldCoords(e)
    viewerContainer.value = getContainerAtPosition(e, paperId)
    const paper = store.getPaper(paperId)
    if (!pos || !paper) return

    if (liveShape.value && liveShape.value.text && liveShape.value.text?.length !== 0) {
      submitText()
      return
    }

    liveShape.value = {
      id: getUniqueId(),
      type: 'text',
      x: pos.x,
      y: pos.y,
      containerWidthOnCreate: viewerContainer.value
        ? viewerContainer.value.adaptiveContainer.width
        : undefined,
      containerHeightOnCreate: viewerContainer.value
        ? viewerContainer.value.adaptiveContainer.height
        : undefined,
      currentContainerWidth: viewerContainer.value
        ? viewerContainer.value.adaptiveContainer.width
        : undefined,
      currentContainerHeight: viewerContainer.value
        ? viewerContainer.value.adaptiveContainer.height
        : undefined,
      fillColor: store.currentStrokeColor,
      align: 'left'
    }
  }

  const submitText = () => {
    store.addShape(paperId, liveShape.value, viewerContainer.value?.id)
    dimensions.value = { width: 0, height: 30 }
    caretPos.value = { x: 0, y: 0 }
    viewerContainer.value = undefined
    finishDrawing()
  }

  // handle current tool change if text is active
  watch(
    () => store.currentTool,
    () => {
      if (store.currentTool !== 'text') {
        if (liveShape.value && liveShape.value.type === 'text') {
          submitText()
        }
      }
    }
  )

  return { caretPos, showCaret, dimensions, onKeyDown, onMouseDown }
}
