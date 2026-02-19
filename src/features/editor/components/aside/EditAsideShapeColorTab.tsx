import React, {useEffect, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import icons from "@/assets/icon/color.svg";
import {useCanvasStore, useEditStore} from "@/features/editor/store";

import ColorPicker from "@/features/editor/components/color-picker/ColorPicker.tsx";
import {ColorResult, RGBColor} from "react-color";

import tinyColor from "tinycolor2"
import {ScrollArea} from "@/components/ui/scroll-area.tsx";


const EditAsideShapeColorTab=()=>{
    const {elem}=useEditStore()
    const {addHistory}=useCanvasStore()

    const [color,setColor]=useState<RGBColor>({r:0,g:0,b:0,a:0})


    useEffect(() => {
        if(elem){
            let e=elem
            if(e.nodeName==="g"){
                const shapeId=e.getAttribute("shapes_id")
                const shapes=e.querySelector(`*[shapes_id='${shapeId}']`)
                if(shapes){
                    e=shapes
                }
            }
            setAttribute(e.attributes)
        }
    }, [elem]);


    const setAttribute=(attribute:NamedNodeMap)=>{
        const colorValue=attribute.getNamedItem("fill")
        if(colorValue){
            const tinyc=tinyColor(colorValue.value)
            const {r,g,b,a}=tinyc.toRgb()
            const c={r,g,b,a}
            setColor(c)
        }
    }

    const changeColor=(c:ColorResult)=>{
        if(elem){
            let e=elem
            if(e.nodeName==="g"){
                const shapeId=e.getAttribute("shapes_id")
                const shapes=e.querySelector(`*[shapes_id='${shapeId}']`)
                if(shapes){
                    e=shapes
                }
            }
            if(e.nodeName!=="g"){
                let hex=c.hex
                const oldColor=e.getAttribute("fill")
                if(c.rgb.a){
                    const alpha = Math.round(c.rgb.a * 255);
                    const hex8 = (alpha + 0x10000).toString(16).substr(-2).toUpperCase();
                    hex=hex+hex8
                }
                e.setAttribute("fill",hex)
                if(oldColor){
                    addHistory({attribute:{'fill':oldColor},comment:'change shape color'})
                }
                setColor(c.rgb)
            }
        }
    }


    return (
        <div className={'relative hidden flex-col items-start gap-8 md:flex'} x-chunk={'dashboard-03-chunk-0'}>
            <form className={'grid w-full items-start gap-6'} onSubmit={(e: React.FormEvent) => e.preventDefault()}>
                <Card className={'grid gap-6 rounded-lg border p-4'}>
                    <CardHeader>
                        <CardTitle>{'도형 편집'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardTitle>
                            <Avatar className={'m-auto'}>
                                <AvatarImage src={icons}/>
                                <AvatarFallback>{'CN'}</AvatarFallback>
                            </Avatar>
                        </CardTitle>
                        <CardDescription className={'pt-5'}>
                            {'선택한 도형의 색상을 변경할 수 있습니다.'}
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className={'grid rounded-lg border h-[37.5rem]'}>
                    <ScrollArea className={'p-4'}>
                    <CardHeader>
                    </CardHeader>
                    <CardContent>
                        <ColorPicker onChangeComplete={(color)=>changeColor(color)} onSwatchHover={(color)=>changeColor(color)} color={color}/>
                    </CardContent>
                    </ScrollArea>
                </Card>

            </form>
        </div>
    )
}

export default EditAsideShapeColorTab