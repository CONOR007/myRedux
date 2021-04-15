/*
    @parm reducer:根据actions对类型对store中数据状态进行更改,返回一个新的状态
    @parm preloadedState:预存储store的状态(初始状态)
    @parm enhancer:对store的功能进行增强
    createStore(reducer,preloadedState,enhancer)
    createStore返回的是一个对象
    @return {
        getState,//获取状态
        dispatch,//触发action
        subscribe,//订阅数据状态的变化
    }
*/

function createStore (reducer,preloadedState,enhancer){
    // 约束reduce必须是一个函数
    if (typeof reducer !== 'function') throw new Error('reducer必须是函数')

    // 判读enhancer参数是否存在,判断它是不是函数
    if (typeof enhancer !== "undefined") {
        if (typeof enhancer !== 'function') {
            throw new Error('enhancer必须是函数')
        }
        return enhancer(createStore)(reducer,preloadedState)
    }
    // currentState:store对象中存储的状态,需要用闭包对其进行缓存
    var currentState = preloadedState
    // 用来存放订阅者函数
    var currentListeners = []
    // 获取状态并闭包缓存currentState
    function getState () {
        return currentState;
    }

    // 触发action
    function dispatch (action) {
        // 判断action是否是一个对象
        if (!isPlainObject(action)) throw new Error('action不是一个对象')
        // 判断action有没有type属性
        if(typeof action.type === 'undefined') throw new Error('action对象中必须有type属性')
        currentState = reducer(currentState,action)
        // 循环数组
        for (var i= 0 ; i < currentListeners.length ;i++ ){
            // 获取订阅者
            const listen = currentListeners[i]
            // 调用订阅者
            listen()
        }
    }

    // 订阅数据状态的变化
    function subscribe (listener) {
        currentListeners.push(listener)
    }

    return { getState,dispatch,subscribe }
}

function isPlainObject (obj) {
    // 排除基本数据类型和null
    if (typeof obj !== 'object' || obj === null) return false;
    // 区分数组和对象 采用原型对象对比的方式
    var proto = obj;
    while (Object.getPrototypeOf(proto) !== null){
        // 获取到proto的最顶层原型链
        proto = Object.getPrototypeOf(proto)
    }
    // 如果当前传入的对象的原型链全等于proto的最顶层原型链 那么就肯定是对象
    return Object.getPrototypeOf(obj) === proto
}
// console.log(isPlainObject({}))
// console.log(isPlainObject([]))
// console.log(isPlainObject('a'))
// console.log(isPlainObject(10))


// applyMiddleware其实就是一个内置的enhancer函数,它用来对store增强
function applyMiddleware (...middlewares) {
    return function (createStore) {
        return function(reducer,preloadedState) {
            // 创建store 给中间件传参
            var store = createStore(reducer,preloadedState)
            // 阉割版的 store
            var middlewareAPI = {
                getState : store.getState,
                dispatch : store.dispatch
            }
            // 调用中间件的第一层函数 传递阉割版的store对象 把第二层函数缓存到chain中
            var chain = middlewares.map(middleware => middleware(middlewareAPI))
            // 为什么要穿dispatch呢? 因为中间件最后一个next就是dispatch
            var dispatch = compose(...chain)(store.dispatch)
            // 最后返回:所以在第一个调用dispatch时 其实执行的是logger最里层返回的函数->然后在函数内部去调用thunk->最后调用原始的dispath进入redux
            return {
                ...store,
                dispatch
            }
        }
    }
}

// compose:给第二层函数传参
function compose () {
    var funcs = [...arguments]
    return function(dispatch) {
        for (let index = funcs.length-1; index >= 0; index--) {
            // 倒着调用第二层函数,得到它的返回值 当做参数传给上一层
            dispatch = funcs[index](dispatch);
        }
        // 这个dispatch就是第一个中间件函数
        return dispatch
    }
}

// 将actionCreators函数转换成可以触发actions的函数
function bindActionCreators (actionCreators,dispatch) {
    var boundActionCreators = {};
    for (const key in actionCreators) {
        (function(key){
            // 沙河模式 缓存key
            boundActionCreators[key] = function(){ 
                dispatch(actionCreators[key]())
            }
        })(key)
    }
    return boundActionCreators;
}

// combineReducers 将一个个小的reduce转换成一个大的reduce
// 返回值是一个reducer函数 reducer函数它有两个参数一个是state一个是action
function combineReducers (reducers) {
    var reduceKeys = Object.keys(reducers)
    for (let index = 0; index < reduceKeys.length; index++) {
        const key = reduceKeys[index];
        if (typeof reducers[key] !== 'function') throw new Error('reducer必须是一个函数')
    }
    // 第一件事是循环第一个参数对象 拿到reduce 看是不是函数类型 
    return function (state,action) {
        var nextState = {}
        // 第二件事依然循环它 并调用小的reduce 并把对应的状态赋值给count 最后把它赋值给一个大的对象 并返回
        for (let index = 0; index < reduceKeys.length; index++) {
            const key = reduceKeys[index];
            nextState[key] = reducers[key](state[key],action)
        }
        console.log(nextState)
        return nextState
    }
}