import axios from 'axios'
import {checkNetworkErrorRequestInterceptor} from "@/api/interceptors.ts";

//  axios 인스턴스 생성
const instance = axios.create({
    withCredentials: true,
})

checkNetworkErrorRequestInterceptor(instance)

export default instance