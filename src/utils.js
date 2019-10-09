/**
 * create gl context
 * @param canvas
 * @param glOptions
 * @returns {null|*}
 */
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

const devicePixelRatio = window.devicePixelRatio || window.screen.deviceXDPI / window.screen.logicalXDPI;

function getDevicePixelRatio () {
  return Math.ceil(devicePixelRatio) || 1;
}

export {
  createContext,
  getDevicePixelRatio
};
