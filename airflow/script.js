import * as THREE from "https://threejs.org/build/three.module.js";
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";

let camera, scene, renderer;
let mainPropeller, bladeSetA, bladeSetB, bladeSetC;
let step = 0;
const { PI, random, sin, cos } = Math;
const TAU = 2 * PI;
const uniforms = {
  time: { value: 0 }
};

const map = (value, sMin, sMax, dMin, dMax) => {
  return dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin);
};
const range = (n, m = 0) =>
  Array(n)
    .fill(m)
    .map((i, j) => i + j);
const vec = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const polar = (ang, r = 1) => [r * cos(ang), r * sin(ang)];
const bladeGeometry = getBladeGeometry();

function init() {
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(-44.93624743716165, 27.39247486400745, 85.03167637469498);
  camera.rotation.x = -0.31164690514668836;
  camera.rotation.y = -0.46605157569574196;
  camera.rotation.z = -0.1437609504660436;

  const controls = new OrbitControls(camera, renderer.domElement);

  addAmbientLight(scene);
  addDirectionalLight(scene);
  addResizeHandler(renderer, camera);
  addObjects(scene);
  render();
}

function render() {
  update();

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function addObjects(scene) {
  createAxis(scene);

  mainPropeller = createMainPropeller(scene);

  bladeSetB = createBladeSetStageB(scene);
  bladeSetC = createBladeSetStageC(scene);
  bladeSetA = createBladeSetStageA(scene);
  createAirParticles(scene, uniforms);
  createGasParticles(scene, uniforms);
}

function update() {
  mainPropeller.rotation.x += 0.02;
  bladeSetA.rotation.x += 0.01;
  bladeSetB.rotation.x -= 0.01;
  bladeSetC.rotation.x += 0.01;

  step = (step + 1) % 500;

  uniforms.time.value = step / 500;
}
init();

function createAxis(scene) {
  function getPath() {
    const c1 = curve(
      [3.94, 8.851],
      [3.98, 12.526],
      [2.123, 14.144],
      [2.063, 17.139]
    );
    const c2 = line([2.063, 17.139], [1.76, 38.948]);
    const c3 = curve(
      [1.76, 38.948],
      [2.349, 40.783],
      [3.988, 42.028],
      [4.119, 43.994]
    );
    const c4 = line([4.119, 43.994], [4.119, 47.009]);
    const c5 = curve(
      [4.119, 47.009],
      [3.988, 51.596],
      [-0.01, 55.266],
      [0.056, 55.266]
    );

    const path = new THREE.CurvePath();
    path.add(c1);
    path.add(c2);
    path.add(c3);
    path.add(c4);
    path.add(c5);
    return path.getSpacedPoints(100);
  }
  const geometry = new THREE.LatheGeometry(getPath(), 32);
  const material = mat("#1a508b");
  const lathe = new THREE.Mesh(geometry, material);
  lathe.rotation.z = PI / 2;

  lathe.position.x = 30;
  scene.add(lathe);
}

function addResizeHandler(renderer, camera) {
  window.addEventListener(
    "resize",
    () => {
      const { innerWidth: w, innerHeight: h } = window;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    false
  );
}

function addDirectionalLight(scene) {
  const color = 0xffffff;
  const intensity = 0.6;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);
}

function addAmbientLight(scene) {
  const color = 0xffffff;
  const intensity = 0.6;
  const light = new THREE.AmbientLight(color, intensity);
  scene.add(light);
}

function createGasParticles(scene, uniforms) {
  const particles = 10000;

  function getPathTexture() {
    const points = 1000;
    const c1 = curve(
      [0.222, -0.013],
      [0.47, 0.365],
      [0.866, 1.179],
      [0.979, 2.012]
    );
    const c2 = curve(
      [0.979, 2.012],
      [1.415, 4.167],
      [1.487, 6.031],
      [1.366, 7.944]
    );
    const path = new THREE.CurvePath();
    path.add(c1);
    path.add(c2);

    const data = path
      .getSpacedPoints(points)
      .reduce((acc, { x, y, z }) => [...acc, x, y, z], []);

    return new THREE.DataTexture(
      new Float32Array(data),
      points + 1,
      1,
      THREE.RGBFormat,
      THREE.FloatType
    );
  }

  const fragmentShader = `
varying float alpha;
varying vec3 vColor;
float map(float value, float sMin, float sMax, float dMin, float dMax){
    return dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin);
}
vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix( vec3(1.0), rgb, c.y);
}

void main() {
    vec3 c = hsb2rgb(vec3(map(alpha, 0.0, 1.0, 0.0, 0.25), 0.9, 0.9)) ;
    gl_FragColor = vec4( c, 1.0-alpha );
}

`;

  const vertexShader = `
uniform sampler2D tex;
attribute vec3 config;
uniform float time;
varying vec3 vColor;
varying float alpha;
const float TAU = 6.2831853071;
  float map(float value, float sMin, float sMax, float dMin, float dMax){
      return dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin);
  }

  vec2 polar(float ang, float r){
      return vec2(r*cos(ang), r*sin(ang));
  }
void main() {

    float radius = config.x;
    float ang = config.y;
    float offset = config.z;


    alpha = mod(offset+time*3., 1.);

    float pointRadius = texture2D(tex, vec2(mod(offset+time*3., 1.), 0.1)).r;


    vec3 p = vec3(0., 0., 0.);

    p.x = map(mod(offset+time*3., 1.), 0., 1., 14., 50.);
    
    vec2 newP = polar(map(mod(ang, 1.), 0., 1., 0., TAU), map(radius, 0., 1., 0., pointRadius*6.));

    p.y = newP.x;
    p.z = newP.y;



    vColor = color;

    vec4 mvPosition = modelViewMatrix * vec4( p, 1.0 );

    gl_PointSize = 0.4 * ( 300.0 / -mvPosition.z );

    gl_Position = projectionMatrix * mvPosition;

}
`;
  const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { ...uniforms, tex: { value: getPathTexture() } },

    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: true
  });

  const geometry = new THREE.BufferGeometry();

  const positions = [];
  const colors = [];
  const config = [];

  const color = new THREE.Color("#ffe227");

  for (let i = 0; i < particles; i++) {
    const r = random();
    const ang = random();
    const offset = random();

    positions.push(0, 0, 0);

    config.push(r, ang, offset);

    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("config", new THREE.Float32BufferAttribute(config, 3));

  const particleSystem = new THREE.Points(geometry, shaderMaterial);

  scene.add(particleSystem);
}

