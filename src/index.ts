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
type ImmutableHandler = {
    set?: (target: any, p: string | symbol, newValue: any, receiver: any) => void
}
type CreateImmutable = (base: any, handler?: ImmutableHandler) => any
export let createImmutable: CreateImmutable = function(base, handler = { set: () => {} }){
    let source: any;
    let path: any;

    let createProxy: CreateImmutable = function(base, handler){
        if(isNeedToCopy(base)){
            if(!source){
                // 初始化
                source = shallowCopy(base)
                path = source
            }
            base = shallowCopy(base)
            const proxy = new Proxy(base, {
                get: (target, prop, receiver) => {
                    if(prop === '__getSource__'){
                        return source
                    }
                    if(prop === '__isImmutable__'){
                        return true
                    }
                    if(isNeedToCopy(target[prop]) && !target[prop].__isImmutable__){
                        path[prop] = shallowCopy(target[prop])
                        path = path[prop]
                        target[prop] = createProxy(target[prop], handler)
                    }
                    return Reflect.get(target, prop, receiver)
                },
                set: (target, prop, newVal, receiver) => {
                    path[prop] = newVal
                    handler!.set!(target, prop, newVal, receiver)
                    return Reflect.set(target, prop, newVal, receiver)
                }
            })
            return proxy
        }else{
            return base
        }
    }

    return createProxy(base, handler)
}

/**
 * 获取拷贝数据
 * @param proxy 
 * @returns 
 */
export function finishImmutable(proxy: any){
    if(proxy.__isImmutable__){
        return proxy.__getSource__
    }else{
        return proxy
    }
}