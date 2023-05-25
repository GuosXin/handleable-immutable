/**
 * 创建不可变数据
 * @param {*} base
 * @param {*} handler
 * @returns
 */
export type ImmutableHandler = {
    get?: (target: any, p: string | symbol, receiver: any) => void;
    set?: (target: any, p: string | symbol, newValue: any, receiver: any) => void;
};
export type Parent = {
    receiver: any;
    prop: any;
};
export type CreateImmutable = (base: any, handler?: ImmutableHandler, parent?: Parent) => any;
export type SetLogType = {
    receiver: any;
    prop: string | symbol;
    newValue: any;
};
export declare let createImmutable: CreateImmutable;
/**
 * 获取拷贝数据
 * @param proxy
 * @returns
 */
export declare function getImmutableCopy(proxy: any): any;
/**
 * 获取target
 * @param proxy
 * @returns
 */
export declare function getImmutableTarget(proxy: any): any;
/**
 * 获取原数据
 * @param proxy
 * @returns
 */
export declare function getImmutableBase(proxy: any): any;
/**
 * 获取父节点
 * @param proxy
 * @returns
 */
export declare function getImmutableParent(proxy: any): any;
/**
 * 结束(销毁)不可变数据
 * @param proxy
 */
/**
 * 注入getter、setter
 */
export declare function setHandler(proxy: any, handler?: ImmutableHandler): void;
