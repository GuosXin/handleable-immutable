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
        c: obj,
        proxy: 1
    },
}
const immer = createImmutable(state)
// let t = immer.a.b
// immer.a.c = t

// let t = immer.a.b
// t[0].d = 123

// immer.a.b.push(123)
// immer.a.b = 123
// immer.a.c = immer

// console.log(immer, finishImmutable(immer), state)
// let t = immer.a
// console.log(immer, immer.proxy, immer.a.b, t.base, immer.isImmutable)
immer.a.b.push(123)
console.log(immer, immer.a.proxy, immer.a.b)



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