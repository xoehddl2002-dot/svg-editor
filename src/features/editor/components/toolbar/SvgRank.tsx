import {Button} from "@/components/ui/button.tsx";
import {ChevronFirst,ChevronLeft,ChevronRight,ChevronLast} from 'lucide-react'
import {useCanvasStore} from "@/features/editor/store";

const SvgRank=()=>{

    const {svgCanvas:canvas}=useCanvasStore()
    const firstChild=()=>{
        if(canvas){
            canvas.moveToBottomSelectedElement()
        }
    }

    const prevChild=()=>{
        if(canvas){
            canvas.moveToBottom1StepSelectedElement()
        }
    }

    const nextChild=()=>{
        if(canvas){
            canvas.moveToTop1StepSelectedElement()
        }
    }

    const lastChild=()=>{
        if(canvas){
            canvas.moveToTopSelectedElement()
        }
    }

    return (
        <div>
            <Button variant={"outline"} className={'w-28 justify-start'} onClick={lastChild}>
                <ChevronFirst/>
                <span>맨 앞으로</span>
            </Button>
            <br/>
            <Button variant={"outline"} className={'w-28 justify-start'} onClick={nextChild}>
                <ChevronLeft/>
                <span>앞으로</span>
            </Button>
            <br/>
            <Button variant={"outline"} className={'w-28 justify-start'} onClick={prevChild}>
                <ChevronRight/>
                <span>뒤로</span>
            </Button>
            <br/>
            <Button variant={"outline"} className={'w-28 justify-start'} onClick={firstChild}>
                <ChevronLast/>
                <span>맨 뒤로</span>
            </Button>
        </div>
    )
}


export default SvgRank