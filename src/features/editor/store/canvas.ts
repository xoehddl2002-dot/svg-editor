import { create } from 'zustand'
import { SVGCanvas, TemplateItem, Font } from '@/features/editor/const'
import instance from '@/api'
import { fontLoad } from '@/features/editor/utils/fontUtils.ts'
import { BatchCommand, ChangeElementCommand, InsertElementCommand } from '@/features/editor/svgcanvas/history'
import { Canvg } from 'canvg'
import { Buffer } from 'buffer'

type imageListValueType = {
  id: string
  original: string
}

type saveSettingJsonType = {
  path: string
  fileName: string
  'font-list': Record<string, string[]>
  'image-list': Record<string, imageListValueType[]>
  'content-list': Record<string, string[]>
  item: Record<string, Record<string, string>>
}

interface HistoryAttrProps {
  attribute: Record<string, string>
  comment: string
}

type FileType = {
  pngFile1920: Blob
  pngFile1280: Blob
}

interface CanvasState {
  svgCanvas: SVGCanvas | undefined
  saveSettingJson: saveSettingJsonType
  originalImageList: Record<string, string>
  zoom: number
  zoomSub: number
  clientWidth: number
  clientHeight: number
  isLoad: boolean

  isLoaded: () => boolean
  setZoom: (z: number) => void
  getZoom: () => number
  getDimensions: () => { clientWidth: number; clientHeight: number }
  setCanvas: (c: SVGCanvas) => void
  getCanvas: () => SVGCanvas | undefined
  loadSVG: (item: TemplateItem) => void
  zoomSet: (cf: () => void) => void
  zoomChange: () => void
  updateCanvas: () => void
  loadFont: (fontList: Font[]) => void
  clickUndo: () => void
  clickRedo: () => void
  addHistory: (historyAttr: HistoryAttrProps) => void
  addSVG: (svgContent: string, isShapes: boolean, seq: number) => void
  deleteSVG: () => void
  copySVG: () => void
  saveAll: () => Promise<{ svgFile: Blob; jsonFile: Blob; pngFile1920: Blob; pngFile1280: Blob } | null>
  releaseCanvas: (canvas: HTMLCanvasElement) => void
  cloneSVG: () => Promise<string | null>
  canvg: (image: HTMLImageElement) => Promise<FileType | null>
  downloadPng: () => Promise<FileType | null>
  saveSVG: () => Promise<{ svgBlob: Blob; json: string | null } | null>
  saveJSON: () => Promise<string | null>
  b64toBlob: (b64Data: string, contentType: string) => Blob
  replaceAll: (str: string, reg: string, replaceStr: string) => string
  addText: () => Element | null
  addImage: () => Promise<Element | null>
}

