import { bypass, http, HttpResponse } from 'msw'
const moduleGlob=import.meta.glob('@/mocks/api/static/**/*.*',{eager:true,import:'default'})
async function getModule(path:string,ext:string){
    const fullPath=`/src/mocks/api/static/${path}.${ext}`
    const module=moduleGlob[fullPath]
    if(module){
        if(ext.startsWith("json")){
            return HttpResponse.json(JSON.stringify(module))
        }else{
            const data = await fetch(bypass(module.toString()))

            return new HttpResponse(await data.blob())
        }

    }else{
        return new HttpResponse(null, {status:404})
    }
}
export const staticHandlers = [
    http.get(`/font/*.*`, async ({ params }) => {
       return await getModule(`font/${params[0]}`,`${params[1]}`)
    }),
    http.get(`/picture/**/*.*`, async ({ params }) => {
        return await getModule(`picture/${params[0]}/${params[1]}`,`${params[2]}`)
    }),
    http.get(`/picture_m/**/*.*`, async ({ params }) => {
        return await getModule(`picture_m/${params[0]}/${params[1]}`,`${params[2]}`)
    }),
    http.get(`/template/**/*.*`, async ({ params }) => {
      return await getModule(`template/${params[0]}/${params[1]}`,`${params[2]}`)
    }),
    http.get(`/shape/**/*.*`, async ({ params }) => {
        return await getModule(`shape/${params[0]}/${params[1]}`,`${params[2]}`)
    }),
]
