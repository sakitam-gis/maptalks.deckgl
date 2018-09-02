const createContext = function (canvas, glOptions = {}) {
    if (!canvas) return null;
    function onContextCreationError(error) {
        console.log(error.statusMessage);
    }

    canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
    let gl = canvas.getContext('webgl2', glOptions);
    gl = gl || canvas.getContext('experimental-webgl2', glOptions);
    if (!gl) {
        gl = canvas.getContext('webgl', glOptions);
        gl = gl || canvas.getContext('experimental-webgl', glOptions);
    }

    canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
    return gl;
};

let venderPrefix = '';

// Get CSS vendor prefix
try {
    const styleObj = document.createElement('div').style;
    const prefix = /^(webkit|moz|ms|o)(?=[A-Z])/;
    for (const key in styleObj) {
        if (prefix.test(key)) {
            venderPrefix = `-${key.match(prefix)[0]}-`;
            break;
        }
    }
} catch (error) {
    // document not available
}

export {
    createContext,
    venderPrefix
}
