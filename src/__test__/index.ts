// @ts-nocheck
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


// console.time('create')
// const dataSource = Object.fromEntries(
//   [...Array(4000).keys()].map(key => [key, {key, data: {value: key}}])
// )
// console.log(dataSource)
// console.timeEnd('create')

// console.time('update');
// const proxy = createImmutable(dataSource)
// proxy[1000].data.value = 100;
// finishImmutable(proxy)
// console.timeEnd('update');