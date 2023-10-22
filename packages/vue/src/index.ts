export * from '@xuans-mini-vue/runtime-dom'

import { baseCompile } from '@xuans-mini-vue/compiler-core'
import * as runtimeDom from '@xuans-mini-vue/runtime-dom'

import { registerRuntimeCompiler } from '@xuans-mini-vue/runtime-dom'

function compileToFunction(template) {
  const { code } = baseCompile(template)
  const render = new Function('Vue', code)(runtimeDom)
  console.log(render)
  return render
}

registerRuntimeCompiler(compileToFunction)
