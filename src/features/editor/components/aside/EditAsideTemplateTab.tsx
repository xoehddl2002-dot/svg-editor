import React, { useState} from 'react'
import {useCanvasStore,useEditStore} from "@/features/editor/store";
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area.tsx'
import { Button } from "@/components/ui/button.tsx"
import icons from "@/assets/icon/icon.svg";

import {useQuery} from "@tanstack/react-query";
import instance from "@/api";
import {TemplateItem,TemplateData} from "@/features/editor/const";

const EditAsideTemplateTab = () => {
  const { loadSVG } = useCanvasStore()
  const {setTemplateSelectMode,setTemplateSelected}=useEditStore()
  const [page,setPage]=useState(1)
  const [templates,setTemplates]=useState<TemplateItem[]>([])
  const [isNextPage,setIsNextPage]=useState(false)

  const getTemplateList=async (page:number)=>{
    const res=await instance.get(`/template/template-resource/list/${page}`)
    const templateData:TemplateData=res.data
    setIsNextPage(templateData.totalCount<=(templateData.pageSize*templateData.nowPage))
    const items:TemplateItem[]=templateData.items
    setTemplates(templates.concat(items))
    return templates
  }
  useQuery({
    queryKey:['templates',page],
    queryFn:()=>getTemplateList(page),
  })

  const nextPage=async ()=>{
    setPage(page+1)
    await getTemplateList(page)
  }

  const onClickFunc=async (ti:TemplateItem)=>{
    setTemplateSelected(true)
    loadSVG(ti)
    setTemplateSelectMode("module")
  }

  return (
    <div className={'relative hidden flex-col items-start gap-8 md:flex'} x-chunk={'dashboard-03-chunk-0'}>
      <form className={'grid w-full items-start gap-6'} onSubmit={(e: React.FormEvent) => e.preventDefault()}>
        <Card className={'grid gap-6 rounded-lg border p-4'}>
          <CardHeader>
            <CardTitle>{'템플릿 선택'}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardTitle>
              <Avatar className={'m-auto'}>
                <AvatarImage src={icons} />
                <AvatarFallback>{'CN'}</AvatarFallback>
              </Avatar>
            </CardTitle>
            <CardDescription className={'pt-5'}>
              {'스타일을 선택하여 나만의 템플릿을 제작할 수 있습니다.'}
            </CardDescription>
          </CardContent>
        </Card>
        <Card className={'grid gap-6 rounded-lg border h-[37.5rem]'}>
          <ScrollArea className={"p-4"}>
          <CardHeader>
            <CardTitle>{'템플릿 내용'}</CardTitle>
            <CardDescription>{'사용할 이미지 스타일을 선택할 수 있습니다.'}</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-3 gap-4 p-4">
                {templates?.map((ti,i) => (
                  <figure key={i} className="shrink-0">
                    <div className="rounded-md">
                      <img
                        src={ti.templateThumbnailUrl}
                        alt={`${ti.fileName}`}
                        className="aspect-[348/819] h-fit object-cover cursor-pointer"
                        onClick={()=>onClickFunc(ti)}
                      />
                    </div>
                    <figcaption className="pt-0.5 text-xs text-muted-foreground pb-3">
                      <span className="font-semibold text-foreground">{ti.fileName}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            <Button size="full" onClick={nextPage} disabled={isNextPage}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CardContent>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </Card>
      </form>
    </div>
  )
}

export default EditAsideTemplateTab
