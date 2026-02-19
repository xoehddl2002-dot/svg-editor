import axios, {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'


export const checkErrorOnAxiosRequest = (error:AxiosError | Error) => {

    if(axios.isAxiosError(error)){
        const {message}=error
        const {method,url}=error.config as AxiosRequestConfig
        const {status,statusText}=error.response as AxiosResponse

        console.log(` ${method?.toLocaleLowerCase} ${url} | Error ${status} ${statusText} | ${message}`)

        switch (status){
            case 401:
                //(로그인 및 권한)
                break
            case 403:
                //접근 권한 없음
                break
            case 404:
                //잘못된 요청
                break
            case  500:
                //서버 문제
                break
            default:
                //알수 없는 문제
                break
        }
    }else{
        console.log(`${error.message}`)
    }
    return Promise.reject(error)
}

export const checkNetworkErrorRequestInterceptor=(instance:AxiosInstance)=>{
    instance.interceptors.request.use(config => {
        //error 초리
        return config
    }, checkErrorOnAxiosRequest)

}