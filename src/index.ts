export * from './runtime-dom'

import { baseCompile } from './compiler-core'
import * as runtimeDom from './runtime-dom'
import { registerRuntimeCompiler } from './runtime-dom'

function compileToFunction(template) {
  const { code } = baseCompile(template)
  const render = new Function('Vue', code)(runtimeDom)
  console.log(render)
  return render
}

registerRuntimeCompiler(compileToFunction)
