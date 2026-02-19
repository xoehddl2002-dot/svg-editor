import { Share } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {useCanvasStore, useEditStore} from "@/features/editor/store";
import {InputWithoutMeta, downloadZip} from "client-zip";

const TopMenu = () => {
    const {saveAll}=useCanvasStore()
    const {isTemplateSelected}=useEditStore()
    const onClickEvent=async ()=>{
        if(!isTemplateSelected){
            alert("템플릿 선택해주세요")
            return
        }
        const data=await saveAll()
        if(data){


            const files:InputWithoutMeta[]=[]
            files.push({input:data.svgFile.stream(),name:'svgFile.svg'})
            files.push({input:data.jsonFile.stream(),name:'jsonFile.json'})
            files.push({input:data.pngFile1280.stream(),name:'png1280.png'})
            files.push({input:data.pngFile1920.stream(),name:'png1920.png'})
            const blob=await downloadZip(files).blob()


            // 2. 임시 <a> 요소 생성
            const element = document.createElement('a');
            // 4. 생성한 파일의 URL을 <a> 요소 href 값으로 지정
            element.href = URL.createObjectURL(blob);
            // 5. 생성한 파일의 이름을 <a> 요소 download 값에 지정
            element.download = "test.zip";
            // 6. <a> 요소를 DOM 트리에 삽입
            document.body.appendChild(element);

            // 7. <a> 요소 클릭 처리
            element.click();

            // 8. DOM 트리에서 <a> 요소 제거
            element.remove();
        }

    }
    return (
        <header className={'sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4'}>
            <h1 className={'text-xl font-semibold'}>{'EDIT'}</h1>
            <Button variant={'outline'} size={'sm'} className={'ml-auto gap-1.5 text-sm'} onClick={onClickEvent}>
                <Share className={'size-3.5'} />
                {'저장'}
            </Button>
        </header>
    )
}

export default TopMenu
