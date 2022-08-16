---
title: Next에서 Alias 적용하기
tags:
  - 프론트엔드
date: 2019-05-15 11:17:29
draft: true
info: false
---

next.js에서 alias를 적용하려면 여러군데에 적용해야하는데, 이게 좀 복잡하다.

1. next.config.js에 추가

   ```javascript {numberLines}
   ...
   webpack(config, options) {
     config.resolve = {
       alias: {
         '@src': path.join(__dirname, 'src'),
         '@components': path.join(__dirname, 'src', 'components'),
         '@containers': path.join(__dirname, 'src', 'containers'),
         '@store': path.join(__dirname, 'src', 'store'),
         '@interface': path.join(__dirname, 'src', '@types/interface.ts')
       },
       ...config.resolve
     }

     // config.resolve.alias['@src'] = path.join(__dirname, 'src')
     // config.resolve.alias['@components'] = path.join(__dirname, 'src', 'components')
     // config.resolve.alias['@interface'] = path.join(__dirname, 'src', '@types/interface.ts')
     // config.resolve.extensions = ['js', 'ts', 'tsx']
     return config
   }
   ```

   이렇게 webpack - config.resolve.alias 설정을 해준다. 아래처럼 단일로 지정하면 이전의 다른 설정값이 날라가서 저장이 되지 않는다.

2. .babelrc 추가

   ```javascript {numberLines}
   "plugins": [
     ...
     ["module-resolver", {
       "root": ["./src"],
       "alias": {
         "@src": "./src",
         "@components": "./src/components",
         "@interface": "./src/@types/interface.ts"
       }
     }],
     ...
   ]
   ```

   babelrc 설정에 추가해서 webpack compile시에 alias path를 알 수 있도록 설정한다.

3. TypeScript를 사용한다면 tsconfig에도 지정해준다.

   ```javascript {numberLines}
   {
     "compilerOptions": {
       ...
       "paths": {
         "@src/*": ["src/*"],
         "@components/*": ["src/components/*"],
         "@interface": ["src/@types/interface"],
       },
       ...
     }
   }
   ```

   compilerOptions ⇒ paths에 추가해준다. 이렇게 해주는 이유는 TypeScript → JavaScript로 transfiling 될 때 제대로 트랜스파일링 해주기 위함이다.
