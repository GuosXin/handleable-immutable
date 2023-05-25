const TARGET = Symbol('target')

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
    if(getImmutableTarget(value)) return false
    if(baseType.includes(type)) return false
    if(referenceType.includes(type)) return true
}

/**
 * 浅拷贝
 * @param {*} value 
 * @returns 
 */
function shallowCopy(value: any){
    let type = Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
    if(type === "array") return [...value]
    if(type === "object") return {...value}
    if(type === "date") return new Date(value)
    if(type === "regExp") return new RegExp(value)
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
        setLog: parent.receiver ? getImmutableTarget(parent.receiver).setLog : []
    }
    const { proxy, revoke } = Proxy.revocable(source, {
        get: function(target, prop, receiver){
            if(prop === TARGET) return target
            // 执行getter
            let handler = target.handler
            handler && handler.get && handler.get(target, prop, receiver)
            return Reflect.get(target.proxy, prop, receiver)
        },
        set: function(target, prop, newValue, receiver){
            // 记录草稿
            target.setLog.push({receiver, prop, newValue})
            // 执行setter
            let handler = target.handler
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
            if(target.hasOwnProperty(prop) && !getImmutableTarget(target[prop])){
                const p = { receiver: receiver, prop: prop }
                // 子属性的handler指向根属性的handler，这样就能通过根元素控制所有子属性的handler
                const handler = target.handler
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
    let t = getImmutableTarget(proxy)
    if(t){
        if(t.setLog.length === 0) {
            return t.copy
        }
        t.setLog.forEach((item: SetLogType) => {
            const { receiver, prop, newValue } = item
            // 路径拷贝
            let r = copyPath(receiver)
            // 叶子节点赋值
            let tr = getImmutableTarget(r)
            let tn = getImmutableTarget(newValue)
            if(newValue && tn){
                tr.copy[prop] = tn.copy
            }else{
                tr.copy[prop] = newValue
            }
        })
        t.setLog.length = 0
        return t.copy
    }
    return proxy
}

/**
 * 路径拷贝
 * @param receiver 
 * @returns 
 */
function copyPath(receiver: any){
    const tr = getImmutableTarget(receiver)
    const tp = getImmutableTarget(tr.parent)
    // 如果已经到根节点，提前结束
    if(
        !tr || 
        (!tr.parent && tr.copy !== tr.base)
    ){
        return receiver
    }
    // 如果已经拷贝过了，提前结束
    if(
        tr.copy !== tr.base &&
        tp &&
        tp.copy !== tp.base
    ){
        tp.copy[tr.prop] = tr.copy
        return receiver
    }
    // 拷贝当前节点
    if(tr.copy === tr.base){
        tr.copy = shallowCopy(tr.copy)
    }
    // 向上拷贝
    if(tp){
        tp.copy = shallowCopy(tp.copy)
        tp.copy[tr.prop] = tr.copy
    }
    copyPath(tr.parent)
    return receiver
}

/**
 * 获取target
 * @param proxy 
 * @returns 
 */
export function getImmutableTarget(proxy: any){
    if(proxy && proxy[TARGET]){
        return proxy[TARGET]
    }
    return false
}

/**
 * 获取原数据
 * @param proxy 
 * @returns 
 */
export function getImmutableBase(proxy: any){
    let target = getImmutableTarget(proxy)
    if(target){
        return target.base
    }
    return proxy
}

/**
 * 获取父节点
 * @param proxy 
 * @returns 
 */
export function getImmutableParent(proxy: any){
    let target = getImmutableTarget(proxy)
    if(target){
        return target.parent
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
    let t = getImmutableTarget(proxy)
    if(t){
        t.handler.get = handler && handler.get || t.handler.get
        t.handler.set = handler && handler.set || t.handler.set
    }
}