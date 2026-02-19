import { http, HttpResponse } from 'msw'
import { templateList,fontList,imageList,svgList } from './api/serviceData'

export const serviceHandlers = [
  http.get(`/template/template-resource/list/:page`, ({ params }) => {
    // 요청 경로, 메서드
    const { page } = params
    const p = page[0]
    return HttpResponse.json(templateList[parseInt(p, 10) - 1])
  }),
  http.get(`/resource/resource-font/list`, () => {
    return HttpResponse.json(fontList)
  }),
  http.get(`/resource/resource-image/list/:page`, ({ params,request }) => {
    // 요청 경로, 메서드
    const { page } = params
    const p = page[0]
    const c=new URL(request.url).searchParams.get("cateSeq")
    if(c){
      const indexImage=imageList[parseInt(c,10)]
      return HttpResponse.json(indexImage[parseInt(p, 10) - 1])
    }else{
      return HttpResponse.error()
    }


  }),
  http.get(`/resource/resource-shape/list/:page`, ({ params,request }) => {
    // 요청 경로, 메서드
    const { page } = params
    const p = page[0]
    const s=new URL(request.url).searchParams.get("shapeType")
    if(s){
      const indexImage=svgList[s]
      return HttpResponse.json(indexImage[parseInt(p, 10) - 1])
    }else{
      return HttpResponse.error()
    }


  }),
]
