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
    let setterLog: Array<any> = []

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
                    if(prop === '__setterLog__'){
                        return setterLog
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
                        getterLog.push(p)
                        target[prop] = createProxy(target[prop], handler, p)
                    }
                    return Reflect.get(target, prop, receiver)
                },
                set: (target, prop, newValue, receiver) => {
                    setterLog.push({receiver, prop, newValue})
                    handler!.set!(target, prop, newValue, receiver)
                    return Reflect.set(target, prop, newValue, receiver)
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
    // @ts-ignore
    const { proxy, revoke } = Proxy.revocable(source, {
        // @ts-ignore
        get: function(target, prop){
            if(prop === '__isRoot__'){
                return true
            }
            if(prop === '__base__'){
                return target.base
            }
            if(prop === '__proxy__'){
                return target.proxy
            }
            if(prop === '__revoke__'){
                return revoke
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
        let setterLog = proxy.__setterLog__
        let getterLog = proxy.__getterLog__

        setterLog.forEach((item: any) => {
            let { receiver, prop, newValue } = item
            if(newValue.__isRoot__){
                receiver[prop] = newValue.__proxy__
            }else if(newValue.__isImmutable__){
                receiver[prop] = newValue.__target__
            }
            /** 待优化 start **/
            while(receiver){
                if(receiver.__parent__){
                    // if(receiver.__parent__[receiver.__prop__].__target__ !== receiver.__target__){
                    //     // 说明已经修复过
                    //     break
                    // }
                    receiver.__parent__[receiver.__prop__] = receiver.__target__
                }else{
                    proxy.proxy = receiver.__target__
                }
                receiver = receiver.__parent__
            }
            /** 待优化 end **/
        })

        getterLog.forEach((item: any) => {
            let { receiver, prop } = item
            while(receiver){
                if(receiver[prop]){
                    // if(receiver.__parent__[receiver.__prop__].__target__ !== receiver.__target__){
                    //     // 说明已经修复过
                    //     break
                    // }
                    receiver[prop] = receiver[prop].__target__
                }else{
                    proxy.proxy = receiver.__target__
                }
                receiver = receiver.__parent__
            }
        })
        const result = proxy.__proxy__
        proxy.__revoke__()
        return result
    }else{
        return proxy
    }
}