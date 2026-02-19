import {Button} from "@/components/ui/button.tsx";
import {Type, ImagePlus} from "lucide-react";
import {useCanvasStore, useEditStore} from "@/features/editor/store";
const AddSVG=()=>{

    const {addText,addImage}=useCanvasStore()
    const {setElem}=useEditStore()

    const onClickAddText=()=>{
        const text=addText()
        if(text){
            setElem(text)
        }
    }

    const onClickAddImage=async ()=>{
        const image=await addImage()
        if(image){
            setElem(image)
        }
    }

    return (
        <div>
            <Button variant={"outline"} onClick={onClickAddText}><Type /></Button>
            <Button variant={"outline"} onClick={onClickAddImage}><ImagePlus /></Button>
        </div>
    )
}

export default AddSVG