import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import {useEditStore} from "@/features/editor/store"

import EditAsideTemplateTab from "@/features/editor/components/aside/EditAsideTemplateTab.tsx";
import EditAsideFontTab from "@/features/editor/components/aside/EditAsideFontTab.tsx";
import EditAsideShapeColorTab from "@/features/editor/components/aside/EditAsideShapeColorTab.tsx";
import EditAsideImageTab from "@/features/editor/components/aside/EditAsideImageTab.tsx";
import EditAsideAddShapeTab from "@/features/editor/components/aside/EditAsideAddShapeTab.tsx";
import {useEffect, useState} from "react";
import {ToggleGroup, ToggleGroupItem} from "@/components/ui/toggle-group.tsx";


const EditAsideTab=()=>{
    const {elem,templateSelectMode,setTemplateSelectMode,isTemplateSelected}=useEditStore()
    const [tab,setTab]=useState(<EditAsideTemplateTab />)


    useEffect(() => {
        if(templateSelectMode==="template"){
            setTab(<EditAsideTemplateTab/>);
        }else{
            if(elem){
                switch (true){
                    case elem.getAttribute("attr_rock")==="true":
                        setTab(<EditAsideAddShapeTab/>);
                        break
                    case elem.nodeName==="text":
                        setTab(<EditAsideFontTab />);
                        break
                    case elem.hasAttribute("shapes_id"):
                    case elem.hasAttribute("add_svg"):
                        setTab(<EditAsideShapeColorTab/>);
                        break
                    case elem.hasAttribute("image_id"):
                        setTab(<EditAsideImageTab />)
                        break
                    default:
                        setTab(<EditAsideAddShapeTab/>);
                }
            }else{
                if(isTemplateSelected){
                    setTab(<EditAsideAddShapeTab/>);
                }else{
                    setTemplateSelectMode("template")
                    setTab(<EditAsideTemplateTab/>);
                }

            }
        }

    }, [elem,templateSelectMode]);

    const onClickFunc=(val:string)=>{

        setTemplateSelectMode(val)
    }
    const queryClient=new QueryClient()
    return (<QueryClientProvider client={queryClient}>
            <div>
                <ToggleGroup type={"single"} variant={"outline"} className={"gap-4 mb-3"} value={templateSelectMode} defaultValue={templateSelectMode} onValueChange={val=>onClickFunc(val)}>
                    <ToggleGroupItem value={'template'} className={'w-[50%] h-14'} size={"lg"} >템플릿 선택</ToggleGroupItem>
                    <ToggleGroupItem value={'module'} className={'w-[50%] h-14'} size={"lg"}>도구</ToggleGroupItem>
                </ToggleGroup>
                {tab}
            </div>
        </QueryClientProvider>
        )
}

export default EditAsideTab