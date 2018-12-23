export default `\
#define SHADER_NAME arc-layer-fragment-shader

precision highp float;

varying vec4 vColor;

void main(void) {
  gl_FragColor = vColor;
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
}
`;
