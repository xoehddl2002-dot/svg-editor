import React, { useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import icons from "@/assets/icon/img.svg";

import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area.tsx";
import {useQuery} from "@tanstack/react-query";
import instance from "@/api";
import {ShapeData, ShapeItem} from "@/features/editor/const";
import {Button} from "@/components/ui/button.tsx";
import {ChevronDown} from "lucide-react";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group.tsx";
import {useCanvasStore} from "@/features/editor/store";


const EditAsideImageTab=()=>{

    const {addSVG}=useCanvasStore()
    const [page,setPage]=useState(1)
    const [shapes,setShapes]=useState<ShapeItem[]>([])
    const [isNextPage,setIsNextPage]=useState(false)

    const categoryList=[
        {
            "id": "L",
            "name": "선",
        },
        {
            "id": "P",
            "name": "면",
        },
        {
            "id": "I",
            "name": "아이콘",
        }]
    const [shapeType,setShapeType]=useState(categoryList[0].id)

    const getShapeList=async (page:number,shapeType:string)=>{
        const res=await instance.get(`/resource/resource-shape/list/${page}?shapeType=${shapeType}`)
        const shapeData:ShapeData=res.data
        setIsNextPage(shapeData.totalCount<=(shapeData.pageSize*shapeData.nowPage))
        const items:ShapeItem[]=shapeData.items
        setShapes(shapes.concat(items))
        return shapes
    }

    useQuery({
        queryKey:['shapes',[page,shapeType]],
        queryFn:()=>getShapeList(page,shapeType),
    })

    const nextPage=async ()=>{
        setPage(page+1)
        await getShapeList(page,shapeType)
    }

    const changeShapeType=(shapeType:string)=>{
        setPage(1)
        setShapes([])
        setShapeType(shapeType)
    }

    const onClickFunc=async (si:ShapeItem)=>{
        const res=await instance.get(si.url)
        const isShape=shapeType!=='I'

        addSVG(res.data,isShape,si.rsiSeq)
    }


    return (
        <div className={'relative hidden flex-col items-start gap-8 md:flex'} x-chunk={'dashboard-03-chunk-0'}>
            <form className={'grid w-full items-start gap-6'} onSubmit={(e: React.FormEvent) => e.preventDefault()}>
                <Card className={'grid gap-6 rounded-lg border p-4'}>
                    <CardHeader>
                        <CardTitle>{'도형 추가'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardTitle>
                            <Avatar className={'m-auto'}>
                                <AvatarImage src={icons}/>
                                <AvatarFallback>{'CN'}</AvatarFallback>
                            </Avatar>
                        </CardTitle>
                        <CardDescription className={'pt-5'}>
                            {'템플릿에 다양한 도형과 아이콘을 추가할 수 있습니다.'}
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className={'grid rounded-lg border h-[37.5rem]'}>
                    <ScrollArea className={'p-4'}>
                        <CardHeader>
                            <div className={'md:w-[20rem] xl:w-full pb-4'}>
                            <ScrollArea>
                                <RadioGroup  className={"gap-4"} defaultValue={shapeType} onValueChange={shapeType=>changeShapeType(shapeType)}>
                                    {categoryList?.map((c,i)=>
                                        <RadioGroupItem key={`cate-${i}`}  value={`${c.id}`} className={"rounded-3xl w-[8rem]"}>{c.name}</RadioGroupItem>
                                    )}
                                </RadioGroup>
                                <ScrollBar orientation={"horizontal"}/>
                            </ScrollArea>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {shapes&&shapes.length>0?
                                <>
                                    <div className="grid grid-cols-3 gap-4 p-4">
                                        {shapes?.map((si, i) => (
                                            <figure key={i} className="shrink-0">
                                                <div className="rounded-md">
                                                    <img
                                                        src={si.url}
                                                        alt={`${si.srcFileName}`}
                                                        className="aspect-[1/1]  cursor-pointer w-full"
                                                        onClick={()=>onClickFunc(si)}
                                                    />
                                                </div>
                                                <figcaption className="pt-0.5 text-xs text-muted-foreground">
                                                    <span
                                                        className="font-semibold text-foreground">{si.srcFileName}</span>
                                                </figcaption>
                                            </figure>
                                        ))}
                                    </div>
                                    <Button size="full" onClick={nextPage} disabled={isNextPage}>
                                        <ChevronDown className="h-4 w-4"/>
                                    </Button>
                                </>
                                :
                                <div className="flex flex-wrap pb-0 pt-4 pl-10">
                                    검색 결과가 없습니다.
                                </div>
                            }
                        </CardContent>
                    </ScrollArea>
                </Card>
            </form>
        </div>
    )
}

export default EditAsideImageTab