/// <reference types="vite/client" />

// Vite define 注入的全局常量
declare const __DEV__: boolean;
declare const __VERSION__: string;

// 支持 import xxx from './file.yaml?raw'
declare module '*.yaml?raw' {
  const content: string;
  export default content;
}

declare module '*.yml?raw' {
  const content: string;
  export default content;
}
