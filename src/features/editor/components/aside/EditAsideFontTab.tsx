import React, {useEffect, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import icons from "@/assets/icon/font.svg";
import {Input} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {useCanvasStore,useEditStore} from "@/features/editor/store";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";

import {Font} from "@/features/editor/const";
import ColorPicker from "@/features/editor/components/color-picker/ColorPicker.tsx";
import {ColorResult, RGBColor} from "react-color";
import {ScrollArea } from "@/components/ui/scroll-area.tsx";
import tinyColor from "tinycolor2"
import {useQuery} from "@tanstack/react-query";
import instance from "@/api";
import {fontLoad} from "@/features/editor/utils/fontUtils.ts";

const EditAsideFontTab=()=>{
    const {elem}=useEditStore()
    const {getCanvas,addHistory}=useCanvasStore()

    const [text,setText]=useState("")
    const [maxLength,setMaxLength]=useState(10)
    const [fontSize,setFontSize]=useState(10)
    const [family,setFamily]=useState("")
    const [color,setColor]=useState<RGBColor>({r:0,g:0,b:0,a:0})
    const [fonts,setFonts]=useState<Font[]>([])

    useQuery({
        queryKey:['fonts'],
        queryFn:()=>getFontList(),
    })

    const getFontList=async ()=>{
        const res=await instance.get(`/resource/resource-font/list`)
        const {data}=res
        const f:Font[]=data.items
        await fontLoad(f)
        setFonts(f)
        return fonts
    }


    useEffect(() => {
        if(elem){
            setText(elem.textContent??"")
            setAttribute(elem.attributes)
        }
    }, [elem]);

    const replaceAll=(reg:string,str:string):string=>{
        let text=str
        let flag=true
        while(flag){
            text=text.replace(reg,"")
            flag=text.indexOf(reg)!=-1
        }
        return text
    }
    const setAttribute=(attribute:NamedNodeMap)=>{
        const maxLengthValue=attribute.getNamedItem("max_length")
        if(maxLengthValue && isNaN(parseInt(maxLengthValue.value))){
            setMaxLength(parseInt(maxLengthValue.value))
        }
        const fontSizeValue = attribute.getNamedItem("font-size")
        if(fontSizeValue){
            setFontSize(parseInt(fontSizeValue.value))
        }
        const familyValue=attribute.getNamedItem("font-family")
        if(familyValue){
            setFamily(replaceAll("'",familyValue.value))
        }
        const colorValue=attribute.getNamedItem("fill")
        if(colorValue){
            const tinyc=tinyColor(colorValue.value)
            const {r,g,b,a}=tinyc.toRgb()
            const c={r,g,b,a}
            setColor(c)
        }
    }

    const changeColor=(color:ColorResult)=>{
        if(elem){
            const oldColor=elem.getAttribute("fill")
            let hex=color.hex
            if(color.rgb.a){
                const alpha = Math.round(color.rgb.a * 255);
                const hex8 = (alpha + 0x10000).toString(16).substr(-2).toUpperCase();
                hex=hex+hex8
            }
            elem.setAttribute("fill",hex)
            if(oldColor){
                addHistory({attribute:{'fill':oldColor},comment:'change font color'})
            }
            setColor(color.rgb)
        }
    }

    const changeFontSize=(size:number)=>{
        if(elem){
            const oldSize=elem.getAttribute("font-size")
            elem.setAttribute("font-size",`${size}`)
            setFontSize(size)
            if(oldSize){
                addHistory({attribute:{'font-size':oldSize},comment:'change font size'})
            }
            const canvas=getCanvas()
            if(canvas){
                canvas.addToSelection([elem],true)
            }
        }
    }

    const changeText=(str:string)=>{
        if(elem){
            const oldText=elem.textContent
            elem.textContent=str
            setText(str)
            if(oldText){
                addHistory({attribute:{'#text':oldText},comment:'change text content'})
            }
            const canvas=getCanvas()
            if(canvas){
                canvas.addToSelection([elem],true)
            }
        }
    }

    const changeFamliy=(fm:string)=>{
        if(elem&&fm){
            const oldFamliy=elem.getAttribute("font-family")
            const tempFamliy=`'${fm}'`
            elem.setAttribute("font-family",tempFamliy)
            setFamily(fm)
            if(oldFamliy){
                addHistory({attribute:{'font-family':oldFamliy},comment:'change font famliy'})
            }
            const canvas=getCanvas()
            if(canvas){
                canvas.addToSelection([elem],true)
            }
        }
    }




    return (
        <div className={'relative hidden flex-col items-start gap-8 md:flex'} x-chunk={'dashboard-03-chunk-0'}>
            <form className={'grid w-full items-start gap-6'} onSubmit={(e: React.FormEvent) => e.preventDefault()}>
                <Card className={'grid gap-6 rounded-lg border p-4'}>
                    <CardHeader>
                        <CardTitle>{'이미지 편집'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardTitle>
                            <Avatar className={'m-auto'}>
                                <AvatarImage src={icons}/>
                                <AvatarFallback>{'CN'}</AvatarFallback>
                            </Avatar>
                        </CardTitle>
                        <CardDescription className={'pt-5'}>
                            {'텍스트 폰트와 크기, 색상 등을 편집할 수 있습니다.'}
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className={'grid rounded-lg border h-[37.5rem]'}>
                    <ScrollArea className={"p-4"}>
                    <CardHeader>
                        <CardTitle>{'텍스트 내용'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex w-full max-w-screen-md items-center gap-3 border-b-1">
                            <Input type="text" value={text} maxLength={maxLength} onChange={e=>changeText(e.target.value)}/>
                            <Label className={"w-[50px] text-right"}>{text.length}/{maxLength}</Label>
                        </div>
                    </CardContent>
                    <CardHeader>
                        <CardTitle>{'폰트'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex w-full max-w-screen-md items-center gap-3">
                            <Select onValueChange={feild=>changeFamliy(feild)} defaultValue={family} value={family}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={family} />
                                </SelectTrigger>
                                <SelectContent>
                                    {fonts?.map((f,i) => (
                                        <SelectItem key={i}  value={f.fontName}>
                                            <img src={f.fontThumbnailUrl} className={'h-[1.75rem]'}/>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardHeader>
                        <CardTitle>{'텍스트 크기'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex w-full max-w-screen-md items-center gap-3 border-b-1">
                            <Input type="number" value={fontSize} onChange={e=>changeFontSize(parseInt(e.target.value))}/>
                            <Label className={"w-[50px] text-right"}>px</Label>
                        </div>
                    </CardContent>
                    <CardHeader>
                        <CardTitle>{'텍스트 색상'}</CardTitle>
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

export default EditAsideFontTab