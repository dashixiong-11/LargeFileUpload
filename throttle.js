export const throttle = (fn, delay) => {
    let id
    return function (...ags) {
        clearTimeout(id)
        id = setTimeout(() => {
            fn.apply(null, ags)
        }, delay)
    }
}