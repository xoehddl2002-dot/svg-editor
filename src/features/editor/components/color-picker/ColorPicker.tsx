import {FC} from "react";
import {TwitterPicker, TwitterPickerProps,AlphaPicker} from "react-color";
import SketchColorPicker from "@/features/editor/components/color-picker/SketchColorPicker.tsx";
import "./ColorPicker.css"

const ColorPicker:FC<TwitterPickerProps>=({onChangeComplete,color})=>{
    const colors= ['#000000', '#595959', '#787878', '#9E9E9E', '#C2C2C2', '#EEEEEE', '#FFFFFF', '#FECCBE', '#FEEBB6', '#DDECCA', '#B8E6E1', '#B8E9FF', '#CCD2F0', '#E0BFE6', '#FD8A69', '#FFCD4A', '#AFD485', '#82CBC4', '#58CCFF', '#9FA9D8', '#B96BC6', '#FC5230', '#FD9F28', '#7DB249', '#2FA599', '#18A8F1', '#5D6DBE', '#9A30AE', '#D94925', '#FD6F22', '#568A35', '#12887A', '#1187CF', '#3A4CA8', '#692498']

    return (
        <div style={{position:"relative"}}>
        <AlphaPicker color={color} onChangeComplete={onChangeComplete}/>
        <TwitterPicker width={"550"} triangle={"hide"} className={"w-full"} colors={colors} color={color} onChangeComplete={onChangeComplete}/>
            <SketchColorPicker color={color} onChangeComplete={onChangeComplete} />
        </div>
    )
}

export default ColorPicker