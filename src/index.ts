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
            if(prop === ISIMMUTABLE) return target.isImmutable
            if(prop === BASE) return target.base
            if(prop === COPY) return target.copy
            if(prop === PARENT) return target.parent
            if(prop === PROP) return target.prop
            if(prop === REVOKE) return target.revoke
            if(prop === HANDLER) return target.handler
            if(prop === SETLOG) return target.setLog
            // 执行getter
            let handler = receiver[HANDLER]
            handler && handler.get && handler.get(target, prop, receiver)
            return Reflect.get(target.proxy, prop, receiver)
        },
        set: function(target, prop, newValue, receiver){
            if(prop === HANDLER) return Reflect.set(target, 'handler', newValue)
            if(prop === SETLOG) return Reflect.set(target, 'setLog', newValue)
            if(prop === COPY) return Reflect.set(target, 'copy', newValue)
            // 记录草稿
            receiver[SETLOG].push({receiver, prop, newValue})
            // 执行setter
            let handler = receiver[HANDLER]
            handler && handler.set && handler.set(target, prop, newValue, receiver)
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
 * 获取拷贝数据
 * @param proxy 
 * @returns 
 */
export function getImmutableCopy(proxy: any){
    if(proxy[ISIMMUTABLE]){
        let setLog = proxy[SETLOG]
        if(setLog.length === 0) {
            return proxy[COPY]
        }
        setLog.forEach((item: SetLogType) => {
            const { receiver, prop, newValue } = item
            // 路径拷贝
            let r = copyPath(receiver)
            // 叶子节点赋值
            if(newValue && newValue[ISIMMUTABLE]){
                r[COPY][prop] = newValue[COPY]
            }else{
                r[COPY][prop] = newValue
            }
        })
        setLog.length = 0
        return proxy[COPY]
    }
    return proxy
}

/**
 * 路径拷贝
 * @param receiver 
 * @returns 
 */
function copyPath(receiver: any){
    const parent = receiver[PARENT]
    const copy = receiver[COPY]
    const base = receiver[BASE]
    // 如果已经到根节点，提前结束
    if(
        !receiver || 
        (!parent && copy !== base)
    ){
        return receiver
    }
    // 如果已经拷贝过了，提前结束
    if(
        copy !== base &&
        parent &&
        parent[COPY] !== parent[BASE]
    ){
        parent[COPY][receiver[PROP]] = copy
        return receiver
    }
    // 拷贝当前节点
    let r = receiver
    if(r[COPY] === r[BASE]){
        r[COPY] = shallowCopy(r[COPY])
    }
    // 向上拷贝
    if(r[PARENT]){
        r[PARENT][COPY] = shallowCopy(r[PARENT][COPY])
        r[PARENT][COPY][r[PROP]] = r[COPY]
    }
    copyPath(r[PARENT])
    return receiver
}

/**
 * 获取原数据
 * @param proxy 
 * @returns 
 */
export function getImmutableBase(proxy: any){
    if(proxy && proxy[ISIMMUTABLE]){
        return proxy[BASE]
    }
    return proxy
}

/**
 * 获取父节点
 * @param proxy 
 * @returns 
 */
export function getImmutableParent(proxy: any){
    if(proxy && proxy[ISIMMUTABLE]){
        return proxy[PARENT]
    }
    return proxy
}

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