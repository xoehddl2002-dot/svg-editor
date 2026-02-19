import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { worker } from '@/mocks/server.ts'

if (import.meta.env.VITE_ENABLE_MOCK) {
  await new Promise<void>(resolve =>
    worker
      .start({
        onUnhandledRequest(request, print) {
          // Ignore any requests containing "cdn.com" in their URL.
          if (request.url.includes('src/') || request.url.includes('/')) {
            return
          }

          // Otherwise, print an unhandled request warning.
          print.warning()
        },
      })
      .then(() => {
        resolve()
      }),
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
