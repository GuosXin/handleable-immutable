const ISIMMUTABLE = Symbol('isImmutable')
const BASE = Symbol('base')
const COPY = Symbol('copy')
const PARENT = Symbol('parent')
const PROP = Symbol('prop')
const REVOKE = Symbol('revoke')
const HANDLER = Symbol('handler')
const SETLOG = Symbol('setLog')

/**
 * 判断是否需要进行拷贝
 * @param {*} value 
 * @returns 
 */
function isNeedToCopy(value: any){
    let baseType = [undefined, 'boolean', 'number', 'bigint', 'string', 'symbol', 'function']
    let referenceType = ['object']
    let type = typeof value
    if(value === null) return false
    if(value[ISIMMUTABLE]) return false
    if(baseType.includes(type)) return false
    if(referenceType.includes(type)) return true
}

/**
 * 浅拷贝
 * @param {*} value 
 * @returns 
 */
function shallowCopy(value: any){
    let type = Object.prototype.toString.call(value).slice(8, -1)
    if(type === "Array") return [...value]
    if(type === "Object") return {...value}
    if(type === "Date") return new Date(value)
    if(type === "RegExp") return new RegExp(value)
    return value
}

/**
 * 创建不可变数据
 * @param {*} base 
 * @param {*} handler 
 * @returns 
 */
export type ImmutableHandler = {
    get?: (target: any, p: string | symbol, receiver: any) => void
    set?: (target: any, p: string | symbol, newValue: any, receiver: any) => void
}
export type Parent = {
    receiver: any
    prop: any
}
export type CreateImmutable = (base: any, handler?: ImmutableHandler, parent?: Parent) => any
export type SetLogType = {
    receiver: any,
    prop: string | symbol,
    newValue: any
}
export let createImmutable: CreateImmutable = function(base, handler = { set: () => {}, get: () => {} }, parent = { receiver: null, prop: null }){
    if(!isNeedToCopy(base)){
        return base
    }
    const copy = shallowCopy(base)
    const immutable = createProxy(copy)
    const source = {
        isImmutable: true,
        base,
        // copy: parent.receiver ? parent.receiver[BASE] : null,
        copy: base,
        parent: parent.receiver,
        prop: parent.prop,
        proxy: immutable.proxy,
        revoke: immutable.revoke,
        handler: handler,
        setLog: parent.receiver ? parent.receiver[SETLOG] : []
    }
    const { proxy, revoke } = Proxy.revocable(source, {
        get: function(target, prop, receiver){
            // 匹配target的prop属性
            let res = matchTargetProp(target, prop)
            if(res.match){
                return res.value
            }
            // 执行getter
            receiver[HANDLER] && receiver[HANDLER].get && receiver[HANDLER].get(target, prop, receiver)
            return Reflect.get(target.proxy, prop, receiver)
        },
        set: function(target, prop, newValue, receiver){
            if(prop === HANDLER){
                return Reflect.set(target, 'handler', newValue)
            }
            // 值为不可变数据类型时，需要转换
            newValue = getImmutableCopy(newValue)
            if(prop === COPY){
                return Reflect.set(target, 'copy', newValue)
            }
            // 进行拷贝
            // receiver[COPY][prop] = newValue
            // let obj = receiver
            // while(obj[PARENT]){
            //     obj[PARENT][COPY] = Object.assign(obj[PARENT][COPY], { [obj[PROP]]: obj[COPY] })
            //     obj = obj[PARENT]
            // }
            receiver[SETLOG].push({receiver, prop, newValue})
            // console.log(receiver)
            // 执行setter
            receiver[HANDLER] && receiver[HANDLER].set && receiver[HANDLER].set(target, prop, newValue, receiver)
            return Reflect.set(target.proxy, prop, newValue, target.proxy)
        }
    })

    return proxy
}

/**
 * 递归创建代理对象
 * @param base 
 * @param handler 
 * @returns 
 */
function createProxy(base: any): any{
    const { proxy, revoke } = Proxy.revocable(base, {
        get: function(target, prop, receiver){
            if(target.hasOwnProperty(prop) && !target[prop][ISIMMUTABLE]){
                const p = { receiver: receiver, prop: prop }
                // 子属性的handler指向根属性的handler，这样就能通过根元素控制所有子属性的handler
                const handler = receiver[HANDLER]
                target[prop] = createImmutable(target[prop], handler, p)
            }
            return Reflect.get(target, prop, receiver)
        },
        set: function(target, prop, newValue, receiver){
            return Reflect.set(target, prop, newValue, receiver)
        }
    })
    return { proxy, revoke }
}

/**
 * 匹配target的prop属性
 * @param {*} target
 * @param {string|synmbol} prop
 * @returns
 */
function matchTargetProp(target: any, prop: string | symbol){
    // 将要返回的值
    let result = {
        match: false,
        value: null as any
    }
    // 匹配数据
    let props: any = {
        [<symbol>ISIMMUTABLE]: 'isImmutable',
        [<symbol>BASE]: 'base',
        [<symbol>COPY]: 'copy',
        [<symbol>PARENT]: 'parent',
        [<symbol>PROP]: 'prop',
        [<symbol>REVOKE]: 'revoke',
        [<symbol>HANDLER]: 'handler',
        [<symbol>SETLOG]: 'setLog'
    }
    // 进行匹配
    if(props[prop]){
        result.match = true
        result.value = target[props[prop]]
    }
    return result
}

/**
 * 获取拷贝数据
 * @param proxy 
 * @returns 
 */
export function getImmutableCopy(proxy: any){
    if(proxy[ISIMMUTABLE]){
        let setLog = proxy[SETLOG]
        setLog.forEach((item: SetLogType) => {
            const { receiver, prop, newValue } = item
            // 路径拷贝
            let r = receiver
            let lock = true
            while(r){
                let copy = shallowCopy(r[COPY])
                // 上锁，只有叶子节点需要赋值
                if(lock){
                    copy[prop] = newValue
                    lock = false
                }
                r[COPY] = copy
                // 向上拷贝
                if(r[PARENT]){
                    r[PARENT][COPY] = shallowCopy(r[PARENT][COPY])
                    r[PARENT][COPY][r[PROP]] = r[COPY]
                }
                r = r[PARENT]
            }
        })
        return proxy[COPY]
    }
    return proxy
}

// /**
//  * 获取原数据
//  * @param proxy 
//  * @returns 
//  */
// export function getImmutableBase(proxy: any){
//     if(proxy[getIsImmutable]){
//         return proxy[getBase]
//     }
//     return proxy
// }

// /**
//  * 获取父节点
//  * @param proxy 
//  * @returns 
//  */
// export function getImmutableParent(proxy: any){
//     if(proxy[getIsImmutable]){
//         return proxy[getParent]
//     }
//     return proxy
// }

/**
 * 结束(销毁)不可变数据
 * @param proxy 
 */
// export function finishImmutable(proxy: any){}

/**
 * 注入getter、setter
 */
export function setHandler(proxy: any, handler?: ImmutableHandler){
    if(proxy[ISIMMUTABLE]){
        proxy[HANDLER].get = handler && handler.get || proxy[HANDLER].get
        proxy[HANDLER].set = handler && handler.set || proxy[HANDLER].set
    }
}