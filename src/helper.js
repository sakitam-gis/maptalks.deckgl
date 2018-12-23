const createContext = function (canvas, glOptions = {}) {
  if (!canvas) return null;
  function onContextCreationError (error) {
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

/**
 * create canvas
 * @param width
 * @param height
 * @param scaleFactor
 * @param Canvas
 * @returns {HTMLCanvasElement}
 */
const createCanvas = (width, height, scaleFactor, Canvas) => {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width * scaleFactor;
    canvas.height = height * scaleFactor;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    return canvas
  } else {
    // create a new canvas instance in node.js
    // the canvas class needs to have a default constructor without any parameter
    return new Canvas(width, height);
  }
};

export {
  createContext,
  createCanvas
}
