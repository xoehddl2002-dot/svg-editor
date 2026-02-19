import {Button} from "@/components/ui/button.tsx";
import {useCanvasStore} from "@/features/editor/store";
import {useEffect, useState} from "react";
import {ZoomIn,ZoomOut} from "lucide-react";


const Zoom=()=>{
    const {getZoom,setZoom,zoomChange}=useCanvasStore()
    const zoom=getZoom()
    const [currentZoom,setCurrentZoom]=useState(zoom)

    const zoomPlus=()=>{
        let zoomValue=currentZoom+10
        if(zoomValue>160){
            zoomValue=160
        }
        setCurrentZoom(zoomValue)
    }

    const zoomMinus=()=>{
        let zoomValue=currentZoom-10
        if(zoomValue<20){
            zoomValue=20
        }
        setCurrentZoom(zoomValue)
    }

    useEffect(() => {
        setZoom(currentZoom)
        zoomChange()
    }, [currentZoom]);

    useEffect(() => {
        const z=getZoom()
        setCurrentZoom(z)
    }, [zoom]);

    return (<div style={{'backgroundColor':'#fff',width:'11rem'}}>
        <Button variant={'outline'} onClick={zoomPlus}><ZoomIn /></Button>
        <Button variant={'outline'} onClick={zoomMinus}><ZoomOut /></Button>
        <span className={'ml-3 align-super'}>{currentZoom}%</span>
    </div>)
}

export default Zoom