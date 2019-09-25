<div align="center">
  <a href="https://umijs.org/">
    <h1>UmiJS</h1>
  </a>
</div>

# umi-pre-render

umi 预渲染插件

## Getting Started

To begin, you'll need to install `umi-pre-render`:

```console
$ npm install umi-pre-render --save-dev
```

## Work

```typescript
export default [
  ['umi-pre-render',
    {
      exclude:? string[]
      disablePolyfill:? boolean
      visible:? boolean
      //{ g_lang: 'zh-CN' } => global.window.g_lang / global.g_lang
      runInMockContext:? {}
      // use renderToStaticMarkup
      staticMarkup:? boolean
      // htmlSuffix
      htmlSuffix:? boolean
      // checkSum, default: false
      checkSum:? boolean
      // render执行完后，对生成的html再次修改
      postProcessHtml:? ($, path) => CheerioStatic,
      // 替换默认的render函数，
      diyRender:? (
        ReactDOMServer,
        htmlElement,
        _getDocumentHandler
      ) => Promise<string>
    }
  ]
]
```
