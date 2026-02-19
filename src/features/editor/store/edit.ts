import {create} from 'zustand'

type TemplateSelectModeType='template'|'module'
interface EditState {
    elem:Element|null
    templateSelectMode:TemplateSelectModeType,
    isTemplateSelected:boolean,

    setElem:(e:Element|null)=>void
    getElem:()=>Element|null
    setTemplateSelectMode:(val:string)=>void
    setTemplateSelected:(val:boolean)=>void
}

const useEditStore = create<EditState>((set,get) => ({
    elem:null,
    templateSelectMode:"template",
    isTemplateSelected:false,

    setElem:(e:Element|null)=>{
        if(e!==null){
            set({templateSelectMode:"module"})
        }
        set({elem:e})
    },
    getElem:()=>{return get().elem},
    setTemplateSelectMode:(val:string)=>{
        const v=val as TemplateSelectModeType
        set({templateSelectMode:v})
    },
    setTemplateSelected:(val:boolean)=>{set({isTemplateSelected:val})}
}))

export default useEditStore