const useCanvasStore = create<CanvasState>((set, get) => ({
  svgCanvas: undefined,
  saveSettingJson: {
    path: '',
    fileName: '',
    'font-list': {},
    'image-list': {},
    'content-list': {},
    item: {},
  },
  originalImageList: {},
  zoom: 0,
  zoomSub: 10,
  clientWidth: 1258,
  clientHeight: 825,
  isLoad: false,

  isLoaded: () => {
    return get().isLoad
  },
  setZoom: (z: number) => {
    set({ zoom: z })
  },
  getZoom: () => {
    return get().zoom
  },
  getDimensions: () => {
    const { clientWidth, clientHeight } = get()
    return { clientWidth, clientHeight }
  },
  setCanvas: (c: SVGCanvas) => set({ svgCanvas: c }),
  getCanvas: () => {
    return get().svgCanvas
  },
  loadSVG: ({ templateJson, templateUrl, fontList }) => {
    const { svgCanvas: canvas, originalImageList, saveSettingJson, zoomSet, loadFont } = get()
    if (canvas) {
      set({
        saveSettingJson: {
          path: '',
          fileName: '',
          'font-list': {},
          'image-list': {},
          'content-list': {},
          item: {},
        },
        originalImageList: {},
      })
      try {
        loadFont(fontList)
        canvas.clear()
        fetch(templateJson)
          .then(res => res.json())
          .then((json: saveSettingJsonType) => {
            set({
              saveSettingJson: json,
            })
            instance.get(templateUrl).then(async res => {
              const svg = canvas.stringToHTML(res.data) as HTMLElement
              canvas.sanitizeSvg(svg)

              svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
              svg.querySelectorAll('image').forEach(element => {
                if (!element.hasAttribute('preserveAspectRatio')) {
                  element.setAttribute('preserveAspectRatio', 'none')
                  //element.setAttribute('preserveAspectRatio', 'xMidYMid slice')
                }

                const val = canvas.getHref(element)
                const imageId = element.getAttribute('id')
                if (imageId) {
                  originalImageList[imageId] = val
                }
              })

              svg
                .querySelectorAll(
                  '[image_id],[shapes_id],[editor_move],[editor_scale],[editor_rotate],[attr_rock],[max_length],[add_svg]',
                )
                .forEach(element => {
                  element.removeAttribute('image_id')
                  element.removeAttribute('shapes_id')
                  element.removeAttribute('editor_move')
                  element.removeAttribute('editor_scale')
                  element.removeAttribute('editor_rotate')
                  element.removeAttribute('attr_rock')
                  element.removeAttribute('max_length')
                  element.removeAttribute('add_svg')
                })
              canvas.setJustSelected(null)
              canvas.clearSelection(true)
              canvas.leaveContext()

              const jsonObject = JSON.parse(json.toString())
              Object.entries(jsonObject['image-list']).forEach(([aname, value]) => {
                ;(value as imageListValueType[]).forEach(v => {
                  const elem = svg.querySelector('#' + v.id)
                  if (elem) {
                    canvas.setHref(elem, aname)
                  }
                })
              })

              const tempSaveSettingJson = saveSettingJson
              Object.entries(jsonObject.item).forEach(([aname, value]) => {
                const tempValue = value as Record<string, string>
                const elem = svg.querySelector('#' + aname)
                if (elem) {
                  if (!tempSaveSettingJson['item'][aname]) {
                    tempSaveSettingJson['item'][aname] = {}
                  }
                  elem.setAttribute('editor_move', tempValue['editor_move'])
                  tempSaveSettingJson['item'][aname]['editor_move'] = `${tempValue['editor_move']}`
                  elem.setAttribute('editor_scale', tempValue['editor_scale'])
                  tempSaveSettingJson['item'][aname]['editor_scale'] = `${tempValue['editor_scale']}`
                  elem.setAttribute('editor_rotate', tempValue['editor_rotate'])
                  tempSaveSettingJson['item'][aname]['editor_rotate'] = `${tempValue['editor_rotate']}`
                  elem.setAttribute('attr_rock', tempValue['attr_rock'])
                  tempSaveSettingJson['item'][aname]['attr_rock'] = `${tempValue['attr_rock']}`
                  if (tempValue['image_id']) {
                    elem.setAttribute('image_id', tempValue['image_id'])
                    tempSaveSettingJson['item'][aname]['image_id'] = `${tempValue['image_id']}`
                  }
                  if (tempValue['shapes_id']) {
                    elem.setAttribute('shapes_id', tempValue['shapes_id'])
                    tempSaveSettingJson['item'][aname]['shapes_id'] = `${tempValue['shapes_id']}`
                  }
                  if (tempValue['max_length']) {
                    elem.setAttribute('max_length', tempValue['max_length'])
                    tempSaveSettingJson['item'][aname]['max_length'] = `${tempValue['max_length']}`
                  }
                  if (tempValue['add_svg']) {
                    elem.setAttribute('add_svg', tempValue['add_svg'])
                    tempSaveSettingJson['item'][aname]['add_svg'] = `${tempValue['add_svg']}`
                  }
                }
              })
              set({ saveSettingJson: tempSaveSettingJson })

              canvas.setSvgString(new XMLSerializer().serializeToString(svg))
              zoomSet(() => {})
              const { undoMgr } = canvas
              undoMgr.resetUndoStack()
              set({ isLoad: true })
            })
          })
          .catch(() => {
            console.log('json file not')
          })
      } catch (err) {
        console.error(err)
      }
    }
  },
  zoomSet: (cf: () => void) => {
    const { svgCanvas: canvas, zoomSub, zoomChange, zoom } = get()
    if (canvas) {
      canvas.clearSelection()
      const z = parseInt(`${zoom / zoomSub}`) //0의 버리기
      set({ zoom: z * zoomSub })
      cf()
      zoomChange()
    }
  },
  zoomChange: () => {
    const { svgCanvas: canvas, zoom, clientWidth, clientHeight, updateCanvas } = get()
    if (canvas) {
      const zoomlevel = Number(zoom) > 0.1 ? Number(zoom) * 0.01 : 0.1
      const z = canvas.getZoom() / 1000
      const simpleBar = document.getElementById('simpleBar')

      const w = clientWidth
      const h = clientHeight

      const zInfo = canvas.setBBoxZoom(
        {
          width: 0,
          height: 0,
          // center pt of scroll position
          x: simpleBar ? simpleBar.scrollLeft + w / 2 / z : 0,
          y: simpleBar ? simpleBar.scrollTop + h / 2 / z : 0,
          zoom: zoomlevel,
        },
        w,
        h,
      )
      if (!zInfo) {
        return
      }
      updateCanvas()
    }
  },
  updateCanvas: () => {
    const { svgCanvas: canvas, clientWidth, clientHeight, getZoom } = get()
    if (canvas) {
      const multi = 10
      const zoom = getZoom() / 1000
      const simpleBar = document.getElementById('simpleBar')
      const cnvs = document.getElementById('svgcanvas')

      let w = parseFloat(getComputedStyle(simpleBar as Element, null).width.replace('px', ''))
      let h = parseFloat(getComputedStyle(simpleBar as Element, null).height.replace('px', ''))

      const wOrig = w
      const hOrig = h

      if (cnvs) {
        w = Math.max(w, canvas.contentW * zoom * multi)
        h = Math.max(h, canvas.contentH * zoom * multi)
        cnvs.style.width = w + 'px'
        cnvs.style.height = h + 'px'
      }
      if (simpleBar) {
        simpleBar.style.width = clientWidth + 'px'
        simpleBar.style.height = clientHeight + 'px'
      }

      const offset = canvas.updateCanvas(w, h < clientHeight ? clientHeight : h)

      if (simpleBar) {
        simpleBar.scrollLeft = offset.x - wOrig / 2
        simpleBar.scrollTop = offset.y - hOrig / 2
      }

      canvas.clearSelection()
    }
  },
  loadFont: async fontList => {
    await fontLoad(fontList)
  },
  clickUndo: () => {
    const { svgCanvas: canvas } = get()
    if (canvas) {
      const { undoMgr } = canvas
      if (undoMgr.getUndoStackSize() > 0) {
        undoMgr.undo()
        canvas.clearSelection()
      }
    }
  },
  clickRedo: () => {
    const { svgCanvas: canvas } = get()
    if (canvas) {
      const { undoMgr } = canvas
      if (undoMgr.getRedoStackSize() > 0) {
        undoMgr.redo()
        canvas.clearSelection()
      }
    }
  },
  addHistory: ({ attribute, comment }: HistoryAttrProps) => {
    const { svgCanvas: canvas } = get()
    if (canvas) {
      const selectedList = canvas.getSelectedElements()

      const batchCmd = new BatchCommand()
      selectedList.forEach(child => {
        let elem = child as Element
        if (elem.nodeName === 'g') {
          if (elem.hasAttribute('image_id')) {
            const imageId = elem.id
            const imageElem = elem.querySelector(`image[image_id=${imageId}]`)
            if (imageElem) {
              elem = imageElem
            }
          } else if (elem.hasAttribute('shapes_id')) {
            const shapesId = elem.id
            const shapesElem = elem.querySelector(`*[shapes_id=${shapesId}]`)
            if (shapesElem) {
              elem = shapesElem
            }
          }
        }
        batchCmd.addSubCommand(new ChangeElementCommand(elem, attribute, comment))
      })

      const elem = selectedList[0] as Element
      setTimeout(() => {
        const { selectorManager } = canvas
        if (elem.tagName !== 'g') {
          if (elem.hasAttribute('shapes_id')) {
            const shapesGroup = document.querySelector("g[shapes_id='" + elem.getAttribute('shapes_id') + "']")
            if (shapesGroup) {
              selectorManager.requestSelector(shapesGroup).resize()
            }
            return
          } else if (elem.hasAttribute('image_id')) {
            const imageGroup = document.querySelector("g[image_id='" + elem.getAttribute('image_id') + "']")
            if (imageGroup) {
              selectorManager.requestSelector(imageGroup).resize()
            }
            return
          }
        }
        selectorManager.requestSelector(elem).resize()
      }, 100)
      const { undoMgr } = canvas
      undoMgr.addCommandToHistory(batchCmd)
    }
  },
  addSVG: (svgContent: string, isShapes: boolean, seq: number) => {
    const { svgCanvas: canvas, saveSettingJson, getZoom } = get()
    if (canvas) {
      const prevCronJson = JSON.parse(JSON.stringify(saveSettingJson))

      canvas.leaveContext()
      const newId = canvas.getNextId()
      const g = canvas.createSVGElement({
        element: 'g',
        attr: {
          id: newId,
          editor_move: 'true',
          editor_scale: 'true',
          editor_rotate: 'true',
          attr_rock: 'false',
          add_svg: `${seq}`,
        },
      })

      const svg = canvas.addSvgString(g, svgContent)

      const rate = 100 / getZoom()

      let svgWidth = parseInt(svg.getAttribute('width') ?? '0') * 10 * rate
      let svgHeight = parseInt(svg.getAttribute('height') ?? '0') * 10 * rate

      if (svgWidth > 300) {
        svgWidth = 300
      }
      if (svgHeight > 300) {
        svgHeight = 300
      }

      svg.setAttribute('width', `${svgWidth}`)
      svg.setAttribute('height', `${svgHeight}`)

      if (g.children.length > 0) {
        canvas.sanitizeSvg(g)

        saveSettingJson.item[newId] = {
          id: newId,
          nodeName: g.nodeName,
          editor_move: 'true',
          editor_scale: 'true',
          editor_rotate: 'true',
          attr_rock: 'false',
          add_svg: `${seq}`,
        }

        if (isShapes) {
          g.setAttribute('shapes_id', newId)
          saveSettingJson.item[newId]['shapes_id'] = newId
        }
        if (isShapes && g.nodeName == 'g') {
          let firstFill: string | null = null
          const c: Element[] = []
          g
            .querySelector('defs > symbol')
            ?.querySelectorAll('circle,rect,path,polygon,polyline,ellipse,line,text,use')
            .forEach(element => {
              if (
                element.hasAttribute('fill') &&
                element.getAttribute('fill') != 'none' &&
                element.getAttribute('fill') != ''
              ) {
                if (!firstFill) {
                  firstFill = element.getAttribute('fill')
                  c.push(element)
                } else {
                  if (element.getAttribute('fill') == firstFill) {
                    c.push(element)
                  }
                }
              } else {
                if (element.getAttribute('fill') == 'none') {
                  element.setAttribute('fill', '#00000000')
                } else {
                  element.setAttribute('fill', '#000000FF')
                }
                if (!firstFill) {
                  firstFill = element.getAttribute('fill')
                  c.push(element)
                } else {
                  if (element.getAttribute('fill') == firstFill) {
                    c.push(element)
                  }
                }
              }
            })

          c.forEach(e => {
            let new_child_id = e.id

            if (!new_child_id || document.querySelectorAll('#' + new_child_id).length > 1) {
              new_child_id = canvas.getNextId()
            }

            e.setAttribute('id', new_child_id)
            e.setAttribute('editor_move', 'true')
            e.setAttribute('editor_scale', 'true')
            e.setAttribute('editor_rotate', 'true')
            e.setAttribute('attr_rock', 'false')
            e.setAttribute('shapes_id', newId)

            saveSettingJson.item[new_child_id] = {
              id: new_child_id,
              nodeName: e.nodeName,
              editor_move: 'true',
              editor_scale: 'true',
              editor_rotate: 'true',
              attr_rock: 'false',
              shapes_id: newId,
            }
          })
        }
        if (!saveSettingJson['content-list'][seq]) {
          saveSettingJson['content-list'][seq] = []
        }
        saveSettingJson['content-list'][seq].push(newId)

        const currentCronJson = JSON.parse(JSON.stringify(saveSettingJson))

        // store in our Undo History
        const batchCmd = new BatchCommand('Import SVG')
        batchCmd.addSubCommand(
          new InsertElementCommand(g, 'Import SVG', (flag: boolean) => {
            if (flag) {
              set({
                saveSettingJson: currentCronJson,
              })
            } else {
              set({
                saveSettingJson: prevCronJson,
              })
            }
          }),
        )
        const { undoMgr } = canvas
        undoMgr.addCommandToHistory(batchCmd)
      }
    }
  },
  deleteSVG: () => {
    const { svgCanvas: canvas, saveSettingJson } = get()
    if (canvas) {
      const selected = canvas.getSelectedElements()[0] as Element
      const svgName = selected.getAttribute('add_svg')
      const id = selected.getAttribute('id')

      const prevCronJson = JSON.parse(JSON.stringify(saveSettingJson))
      if (svgName && id) {
        delete saveSettingJson.item[id]
        const jsonObj = saveSettingJson['content-list'][svgName]
        if (jsonObj) {
          const idIndex = saveSettingJson['content-list'][svgName].indexOf(id)
          saveSettingJson['content-list'][svgName].splice(idIndex, 1)
          if (saveSettingJson['content-list'][svgName].length == 0) {
            delete saveSettingJson['content-list'][svgName]
          }
        }
      }

      const currentCronJson = JSON.parse(JSON.stringify(saveSettingJson))

      canvas.deleteSelectedElements(flag => {
        if (flag) {
          set({
            saveSettingJson: currentCronJson,
          })
        } else {
          set({
            saveSettingJson: prevCronJson,
          })
        }
      })
      canvas.clearSelection()
    }
  },
  async copySVG() {
    const { svgCanvas: canvas, saveSettingJson } = get()
    if (canvas) {
      const batchCmd = new BatchCommand('Clone Elements')
      const copyElem = canvas.cloneSelectedElement(0, 0)
      batchCmd.addSubCommand(new InsertElementCommand(copyElem, 'copy svg', () => {}))

      if (copyElem.nodeName == 'g') {
        let clipPath = undefined
        let useLink: Element | null = null
        for (let i = 0; i < copyElem.childNodes.length; i++) {
          const child = copyElem.childNodes[i] as Element
          //shape
          if (child.nodeName == 'defs') {
            const promise = Array.from(child.childNodes).map(children => {
              if (children.nodeName == 'symbol') {
                for (let k = 0; k < children.childNodes.length; k++) {
                  const grandson = children.childNodes[k] as Element
                  if (grandson.hasAttribute('shapes_id')) {
                    grandson.setAttribute('shapes_id', copyElem.id)
                  }
                }
              }
              if (
                !useLink &&
                ['line', 'circle', 'ellipse', 'foreignObject', 'rect', 'polygon', 'polyline', 'path'].includes(
                  children.nodeName,
                )
              ) {
                useLink = children as Element
              }
            })
            await Promise.all(promise)
          }
          if (child.nodeName == 'clipPath') {
            clipPath = child
            if (useLink) {
              const test = useLink as Element
              const use = child.querySelector('use')
              if (use) {
                canvas.setHref(use, `#${test.id}`)
              }
            }
          }

          if (child.nodeName == 'g' && child.hasAttribute('clip-path')) {
            for (let j = 0; j < child.childNodes.length; j++) {
              const children = child.childNodes[j] as Element

              if (children) {
                if (children.nodeName == 'image' && children.hasAttribute('image_id')) {
                  children.setAttribute('image_id', copyElem.id)
                }
              }
            }
            if (clipPath) {
              child.setAttribute('clip-path', `url(#${clipPath.id})`)
            }
          }
        }
      }
      if (copyElem.nodeName == 'g' && copyElem.hasAttribute('image_id')) {
        let clipPath = undefined
        for (let i = 0; i < copyElem.childNodes.length; i++) {
          const child = copyElem.childNodes[i] as Element
          if (child.nodeName == 'clipPath') {
            clipPath = child
          }
          if (child.nodeName == 'g' && child.hasAttribute('clip-path')) {
            for (let j = 0; j < child.childNodes.length; j++) {
              const children = child.childNodes[j] as Element

              if (children) {
                if (children.nodeName == 'image' && children.hasAttribute('image_id')) {
                  children.setAttribute('image_id', copyElem.id)
                }
              }
            }
            if (clipPath) {
              child.setAttribute('clip-path', `url(#${clipPath.id})`)
            }
          }
        }
      }
      if (copyElem.nodeName == 'g' && copyElem.hasAttribute('shapes_id')) {
        const shapes = copyElem.querySelector('[shapes_id]')

        if (shapes) {
          shapes.setAttribute('shapes_id', copyElem.id)
        }

        const useArr = Array.from(copyElem.querySelectorAll('use'))
        if (useArr.length > 0) {
          useArr.map(ele => {
            const href = canvas.getHref(ele)
            if (href.startsWith('#svg_')) {
              const symbol = copyElem.querySelector('defs > symbol')
              if (symbol) {
                canvas.setHref(ele, `#${symbol.id}`)
              }
            }
          })
        }
      }
      const attrList = [
        'id',
        'editor_move',
        'editor_scale',
        'editor_rotate',
        'attr_rock',
        'add_svg',
        'shape_id',
        'image_id',
      ]
      let data: Record<string, string> = {
        nodeName: copyElem.nodeName,
      }
      for await (const attr of attrList) {
        if (copyElem.hasAttribute(attr)) {
          const a = copyElem.getAttribute(attr)
          if (a) {
            data = {
              ...data,
              attr: a,
            }
          }
        }
      }
      saveSettingJson['item'][copyElem.id] = data
      if (data['add_svg']) {
        saveSettingJson['content-list'][data['add_svg']].push(copyElem.id)
      }

      canvas.addToSelection([copyElem], true) // Need to reverse for correct selection-adding
      canvas.moveSelectedElements(10, 10, false)
      const { undoMgr } = canvas
      undoMgr.addCommandToHistory(batchCmd)
    }
  },
  cloneSVG: async () => {
    const { svgCanvas: canvas, saveSettingJson, releaseCanvas, replaceAll } = get()
    if (canvas) {
      const svgNode = canvas.getSvgContent().cloneNode(true) as Element

      svgNode.setAttribute('id', canvas.getNextId())

      const doctype =
        '<?xml version="1.0" standalone="no"?>' +
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'

      let resourceStr = '<defs xmlns="http://www.w3.org/2000/svg">\n<style type="text/css">\n'
      new Promise<void>(async resolve => {
        let index = 0
        const fontList = saveSettingJson['font-list']
        if (fontList) {
          Object.entries(fontList).forEach(async ([aname]) => {
            const reader = new FileReader()
            reader.onload = () => {
              index++
              resourceStr += '@font-face {\n' + `font-family: '${aname}';\n` + `src: url('${reader.result}');\n` + '}\n'
              if (fontList.keys.length == index) {
                resourceStr += '</style>\n</defs>'
                resolve()
              }
            }
            const response = await fetch('/font/' + aname + '.woff2')
            const fontBlob = await response.blob()
            reader.readAsDataURL(fontBlob)
          })
        } else {
          resolve()
        }
      })

      const layer = svgNode.querySelector('g.layer')
      //실제 해상도와 표시되는 해상도 차이
      //모바일 같은 경우에 1pixel당 해상도가 1이 아니다
      //내가 개발에 사용한 스마트폰 a51모델의 경우 1pixel당 실제 해상도는 2.5였다
      //그렇기 때문에 실제 해상도를 적용안해주고 canvas로 pixel 이미지를 생성하면 이미지가 깨진다
      const dpr = window.devicePixelRatio

      let width = canvas.contentW * dpr
      let height = canvas.contentH * dpr

      const pixelSize = width * height
      const pixelLimit = 16777216
      let layerTransform = dpr
      if (pixelSize > pixelLimit) {
        const rate = pixelLimit / pixelSize
        width = parseInt(`${width * rate}`)
        height = parseInt(`${height * rate}`)
        layerTransform = dpr * rate
      }
      if (layer) {
        layer.setAttribute('transform', `scale(${layerTransform})`)
      }

      svgNode.setAttribute('width', `${width}`)
      svgNode.setAttribute('height', `${height}`)
      svgNode.setAttribute('x', '0')
      svgNode.setAttribute('y', '0')
      svgNode.setAttribute('viewBox', `0 0 ${width} ${height}`)

      const defs = canvas.stringToHTML(resourceStr)
      if (defs) {
        svgNode.appendChild(defs)
      }

      new Promise<void>(async resolve => {
        let index = 0
        const imageList = svgNode.querySelectorAll('image')
        if (imageList.length > 0) {
          for (const elem of imageList) {
            const href = canvas.getHref(elem)
            const reader = new FileReader()
            reader.onload = () => {
              index++
              const url = reader.result
              if (url) {
                canvas.setHref(elem, url.toString())
              }

              if (imageList.length == index) {
                resolve()
              }
            }
            const response = await fetch(href)
            const fontBlob = await response.blob()
            reader.readAsDataURL(fontBlob)
          }
        } else {
          resolve()
        }
      })

      let blobStr = doctype + canvas.svgToString(svgNode, 0)
      blobStr = replaceAll(blobStr, '<DEFS', '<defs')
      blobStr = replaceAll(blobStr, '</DEFS', '</defs')
      blobStr = replaceAll(blobStr, '<STYLE', '<style')
      blobStr = replaceAll(blobStr, '</STYLE', '</style')

      if (!document.getElementById('export_canvas')) {
        const canvas = document.createElement('canvas')
        canvas.setAttribute('id', 'export_canvas')
        canvas.style.display = 'none'
        document.body.appendChild(canvas)
      }

      const c = document.getElementById('export_canvas') as HTMLCanvasElement
      if (c) {
        c.width = width
        c.height = height
        const ctx = c.getContext('2d')
        if (ctx) {
          const v = Canvg.fromString(ctx, blobStr)
          await v.render()
        }
        const svgBlob = await (await fetch(c.toDataURL('image/png'))).blob()
        releaseCanvas(c)
        return window.URL.createObjectURL(svgBlob)
      }
    }
    return null
  },
  releaseCanvas: async (canvas: HTMLCanvasElement) => {
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx && ctx.clearRect(0, 0, 1, 1)
      ctx.beginPath()
    }
    canvas.remove()
  },
  downloadPng: async () => {
    const { svgCanvas: canvas, cloneSVG, canvg } = get()
    if (canvas) {
      const svgUrl = await cloneSVG()
      if (svgUrl) {
        return await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image()

          image.src = svgUrl

          image.onload = async () => {
            resolve(image)
          }

          image.onerror = err => {
            reject(err)
          }
        }).then(async image => {
          const pngFile = await canvg(image)
          window.URL.revokeObjectURL(svgUrl)
          return pngFile
        })
      }
    }
    return null
  },
  canvg: async (image: HTMLImageElement) => {
    const { svgCanvas: canvas, releaseCanvas } = get()

    if (canvas) {
      const rc = document.createElement('canvas')
      document.body.appendChild(rc)
      rc.width = image.width
      rc.height = image.height
      rc.style.display = 'none'

      const rctx = rc.getContext('2d')
      if (rctx) {
        rctx.imageSmoothingQuality = 'high'
        rctx.drawImage(image, 0, 0)
      }

      const c = document.createElement('canvas')
      document.body.appendChild(c)
      c.width = canvas.contentW
      c.height = canvas.contentH
      c.style.display = 'none'
      const ctx = c.getContext('2d')
      if (ctx) {
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(rc, 0, 0, rc.width, rc.height, 0, 0, c.width, c.height)
      }

      releaseCanvas(rc)

      const mb1 = 1024 * 1024
      //해상도는 1280,1920기준으로 결과물을 생성시킨다
      //기존 템플릿은 1920을 기준으로 작업이 되있고
      //1280 이미지를 생성할땐 기존 이미지의 크기에서 1.596을 나눈다
      let pngUrl1920 = c.toDataURL('image/png', 1.0)
      let pngFile1920 = await (await fetch(pngUrl1920)).blob()

      const originalPngSize = pngFile1920.size
      window.URL.revokeObjectURL(pngUrl1920)
      let changeQuality = 1.0
      //1mb체크
      if (pngFile1920.size > mb1) {
        new Promise<number>(async resolve => {
          for (let i = 1; i < 10; i++) {
            const quality = 1.0 - i * 0.05
            pngUrl1920 = c.toDataURL('image/jpeg', quality)
            pngFile1920 = await (await fetch(pngUrl1920)).blob()
            window.URL.revokeObjectURL(pngUrl1920)
            if (mb1 > pngFile1920.size) {
              //결과물이 1mb보다 작으면 종료
              resolve(quality)
            }
          }
        }).then((quality: number) => {
          changeQuality = quality
        })
      }

      const resultPngSize = pngFile1920.size

      console.log(
        `사이즈 다운 변경 사항 quality : 1.0 - > ${changeQuality}, size : ${originalPngSize} -> ${resultPngSize}`,
      )

      //1280 w,h
      const w = Math.round(canvas.contentW / 1.596)
      const h = Math.round(canvas.contentH / 1.596)

      const oc = document.createElement('canvas')
      document.body.appendChild(oc)
      oc.width = w
      oc.height = h
      oc.style.display = 'none'

      const octx = oc.getContext('2d')
      if (octx) {
        octx.imageSmoothingQuality = 'high'
        octx.drawImage(c, 0, 0, oc.width, oc.height)
      }

      releaseCanvas(c)
      let pngUrl1280 = oc.toDataURL('image/png', 1.0)
      releaseCanvas(oc)
      let pngFile1280 = await (await fetch(pngUrl1280)).blob()
      window.URL.revokeObjectURL(pngUrl1280)

      //1mb체크
      if (pngFile1280.size > mb1) {
        new Promise<void>(async resolve => {
          for (let i = 1; i < 10; i++) {
            const quality = 1.0 - i * 0.05
            pngUrl1280 = c.toDataURL('image/jpeg', quality)
            pngFile1280 = await (await fetch(pngUrl1280)).blob()
            window.URL.revokeObjectURL(pngUrl1280)
            if (mb1 > pngFile1280.size) {
              //결과물이 1mb보다 작으면 종료
              resolve()
            }
          }
        })
      }
      return { pngFile1920, pngFile1280 }
    }
    return null
  },
  saveJSON: async () => {
    const { svgCanvas: canvas, saveSettingJson, replaceAll } = get()
    if (canvas) {
      const svg = canvas.getSvgContent()

      saveSettingJson['image-list'] = {}
      svg.querySelectorAll('image').forEach(element => {
        const href = canvas.getHref(element)
        const jsonImageKey = href
        if (!saveSettingJson['image-list'][jsonImageKey]) {
          saveSettingJson['image-list'][jsonImageKey] = []
        }
        const id = element.getAttribute('id')
        if (id) {
          saveSettingJson['image-list'][jsonImageKey].push({ id: id, original: jsonImageKey })
        }
      })

      saveSettingJson['font-list'] = {}
      svg.querySelectorAll('text').forEach(element => {
        let family = element.getAttribute('font-family')
        if (family) {
          family = replaceAll(family, "'", '')
          if (!saveSettingJson['font-list'][family]) {
            saveSettingJson['font-list'][family] = []
          }
          const id = element.getAttribute('id')
          if (id) {
            saveSettingJson['font-list'][family].push(id)
          }
          element.setAttribute('font-family', `'${family}'`)
        }
      })

      saveSettingJson['content-list'] = {}
      svg.querySelectorAll('[add_svg]').forEach(element => {
        const addSvg = element.getAttribute('add_svg')
        if (addSvg) {
          if (!saveSettingJson['content-list'][addSvg]) {
            saveSettingJson['content-list'][addSvg] = []
          }
          const id = element.getAttribute('id')
          if (id) {
            saveSettingJson['content-list'][addSvg].push(id)
          }
        }
      })

      return JSON.stringify(saveSettingJson)
    }
    return null
  },
  saveSVG: async () => {
    const { svgCanvas: canvas, saveSettingJson, saveJSON, b64toBlob } = get()
    if (canvas) {
      const jsonStr = await saveJSON()

      canvas.clearSelection()

      Object.entries(saveSettingJson['image-list']).forEach(async ([_, value]) => {
        value.forEach(async v => {
          const image = document.getElementById(v.id)
          if (image) {
            canvas.setHref(image, v.original)
          }
        })
      })

      const svgDocument = canvas.getSvgContent()

      svgDocument
        .querySelectorAll(
          '[image_id],[shapes_id],[editor_move],[editor_scale],[editor_rotate],[attr_rock],[max_length],[add_svg]',
        )
        .forEach(element => {
          element.removeAttribute('image_id')
          element.removeAttribute('shapes_id')
          element.removeAttribute('editor_move')
          element.removeAttribute('editor_scale')
          element.removeAttribute('editor_rotate')
          element.removeAttribute('attr_rock')
          element.removeAttribute('max_length')
          element.removeAttribute('add_svg')
        })

      const svg = '<?xml version="1.0"?>\n' + canvas.svgCanvasToString()

      Object.entries(saveSettingJson['image-list']).forEach(async ([aname, value]) => {
        value.forEach(async v => {
          const image = document.getElementById(v.id)
          if (image) {
            canvas.setHref(image, aname)
          }
        })
      })

      Object.entries(saveSettingJson['item']).forEach(async ([aname, value]) => {
        let element = document.getElementById(aname)
        if (element) {
          element.setAttribute('editor_move', value['editor_move'])
          element.setAttribute('editor_scale', value['editor_scale'])
          element.setAttribute('editor_rotate', value['editor_rotate'])
          element.setAttribute('attr_rock', value['attr_rock'])
          if (value['image_id']) {
            element.setAttribute('image_id', value['image_id'])
          }
          if (value['shapes_id']) {
            element.setAttribute('shapes_id', value['shapes_id'])
          }
          if (value['max_length']) {
            element.setAttribute('max_length', value['max_length'])
          }
          if (value['add_svg']) {
            element.setAttribute('add_svg', value['add_svg'])
          }
        }
      })

      const b64Data = canvas.encode64(svg)
      return { svgBlob: b64toBlob(b64Data, 'image/svg+xml'), json: jsonStr }
    }
    return null
  },
  b64toBlob(b64Data: string, contentType = '') {
    const sliceSize = 512
    const byteCharacters = Buffer.from(b64Data, 'base64')
    const byteArrays = []
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize)
      const byteNumbers = new Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice[i]
      }
      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }
    const blob = new Blob(byteArrays, { type: contentType })
    return blob
  },
  saveAll: async () => {
    const { svgCanvas: canvas, downloadPng, saveSVG } = get()
    if (canvas) {
      const pngFile = await downloadPng()
      if (pngFile) {
        const svgTemp = await saveSVG()
        if (svgTemp) {
          const { svgBlob, json } = svgTemp
          if (json) {
            const jsonFile = new Blob([json], { type: 'application/json' })
            return {
              svgFile: svgBlob,
              jsonFile,
              pngFile1920: pngFile.pngFile1920,
              pngFile1280: pngFile.pngFile1280,
            }
          }
        }
      }
    }
    return null
  },
  replaceAll: (str, reg, replaceStr) => {
    let flag = true
    let result = str
    while (flag) {
      result = result.replace(reg, replaceStr)
      if (result.indexOf(reg) === -1) {
        flag = false
      }
    }
    return result
  },
  addText: () => {
    const { svgCanvas: canvas, saveSettingJson } = get()
    if (canvas) {
      const newId = canvas.getNextId()
      const text = canvas.createSVGElement({
        element: 'text',
        attr: {
          id: newId,
          editor_move: 'true',
          editor_scale: 'false',
          editor_rotate: 'true',
          attr_rock: 'false',
          'font-size': '50',
          'font-family': "'NotoSansKR-Regular'",
        },
      })
      text.textContent = 'TEXT'
      canvas.sanitizeSvg(text)

      saveSettingJson.item[newId] = {
        id: newId,
        nodeName: text.nodeName,
        editor_move: 'true',
        editor_scale: 'false',
        editor_rotate: 'true',
        attr_rock: 'false',
      }
      const prevCronJson = JSON.parse(JSON.stringify(saveSettingJson))
      const svgcontent = document.getElementById('svgcontent') as Element

      const width = parseFloat(svgcontent.getAttribute('width') ?? '0')
      const height = parseFloat(svgcontent.getAttribute('height') ?? '0')

      const x = width / 2
      const y = height / 2 + 50

      text.setAttribute('x', `${x}`)
      text.setAttribute('y', `${y}`)

      const currentCronJson = JSON.parse(JSON.stringify(saveSettingJson))

      // store in our Undo History
      const batchCmd = new BatchCommand('Import SVG')
      batchCmd.addSubCommand(
        new InsertElementCommand(text, 'Import SVG', (flag: boolean) => {
          set({
            saveSettingJson: flag ? currentCronJson : prevCronJson,
          })
        }),
      )
      const { undoMgr } = canvas
      undoMgr.addCommandToHistory(batchCmd)
      canvas.clearSelection()
      canvas.addToSelection([text], true)
      text.setAttribute('editor_selected', 'true')
      return text
    }
    return null
  },
  addImage: async () => {
    return new Promise<Element | null>(async resolve => {
      const { svgCanvas: canvas, saveSettingJson, originalImageList } = get()
      if (canvas) {
        const url = '/picture/1/326/202311021442165853326.jpg'
        var img = new Image()

        img.onload = async () => {
          const w = 320
          const h = 240

          const newId = canvas.getNextId()
          if (!saveSettingJson['image-list'][url]) {
            saveSettingJson['image-list'][url] = []
          }
          saveSettingJson['image-list'][url].push({ id: newId, original: url })
          originalImageList[url] = url

          const newImage = canvas.createSVGElement({
            element: 'image',
            attr: {
              width: `${w}`,
              height: `${h}`,
              id: newId,
              style: 'pointer-events:inherit',
              editor_move: 'true',
              editor_scale: 'true',
              editor_rotate: 'true',
              preserveAspectRatio: 'none',
              image_id: newId,
            },
          })
          canvas.setHref(newImage, url)
          newImage.addEventListener('click', function (e) {
            if (e.cancelable) e.preventDefault()
          })
          saveSettingJson.item[newId] = {
            id: newId,
            nodeName: newImage.nodeName,
            editor_move: 'true',
            editor_scale: 'false',
            editor_rotate: 'true',
            attr_rock: 'false',
            image_id: newId,
          }
          const prevCronJson = JSON.parse(JSON.stringify(saveSettingJson))

          const width = canvas.contentW
          const height = canvas.contentH

          const x = width / 2 - w / 2
          const y = height / 2 + 50 - h / 2

          newImage.setAttribute('x', `${x}`)
          newImage.setAttribute('y', `${y}`)

          const currentCronJson = JSON.parse(JSON.stringify(saveSettingJson))

          // store in our Undo History
          const batchCmd = new BatchCommand('Import SVG')
          batchCmd.addSubCommand(
            new InsertElementCommand(newImage, 'Import SVG', (flag: boolean) => {
              set({
                saveSettingJson: flag ? currentCronJson : prevCronJson,
              })
            }),
          )
          const { undoMgr } = canvas
          undoMgr.addCommandToHistory(batchCmd)
          canvas.clearSelection()
          canvas.addToSelection([newImage], true)
          newImage.setAttribute('editor_selected', 'true')
          resolve(newImage)
        }
        img.src = url
      } else {
        resolve(null)
      }
    })
  },
}))

export default useCanvasStore
