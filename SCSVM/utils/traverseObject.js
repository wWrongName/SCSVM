let _getInstantObj = () => {
    let res = _bodyPtrs.reduce((prev, cur, index) => {
        return index === 0 ? prev : prev[cur]
    }, _bodyPtrs[0])
    return res === [] ? null : res
}

let _getInstantIndex = () => _indexes[_indexes.length - 1]

let _updIndex = (newIndex) => {
    _indexes[_indexes.length - 1] = newIndex
}

let _ptrsPush = (bodyPtr, index) => {
    _bodyPtrs.push(bodyPtr)
    _indexes.push(index)
}

let _ptrsPop = () => {
    _bodyPtrs.pop()
    _indexes.pop()
}
let _handleConditions = (key, index, len, handler) => {
    _ptrsPush(key, 0)
    let el = _getInstantObj()
    let res = handler(el)
    if (res !== undefined)
        return res
    if (typeof el === "object")
        return // save _bodyPtrs (go into object)

    if (typeof el !== "object" && index !== len - 1) {
        _ptrsPop()
        _updIndex(_getInstantIndex() + 1)
        return // delete 1 ptr (save object location)
    }
    if (typeof el !== "object" && index === len - 1) {
        _ptrsPop()
        _ptrsPop()
        _updIndex(_getInstantIndex() + 1)
        // delete 2 ptrs (exit from traversed object)
    }
}

let _bodyPtrs = []
let _indexes = []

let _clearTraversePtrs = () => {
    _bodyPtrs = []
    _indexes = []
}

module.exports = (body, handler, accumulator) => {
    if (typeof body !== "object")
        return
    _ptrsPush(body, 0)

    let instantObj = _getInstantObj()
    let keys = Object.keys(instantObj)
    let i = _getInstantIndex()
    while (instantObj) {
        let res = _handleConditions(keys[i], i, keys.length, handler)
        if (res !== undefined) {
            if (accumulator)
                accumulator.push(res)
            else {
                _clearTraversePtrs()
                return res
            }
        }
        i = _getInstantIndex()
        instantObj = _getInstantObj()
        keys = Object.keys(instantObj)
        while (i === keys.length) {
            _ptrsPop() // delete 1 ptr (exit from traversed object)
            i = _getInstantIndex()
            if (i === undefined) {
                _clearTraversePtrs()
                return
            }
            _updIndex(++i)
            instantObj = _getInstantObj()
            keys = Object.keys(instantObj)
        }
    }
    _clearTraversePtrs()
}
