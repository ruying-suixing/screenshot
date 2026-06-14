/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 补充 Vue JSX 全局类型
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elem: string]: any
    }
  }
}