function createAirParticles(scene, uniforms) {
  const particles = 20000;
  const fragmentShader = `
  varying vec3 vColor;
  varying float offsetAct;
  
  float map(float value, float sMin, float sMax, float dMin, float dMax){
      return dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin);
  }
  void main() {
      float alpha = step(offsetAct, 0.2)*map(offsetAct, 0.0, 0.2, 0.0, 1.) + step(0.2, offsetAct)*step(offsetAct, 0.8) + step(0.8, offsetAct)*map(offsetAct, 0.8, 1.0, 1.0, 0.0) ;
      gl_FragColor = vec4( vColor, alpha );
  }
  `;
  const vertexShader = `
  uniform sampler2D tex;
  attribute vec3 config;
  uniform float time;
  varying vec3 vColor;
  varying float offsetAct;
  const float TAU = 6.2831853071;
  float map(float value, float sMin, float sMax, float dMin, float dMax){
      return dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin);
  }

  vec2 polar(float ang, float r){
      return vec2(r*cos(ang), r*sin(ang));
  }
  void main() {
      float radius = config.x;
      float ang = config.y;
      float offset = config.z;
      offsetAct = mod(offset+time, 1.);

      float pointRadius = texture2D(tex, vec2(offsetAct, 0.1)).r;
      vec3 p = vec3(0., 0., 0.);

      p.x = map(offsetAct, 0., 1., -40., 45.);
      vec2 newP = polar(map(mod(ang+time, 1.), 0., 1., 0., TAU), map(radius, 0., 1., 0., pointRadius*6.));

      p.y = newP.x;
      p.z = newP.y;

      vColor = color;

      vec4 mvPosition = modelViewMatrix * vec4( p, 1.0 );

      gl_PointSize = 0.5 * ( 300.0 / -mvPosition.z );

      gl_Position = projectionMatrix * mvPosition;

}`;

  function getPathTexture() {
    const points = 1000;
    const c1 = curve(
      [6.015, 0.026],
      [2.976, 1.431],
      [2.529, 1.903],
      [1.99, 4.005]
    );
    const c2 = line([1.99, 4.005], [2.001, 10.938]);
    const c3 = curve(
      [2.001, 10.938],
      [2.106, 12.589],
      [3.144, 12.875],
      [3.001, 13.997]
    );
    const path = new THREE.CurvePath();
    path.add(c1);
    path.add(c2);
    path.add(c3);

    const data = path
      .getSpacedPoints(points)
      .reduce((acc, { x, y, z }) => [...acc, x, y, z], []);

    return new THREE.DataTexture(
      new Float32Array(data),
      points + 1,
      1,
      THREE.RGBFormat,
      THREE.FloatType
    );
  }

  const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { ...uniforms, tex: { value: getPathTexture() } },

    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: true
  });

  const geometry = new THREE.BufferGeometry();

  const positions = [];
  const colors = [];
  const config = [];

  const color = new THREE.Color("#48426d");

  for (let i = 0; i < particles; i++) {
    const r = random();
    const ang = random();
    const offset = random();

    positions.push(0, 0, 0);

    config.push(r, ang, offset);

    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("config", new THREE.Float32BufferAttribute(config, 3));

  const particleSystem = new THREE.Points(geometry, shaderMaterial);

  scene.add(particleSystem);
}

