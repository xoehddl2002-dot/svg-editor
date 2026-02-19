import {FC, useEffect, useState} from "react";
import {SketchPicker,  SketchPickerProps} from "react-color";

const SketchColorPicker:FC<SketchPickerProps>=({color,onChangeComplete})=>{
    const [isSketch,setIsSketch] =useState(false)

    const toggleSketch=(event:MouseEvent)=>{
        const  elem=event.target
        if(elem){
            const e=elem  as Element
            const sketchPocker=document.querySelector(".sketch-picker")
            if(sketchPocker){
                const elems=sketchPocker.querySelectorAll("*")
                let checked=true
                if(!e.id||!e.id.includes("toggleBtn-")||!e.id.includes("rc-editable-input-1")) {
                    Array.from(elems).some(se => {
                        if (checked) {
                            if (se == e) {
                                checked = false
                                return true
                            }
                        }
                    })
                }
                if(checked){
                    if(e.id&&(e.id.includes("toggleBtn-")||e.id.includes("rc-editable-input-1"))){
                        setIsSketch(true)
                    }else{
                        setIsSketch(false)
                    }
                }
            }else{
                if(e.id&&(e.id.includes("toggleBtn-")||e.id.includes("rc-editable-input-1"))){
                    setIsSketch(true)
                }else{
                    setIsSketch(false)
                }
            }

        }
    }


    useEffect(() => {
        window.addEventListener("click",toggleSketch)
        return ()=>{
            window.removeEventListener("click",toggleSketch)
        }
    }, [color,isSketch]);

    useEffect(() => {
        document.querySelectorAll(".twitter-picker >div >div").forEach((elem,index)=>{
            if(!elem.classList.contains("clear")){
                elem.setAttribute("id","toggleBtn-"+index)
            }
        })
    }, []);

    return isSketch? <SketchPicker presetColors={[]} color={color} onChangeComplete={onChangeComplete}/> : <></>
}

export default SketchColorPicker