import Editor from '@/features/editor'

function App() {
  return (
    <>
      <div id={'root'}>
        <div className={'grid h-screen w-full'}>
          <div className={'flex flex-col'}>
            <Editor />
          </div>
        </div>
      </div>
    </>
  )
}

export default App
