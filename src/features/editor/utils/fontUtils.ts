import { Font } from '@/features/editor/const'

const checkFontLoaded = (fontFamily: string): boolean => {
  return (
    document.fonts.check(`16px '${fontFamily}'`) &&
    Array.from(document.fonts)
      .map(that => that.family)
      .includes(fontFamily)
  )
}

export async function fontLoad(fontList: Font[]) {
  const list = fontList
    .filter(it => !checkFontLoaded(it.fontName))
    .map(async ({ fontName: family, fontUrl: url }) => {
      const source = `url(${url})`
      return Promise.resolve(new window.FontFace(family, source))
    })
  //  로딩후 FontFaceSet에 추가
  await Promise.all(
    list.map(async promise => {
      const fontFace = await promise
      const font = await fontFace.load().catch(err => window?.console.error(err))
      if (!font) return Promise.reject('not loaded')
      window.document.fonts.add(font)
      return Promise.resolve(font)
    }),
  )
}
