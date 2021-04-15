function thunk (store){
    // thunk是最后一个中间件函数 所以next就是reduce
    return function (next){
        return function (action){
            console.log('thunk')
            next(action)
        }
    }
}