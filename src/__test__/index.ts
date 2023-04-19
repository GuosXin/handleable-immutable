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

immer.a.b.push(123)
immer.a.c = immer

console.log(immer, finishImmutable(immer), state)