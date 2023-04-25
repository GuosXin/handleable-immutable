const getIsImmutable = Symbol('isImmutable')
const getBase = Symbol('base')
const getCopy = Symbol('copy')
const getParent = Symbol('parent')
const getProp = Symbol('prop')
const getRevoke = Symbol('revoke')
const getHandler = Symbol('handler')

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
    if(value[getIsImmutable]) return false
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
export type CreateProxy = (base: any, handler?: ImmutableHandler) => any
export let createImmutable: CreateImmutable = function(base, handler = { set: () => {}, get: () => {} }, parent = { receiver: null, prop: null }){
    if(!isNeedToCopy(base)){
        return base
    }

    const createProxy: CreateProxy = function(base){
        const { proxy, revoke } = Proxy.revocable(base, {
            get: function(target, prop, receiver){
                if(target.hasOwnProperty(prop) && !target[prop][getIsImmutable]){
                    const p = { receiver: receiver, prop: prop }
                    // 子属性的handler指向根属性的handler，这样就能通过根元素控制所有子属性的handler
                    const handler = receiver[getHandler]
                    target[prop] = createImmutable(target[prop], handler, p)
                }
                return Reflect.get(target, prop, receiver)
            },
            set: function(target, prop, newValue, receiver){
                return Reflect.set(target, prop, newValue)
            }
        })
        return { proxy, revoke }
    }

    const copy = shallowCopy(base)
    const immutable = createProxy(copy)
    const source = {
        isImmutable: true,
        base,
        copy: shallowCopy(base),
        parent: parent.receiver,
        prop: parent.prop,
        proxy: immutable.proxy,
        revoke: immutable.revoke,
        handler: handler,
    }
    const { proxy, revoke } = Proxy.revocable(source, {
        get: function(target, prop, receiver){
            if(prop === getIsImmutable){
                return target.isImmutable
            }
            if(prop === getBase){
                return target.base
            }
            if(prop === getCopy){
                return target.copy
            }
            if(prop === getParent){
                return target.parent
            }
            if(prop === getProp){
                return target.prop
            }
            if(prop === getRevoke){
                return target.revoke
            }
            if(prop === getHandler){
                return target.handler
            }
            // 执行getter
            receiver[getHandler] && receiver[getHandler].get && receiver[getHandler].get(target, prop, receiver)
            return Reflect.get(target.proxy, prop, receiver)
        },
        set: function(target, prop, newValue, receiver){
            if(prop === getHandler){
                return Reflect.set(target, 'handler', newValue)
            }
            // 值为不可变数据类型时，需要转换
            newValue = getImmutableCopy(newValue)
            if(prop === getCopy){
                return Reflect.set(target, 'copy', newValue)
            }
            // 对应修改copy的值
            receiver[getCopy][prop] = newValue
            let obj = receiver
            while(obj[getParent]){
                obj[getParent][getCopy] = Object.assign(obj[getParent][getCopy], { [obj[getProp]]: obj[getCopy] })
                obj = obj[getParent]
            }
            // 执行setter
            receiver[getHandler] && receiver[getHandler].set && receiver[getHandler].set(target, prop, newValue, receiver)
            return Reflect.set(target.proxy, prop, newValue)
        }
    })

    return proxy
}

/**
 * 获取拷贝数据
 * @param proxy 
 * @returns 
 */
export function getImmutableCopy(proxy: any){
    if(proxy[getIsImmutable]){
        return proxy[getCopy]
    }
    return proxy
}

/**
 * 获取原数据
 * @param proxy 
 * @returns 
 */
export function getImmutableBase(proxy: any){
    if(proxy[getIsImmutable]){
        return proxy[getBase]
    }
    return proxy
}

/**
 * 获取父节点
 * @param proxy 
 * @returns 
 */
export function getImmutableParent(proxy: any){
    if(proxy[getIsImmutable]){
        return proxy[getParent]
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
    if(proxy[getIsImmutable]){
        proxy[getHandler].get = handler && handler.get || proxy[getHandler].get
        proxy[getHandler].set = handler && handler.set || proxy[getHandler].set
    }
}