import UndoRedo from "@/features/editor/components/toolbar/UndoRedo.tsx";
import Zoom from "@/features/editor/components/toolbar/Zoom.tsx";
import SvgRank from "@/features/editor/components/toolbar/SvgRank.tsx";
import {useCanvasStore, useEditStore} from "@/features/editor/store";
import AddSVG from "@/features/editor/components/toolbar/AddSVG.tsx";


const ToolbarWrapper=()=>{
    const {clientWidth,clientHeight}=useCanvasStore()
    const {elem}=useEditStore()

    return (
        <div className='absolute' style={{width: clientWidth, height: clientHeight, pointerEvents: "none"}}>
            <div className={'absolute top-6 left-6'} style={{pointerEvents: 'all'}}>
                <Zoom/>
            </div>
            <div className={'absolute top-6 right-6'} style={{pointerEvents: 'all'}}>
                <AddSVG />
            </div>
            {elem ?
                <div className={`absolute bottom-20 left-6`} style={{pointerEvents: 'all'}}>
                    <SvgRank/>
                </div>
                :<></>
            }
            <div className={`absolute bottom-6 left-6`} style={{pointerEvents: 'all'}}>
                <UndoRedo/>
            </div>
        </div>
    )
}

export default ToolbarWrapper