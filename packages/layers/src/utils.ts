/**
 * create gl context
 * @param canvas
 * @param glOptions
 * @returns {null|*}
 */
const createContext = function (canvas: HTMLCanvasElement, glOptions = {}) {
  if (!canvas) return null;
  function onContextCreationError (error: any) {
    console.log(error.statusMessage);
  }
  if (canvas && canvas.addEventListener) {
    canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
  }
  let gl = canvas.getContext('webgl2', glOptions);
  gl = gl || canvas.getContext('experimental-webgl2', glOptions);
  if (!gl) {
    gl = canvas.getContext('webgl', glOptions);
    gl = gl || canvas.getContext('experimental-webgl', glOptions);
  }

  if (canvas.removeEventListener) {
    canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
  }
  return gl;
};

let devicePixelRatio = 1;
// fixed: ssr render @link https://github.com/gatsbyjs/gatsby/issues/25507
if (typeof window !== 'undefined') {
  // @ts-ignore
  devicePixelRatio = window.devicePixelRatio || window.screen.deviceXDPI / window.screen.logicalXDPI;
}

function getDevicePixelRatio () {
  return devicePixelRatio;
}

export {
  createContext,
  getDevicePixelRatio
};
