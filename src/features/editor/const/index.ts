import {Command} from "@/features/editor/svgcanvas/history";
import {SelectorManager} from "@/features/editor/svgcanvas/select";

export interface SVGCanvas extends Canvas,Utils{

}

export interface Canvas{

}


type Utils={
    contentW:number
    contentH:number
    undoMgr:History
    clearSelection:(noCall?:boolean)=>void
    setSvgString:(xmlString:string, preventUndo?:boolean)=>boolean
    stringToHTML:(str:string)=>ChildNode|null
    sanitizeSvg:(node:ChildNode)=>void
    setHref:(elem:Element,val:string)=>void
    getHref:(elem:Element)=>string
    setJustSelected:(elem:Element|null)=>void
    getJustSelected:()=>Element|null
    leaveContext:()=>void
    getZoom:()=>number
    setBBoxZoom:(val:BBoxType,w:number,h:number)=>void|boolean|BBoxZoomType
    updateCanvas:(w:number,h:number)=>CanvasInfoType
    clear:()=>void
    getSelectedElements:()=>ChildNode[]
    addToSelection:(elemsToAdd:ChildNode[],showGrips:boolean)=>void
    selectorManager:SelectorManager
    getNextId:()=>string
    createSVGElement:(json:addSVGElementsFromJson)=>Element
    addSvgString:(g:Element,svgContent:string)=>Element
    deleteSelectedElements:(func:(flag:boolean)=>void)=>void,
    getSvgContent:()=>Element
    svgToString:(svg:Element,indent:number)=>string
    svgCanvasToString:()=>string
    encode64:(svg:string)=>string
    moveToBottomSelectedElement:()=>void
    moveToBottom1StepSelectedElement:()=>void
    moveToTop1StepSelectedElement:()=>void
    moveToTopSelectedElement:()=>void
    setMobileBtnFunc:(func:()=>void)=>void
    setDeleteSVG:(func:()=>void)=>void
    setCloneSVG:(func:()=>void)=>void
    cloneSelectedElement:(x:number,y:number)=>Element
    moveSelectedElements:(x:number,y:number,undoable:boolean)=>void
}

interface addSVGElementsFromJson{
    element:string,
    attr:Record<string,string>
}

type CanvasInfoType={
    x:number,
    y:number,
    old_x:string,
    old_y:string,
    d_x:number,
    d_y:number
}


type History={
    resetUndoStack:()=>void
    getUndoStackSize:()=>number
    getRedoStackSize:()=>number
    lastHistory:()=> { newValues:{[key:string]:string},oldValues:{[key:string]:string} }
    lastHistoryRemove:()=>void
    undo:()=>void
    redo:()=>void
    addCommandToHistory:(cmd:Command)=>void
}

type BBoxZoomType={
    bbox:{
        width: number,
        height:number,
        x:number,
        y:number,
    },
    zoom:number
}

type BBoxType={
    width: number,
    height:number,
    x:number,
    y:number,
    zoom:number
}

export type Font = {
    fiSeq: number
    fontName: string
    fontThumbnailUrl: string
    fontUrl: string
}
export type TemplateItem = {
    templateResourceId: number
    cateSeq: number|null
    fileName: string
    templatePath: string
    templateJson: string
    templateThumbnailUrl: string
    templateUrl: string
    fontList: Font[]
}
export type TemplateData={
    nowPage: number
    pageSize: number
    totalCount: number
    items: TemplateItem[]
}

export type ImageItem={
    riSeq:number
    srcFileName:string
    url:string
}

export type ImageData={
    nowPage:number
    pageSize:number
    totalCount:number
    items:ImageItem[]
}

export type ShapeItem={
    rsiSeq:number
    srcFileName:string
    url:string
}

export type ShapeData={
    nowPage:number
    pageSize:number
    totalCount:number
    items:ShapeItem[]
}