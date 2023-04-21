// @ts-nocheck
import { createImmutable, getClone} from '../index'

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
// const immer = createImmutable(state)
// let t = immer.a.b
// immer.a.c = t

// let t = immer.a.b
// t[0].d = 123

// immer.a.b.push(123)
// immer.a.b = 123
// immer.a.c = immer.a.b

// console.log(immer, getClone(immer), state)
// let t = immer.a
// console.log(immer, immer.proxy, immer.a.b, t.base, immer.isImmutable)
// immer.a.b[0].d = {h:123}
// immer.a.b = 123
// console.log(immer, immer.a.proxy, immer.a.b)


const immer = createImmutable(state, {
  set(){
    console.log('触发setter')
  }
})
let t = immer.a.b
t.d = 123
console.log(immer, getClone(immer), state)

// console.time('create')
// const dataSource = Object.fromEntries(
//   [...Array(4000).keys()].map(key => [key, {key, data: {value: key}}])
// )
// console.log(dataSource)
// console.timeEnd('create')

// console.time('update');
// const proxy = createImmutable(dataSource)
// proxy[1000].data.value = 100;
// getClone(proxy)
// console.timeEnd('update');