function createMainPropeller(scene) {
  const matrix = new THREE.Object3D();
  const totalPerCirc = 30;
  const material = mat("#1a508b");
  const spheres = new THREE.InstancedMesh(
    bladeGeometry,
    material,
    totalPerCirc
  );

  range(totalPerCirc).forEach((i) => {
    const ang = map(i, 0, totalPerCirc, 0, TAU);
    const [z, y] = polar(ang, 4);
    const x = -17;

    matrix.position.set(x, y, z);
    matrix.scale.set(1.8, 1.8, 0.8);
    matrix.lookAt(vec(x, 0, 0));
    matrix.updateMatrix();
    spheres.setMatrixAt(i, matrix.matrix);
  });

  scene.add(spheres);
  return spheres;
}

function createBladeSetStageB(scene) {
  const matrix = new THREE.Object3D();
  const totalPerCirc = 40;
  const rows = 10;
  const material = mat("#1a508b");
  const spheres = new THREE.InstancedMesh(
    bladeGeometry,
    material,
    totalPerCirc * rows
  );

  range(rows).forEach((rowId) => {
    range(totalPerCirc).forEach((i) => {
      const ang = map(i, 0, totalPerCirc, 0, TAU);
      const [z, y] = polar(ang, 2);
      const x = map(rowId, 0, rows, -4, 10);

      matrix.position.set(x, y, z);
      matrix.scale.set(0.3, 0.3, 0.2);
      matrix.lookAt(vec(x, 0, 0));
      matrix.updateMatrix();
      spheres.setMatrixAt(rowId * totalPerCirc + i, matrix.matrix);
    });
  });

  scene.add(spheres);
  return spheres;
}

function createBladeSetStageC(scene) {
  const matrix = new THREE.Object3D();
  const totalPerCirc = 40;
  const rows = 7;
  const material = mat("#1a508b");
  const spheres = new THREE.InstancedMesh(
    bladeGeometry,
    material,
    totalPerCirc * rows
  );

  range(rows).forEach((rowId) => {
    range(totalPerCirc).forEach((i) => {
      const ang = map(i, 0, totalPerCirc, 0, TAU);
      const [z, y] = polar(ang, map(rowId, 0, rows, 2.1, 4.8));
      const x = map(rowId, 0, rows, 14, 22);

      matrix.position.set(x, y, z);
      matrix.scale.set(0.3, 0.3, 0.2);
      matrix.lookAt(vec(x, 0, 0));
      matrix.updateMatrix();
      spheres.setMatrixAt(rowId * totalPerCirc + i, matrix.matrix);
    });
  });

  scene.add(spheres);
  return spheres;
}

function createBladeSetStageA(scene) {
  const matrix = new THREE.Object3D();
  const totalPerCirc = 40;
  const rows = 4;
  const material = mat("#1a508b");
  const spheres = new THREE.InstancedMesh(
    bladeGeometry,
    material,
    totalPerCirc * rows
  );

  range(rows).forEach((rowId) => {
    range(totalPerCirc).forEach((i) => {
      const ang = map(i, 0, totalPerCirc, 0, TAU);
      const [z, y] = polar(ang, map(rowId, 0, rows, 2, 4));
      const x = map(rowId, 0, rows, -10, -15);

      matrix.position.set(x, y, z);
      matrix.scale.set(0.3, 0.3, 0.2);
      matrix.lookAt(vec(x, 0, 0));
      matrix.updateMatrix();
      spheres.setMatrixAt(rowId * totalPerCirc + i, matrix.matrix);
    });
  });

  scene.add(spheres);
  return spheres;
}

function getBladeGeometry() {
  const angRot = (PI / 2) * 0.75;
  function func(v, u, target) {
    const z = map(v, 0, 1, 0, -15);
    const ang = map(v, 0, 1, 0, angRot);
    const [x1, y1] = polar(ang, 1);
    const [x2, y2] = polar(ang + PI, 1);
    const x = map(u, 0, 1, x2, x1);
    const y = map(u, 0, 1, y2, y1);
    target.set(x, y, z);
  }
  return new THREE.ParametricBufferGeometry(func, 5, 1);
}

function mat(color, wireframe = false) {
  const c = color ? color : randomColor();
  return new THREE.MeshPhongMaterial({
    color: new THREE.Color(c),
    side: THREE.DoubleSide,
    wireframe
  });
}

function line(v1, v2) {
  const [x1, y1] = v1;
  const [x2, y2] = v2;
  return new THREE.LineCurve3(vec(x1, y1), vec(x2, y2));
}

function curve(v1, v2, v3, v4) {
  const [x1, y1] = v1;
  const [x2, y2] = v2;
  const [x3, y3] = v3;
  const [x4, y4] = v4;

  return new THREE.CubicBezierCurve3(
    vec(x1, y1),
    vec(x2, y2),
    vec(x3, y3),
    vec(x4, y4)
  );
}