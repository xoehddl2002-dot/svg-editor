import {Button} from "@/components/ui/button.tsx";
import {useCanvasStore, useEditStore} from "@/features/editor/store";
import {Redo2,Undo2} from "lucide-react";

const UndoRedo=()=>{
    const {clickUndo,clickRedo}=useCanvasStore()
    const {setElem}=useEditStore()
    const onClickUndo=()=>{
        clickUndo()
        setElem(null)
    }
    const onClickRedo=()=>{
        clickRedo()
        setElem(null)
    }
    return (<div>
        <Button variant={"outline"} onClick={onClickRedo}><Undo2 /></Button>
        <Button variant={"outline"} onClick={onClickUndo}><Redo2 /></Button>
    </div>)
}

export default UndoRedo