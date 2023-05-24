# 支持拦截操作的不可变数据

## 函数介绍

* ### createImmutable(base: any, handler?: ImmutableHandler, parent?: Parent)

创建不可变代理对象，非引用类型数据会直接返回原数据，如下所示：

```
const obj = {
    age: 26,
    friends: [Tony, July]
}
const draft = createImmutable(obj, {
    get(t, p, r){
        console.log('trigger getter')
    },
    set(t, p, v, r){
        console.log('trigger setter')
    }
})
```

* ### getImmutableCopy(draft: any)

解包不可变代理对象，获取拷贝数据，如下所示：

```
const obj = {
    a: [0, 1]
}
const draft = createImmutable(obj)
draft.a.push(3)
const copy = getImmutableCopy(draft)
console.log(copy)
// expects: { a: [1, 2, 3] }
```

* ### setHandler(draft: any)

动态注入getter、setter，会替换初始化时的getter、setter，用法如下：

```
const obj = {
    a: [0, 1]
}
const draft = createImmutable(obj, {
    set(t, p, v, r){
        console.log('init setter')
    }
})
setHandler(draft, {
    set(t, p, v, r){
        console.log('reset setter')
    }
})
obj.a = 1   // expects: reset setter
```