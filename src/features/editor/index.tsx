import EditAsideTab from '@/features/editor/components/aside/EditAsideTab.tsx'
import ToolbarWrapper from '@/features/editor/components/toolbar/ToolbarWrapper.tsx'

import { useCanvasStore, useEditStore } from '@/features/editor/store'
import { useRef, useEffect } from 'react'
import { Canvas, SVGCanvas } from '@/features/editor/const'
import SVGCANVAS from '@/features/editor/svgcanvas/svgcanvas'
import TopMenu from '@/features/editor/components/top-menu/TopMenu.tsx'

const Editor = () => {
  const { setCanvas, getDimensions, setZoom, getCanvas, deleteSVG, copySVG } = useCanvasStore()
  const { setElem, isTemplateSelected } = useEditStore()
  const { clientWidth, clientHeight } = getDimensions()
  const container = useRef(null)
  const config = {
    initFill: { color: 'FFFFFF', opacity: 1 },
    initStroke: { color: '000000', opacity: 1, width: 1 },
    text: { stroke_width: 0, font_size: 24, font_family: 'GmarketSansTTFBold' },
    initOpacity: 1,
    baseUnit: 'px',
    show_outside_canvas: true,
    gridSnapping: false,
    gridColor: '#fff',
    snappingStep: 1,
    dimensions: [1, 1],
  }
  let cnvs: Canvas | undefined

  const redoAndLastHistoryRemove = (elem: Element) => {
    const canvas = getCanvas()
    if (canvas) {
      const { undoMgr } = canvas
      let flag = true
      while (flag) {
        if (undoMgr.getUndoStackSize() > 0) {
          const cmd = undoMgr.lastHistory()
          let isText = false
          if (typeof cmd.newValues == 'object') {
            Object.entries(cmd.newValues).forEach(([aname]) => {
              if (aname == '#text') {
                isText = true
              }
            })
          }

          if (isText) {
            if (cmd.newValues['#text'].trim() == '') {
              undoMgr.undo()
              if (elem) {
                canvas.addToSelection([elem], true)
                //this.$emit('selectedchange', elem)
              } else {
                canvas.clearSelection()
              }
              undoMgr.lastHistoryRemove()
            } else if (cmd.newValues['#text'] == cmd.oldValues['#text']) {
              undoMgr.undo()
              if (elem) {
                canvas.addToSelection([elem], true)
                //this.$emit('selectedchange', elem)
              } else {
                canvas.clearSelection()
              }
              undoMgr.lastHistoryRemove()
            } else {
              //마지막 히스토리에 텍스트 수정이 공백이 아님
              flag = false
            }
          } else {
            //마지막 히스토리가 텍스트수정이 아님
            flag = false
          }
        } else {
          //히스토리 존재하지 않음
          flag = false
        }
      }
    }
  }
  const canvasElemClickFunc = () => {
    const canvas = getCanvas()
    if (canvas) {
      const selectList = canvas.getSelectedElements()
      if (selectList.length > 0) {
        const selected = selectList[0]
        setElem(selected as Element)
      } else {
        //공백입력후 다른 오브젝트 선택시 이벤트 체크
        const justSelected = canvas.getJustSelected()
        if (justSelected && justSelected.nodeName == 'text') {
          redoAndLastHistoryRemove(justSelected)
        }
        setElem(justSelected)
      }
    }
  }

  useEffect(() => {
    if (container.current && !cnvs) {
      cnvs = new SVGCANVAS(container.current, config, false)

      const canvas = cnvs as SVGCanvas
      canvas.setMobileBtnFunc(canvasElemClickFunc)
      canvas.setDeleteSVG(deleteSVG)
      canvas.setCloneSVG(copySVG)
      setZoom(40)
      setCanvas(canvas)
    }
  }, [])

  return (
    <main className={'grid flex-1 gap-4 overflow-auto px-3 pt-3 md:grid-cols-2 lg:grid-cols-3'}>
      <EditAsideTab />
      <div className={'md:col-span-1 lg:col-span-2'}>
        <TopMenu />
        <div
          className={'flex h-[93%] justify-center items-center'}
          style={{ display: isTemplateSelected ? 'none' : '' }}
        >
          <div>편집할 템플릿을 선택해 주세요</div>
        </div>
        <div
          className={'relative flex flex-col mt-2.5 bg-gray-100 rounded-xl lg:col-span-2'}
          style={!isTemplateSelected ? { height: '1px', overflow: 'hidden', padding: 0, margin: 0 } : {}}
        >
          <ToolbarWrapper />
          <div id={'workarea'} style={{ width: clientWidth, height: clientHeight }}>
            <div
              id={'simpleBar'}
              className={'rounded-xl'}
              style={{ overflowY: 'scroll', overflowX: 'hidden', height: clientHeight }}
            >
              <div id={'svgcanvas'} className={'bg-gray-100'} ref={container} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Editor
