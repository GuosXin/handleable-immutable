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
type CreateProxy = (base: any, handler?: ImmutableHandler, parent?: any) => any
export let createImmutable: CreateImmutable = function(base, handler = { set: () => {} }){
    let getterLog: Array<any> = []

    let createProxy: CreateProxy = function(base, handler, parent = null){
        if(isNeedToCopy(base)){
            base = shallowCopy(base)
            const proxy = new Proxy(base, {
                get: (target, prop, receiver) => {
                    if(prop === '__isImmutable__'){
                        return true
                    }
                    if(prop === '__parent__'){
                        return parent ? parent.receiver : null
                    }
                    if(prop === '__getterLog__'){
                        return getterLog
                    }
                    if(prop === '__target__'){
                        return target
                    }
                    if(prop === '__prop__'){
                        return parent ? parent.prop : null
                    }
                    if(prop === '__receiver__'){
                        return receiver
                    }
                    if(isNeedToCopy(target[prop]) && !target[prop].__isImmutable__){
                        let p = { prop, receiver }
                        target[prop] = createProxy(target[prop], handler, p)
                        getterLog.push(receiver[prop])
                    }
                    return Reflect.get(target, prop, receiver)
                },
                set: (target, prop, newVal, receiver) => {
                    handler!.set!(target, prop, newVal, receiver)
                    return Reflect.set(target, prop, newVal, receiver)
                }
            })
            return proxy
        }else{
            return base
        }
    }

    // 定义第一层
    const source: any = {
        base,
        proxy: createProxy(base, handler)
    }
    const proxy = new Proxy(source, {
        get: function(target, prop, receiver){
            if(prop === '__proxy__'){
                return target.proxy
            }
            return target.proxy[prop]
        },
        set: function(target, prop, newVal, receiver){
            return Reflect.set(target, prop, newVal, receiver)
        }
    })

    return proxy
}

/**
 * 获取拷贝数据
 * @param proxy 
 * @returns 
 */
export function finishImmutable(proxy: any){
    if(proxy.__isImmutable__){
        let getterLog = proxy.__getterLog__
        getterLog.forEach((item: any) => {
            while(item){
                // 此处待优化
                if(item.__parent__){
                    item.__parent__[item.__prop__] = item.__target__
                }else{
                    proxy.proxy = item.__target__
                }
                item = item.__parent__
            }
        })
        return proxy.__proxy__
    }else{
        return proxy
    }
}