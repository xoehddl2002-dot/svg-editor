import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx'
import icons from '@/assets/icon/img.svg'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area.tsx'
import { useQuery } from '@tanstack/react-query'
import instance from '@/api'
import { ImageItem, ImageData } from '@/features/editor/const'
import { Button } from '@/components/ui/button.tsx'
import { ChevronDown } from 'lucide-react'
import { useCanvasStore, useEditStore } from '@/features/editor/store'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx'
import { getHref } from '@/features/editor/svgcanvas/utilities'

const EditAsideImageTab = () => {
  const { elem } = useEditStore()
  const { addHistory } = useCanvasStore()

  const [page, setPage] = useState(1)
  const [images, setImages] = useState<ImageItem[]>([])
  const [isNextPage, setIsNextPage] = useState(false)

  const categoryList = [
    {
      id: 1,
      name: '음식점',
      icon: 'restaurant.svg',
    },
    {
      id: 2,
      name: '병원',
      icon: 'hospital.svg',
    },
    {
      id: 3,
      name: '미용실',
      icon: 'hair.svg',
    },
    {
      id: 4,
      name: '카센터',
      icon: 'carcenter.svg',
    },
    {
      id: 5,
      name: '기타',
    },
  ]
  const [cateSeq, setCateSeq] = useState(categoryList[0].id)

  const getImageList = async (page: number, cateSeq: number) => {
    const res = await instance.get(`/resource/resource-image/list/${page}?cateSeq=${cateSeq}`)
    const imageData: ImageData = res.data
    setIsNextPage(imageData.totalCount <= imageData.pageSize * imageData.nowPage)
    const items: ImageItem[] = imageData.items
    setImages(images.concat(items))
    return images
  }

  useQuery({
    queryKey: ['images', [page, cateSeq]],
    queryFn: () => getImageList(page, cateSeq),
  })

  const nextPage = async () => {
    setPage(page + 1)
    await getImageList(page, cateSeq)
  }

  const changeCateSeq = (cateSeq: string) => {
    setPage(1)
    setImages([])
    setCateSeq(parseInt(cateSeq))
  }

  const onClickFunc = (it: ImageItem) => {
    if (elem) {
      let e = elem
      if (e.nodeName === 'g') {
        const imageId = e.getAttribute('image_id')
        const image = document.querySelector(`image[image_id='${imageId}']`)
        if (image) {
          e = image
        }
      }
      if (e.nodeName === 'image') {
        const oldHref = getHref(e)
        e.setAttribute('xlink:href', it.url)
        e.setAttribute('preserveAspectRatio', 'none')

        if (oldHref) {
          addHistory({ attribute: { '#href': oldHref, preserveAspectRatio: 'none' }, comment: 'change image href' })
        }
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
                <AvatarImage src={icons} />
                <AvatarFallback>{'CN'}</AvatarFallback>
              </Avatar>
            </CardTitle>
            <CardDescription className={'pt-5'}>{'템플릿에 사용된 사진을 변경할 수 있습니다.'}</CardDescription>
          </CardContent>
        </Card>

        <Card className={'grid rounded-lg border h-[37.5rem]'}>
          <ScrollArea className={'p-4'}>
            <CardHeader>
              <div className={'md:w-[20rem] xl:w-[36rem] pb-4'}>
                <ScrollArea>
                  <RadioGroup
                    className={'gap-4'}
                    defaultValue={`${cateSeq}`}
                    onValueChange={cateSeq => changeCateSeq(cateSeq)}
                  >
                    {categoryList?.map((c, i) => (
                      <RadioGroupItem value={`${c.id}`} key={`cate-${i}`} className={'rounded-3xl w-[8rem]'}>
                        {c.name}
                      </RadioGroupItem>
                    ))}
                  </RadioGroup>
                  <ScrollBar orientation={'horizontal'} />
                </ScrollArea>
              </div>
            </CardHeader>
            <CardContent>
              {images && images.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-4 p-4">
                    {images?.map((it, i) => (
                      <figure key={i} className="shrink-0">
                        <div className="rounded-md">
                          <img
                            src={it.url}
                            alt={`${it.srcFileName}`}
                            className="aspect-[1/1]  h-fit object-cover cursor-pointer"
                            onClick={() => onClickFunc(it)}
                          />
                        </div>
                        <figcaption className="pt-0.5 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{it.srcFileName}</span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                  <Button size="full" onClick={nextPage} disabled={isNextPage}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="flex flex-wrap pb-0 pt-4 pl-10">검색 결과가 없습니다.</div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </form>
    </div>
  )
}

export default EditAsideImageTab
