import { createImmutable, finishImmutable} from '../index'

let obj = {
    d: {
      f: 2
    }
  }
const state = {
    a: {
        b: [obj],
        c: obj
    }
}
const immer = createImmutable(state)
let t = immer.a.b
immer.a.c = t

console.log(immer, finishImmutable(immer), state)

t[0].d = 123