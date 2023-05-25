// @ts-nocheck
import { createImmutable, getImmutableCopy, setHandler} from '../index'

// let obj = {
//     d: {
//       f: 2
//     }
//   }
// const state = {
//     a: {
//         b: [obj],
//         c: obj,
//         proxy: 1
//     },
// }
// const immer = createImmutable(state)
// const immer2 = createImmutable(state)
// // immer.a.b.push(123)
// // immer.a.c.d.f = 666
// immer2.a.b = 123
// immer.a.c = immer2.a
// const copy = getImmutableCopy(immer)
// console.log(state, copy)



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


// const immer = createImmutable(state, {
//   get(){
//     console.log('触发getter')
//   },
//   set(){
//     console.log('触发setter')
//   }
// })
// immer.a.b
// setHandler(immer, {
//   get(){
//     console.log('触发setHandle的给getter')
//   },
//   set(){
//     console.log('触发setHandle的setter')
//   }
// })
// immer.a = 1
// console.log(immer, getImmutableCopy(immer), state)


// console.time('create')
// const dataSource = Object.fromEntries(
//   [...Array(4000).keys()].map(key => [key, {key, data: {value: key}}])
// )
// console.log(dataSource)
// console.timeEnd('create')

// console.time('update');
// const proxy = createImmutable(dataSource)
// proxy[1000].data.value = 100;
// getImmutableCopy(proxy)
// console.timeEnd('update');



console.time('create')
const dataSource = Object.fromEntries(
  [...Array(4000).keys()].map(key => [key, {key, data: {value: key}}])
)
console.log(dataSource)
console.timeEnd('create')

console.time('update');
const proxy = createImmutable(dataSource)
for(let i = 0; i < 1000000; i++){
  proxy[1000].data.value = i;
}
getImmutableCopy(proxy)
console.timeEnd('update');