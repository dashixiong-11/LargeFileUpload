export const watch = (object, cb) => {
    const handler = {
        set: function (target, property, value) {
            target[property] = value;
            cb(target)
            return true;
        }
    };
    return new Proxy(object, handler);
}

