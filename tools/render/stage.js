// Rendering stage: renderer, studio lighting, export helpers.
import { THREE } from './lib.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TOYS, TEAM, medalCoin } from './toys.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
export { renderer, envTex };

export function toyScene(obj) {
  const scene = new THREE.Scene();
  scene.environment = envTex;
  const key = new THREE.DirectionalLight('#fff6e8', 2.4);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 20 });
  key.shadow.radius = 6;
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#cfe0ff', 1.2);
  rim.position.set(-4, 3, -3);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight('#ffffff', '#6b5a4a', 0.5));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.32 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  scene.add(obj);
  return scene;
}

export function renderToy(type, color, size = 512) {
  renderer.setPixelRatio(1);
  renderer.setSize(size, size);
  renderer.setClearColor(0x000000, 0);
  const obj = TOYS[type](TEAM[color]);
  obj.rotation.y = -0.32;
  const scene = toyScene(obj);
  const cam = new THREE.PerspectiveCamera(25, 1, 0.1, 100);
  cam.position.set(1.3, 2.6, 6.2);
  cam.lookAt(0, 1.08, 0);
  renderer.render(scene, cam);
  return renderer.domElement.toDataURL('image/png');
}

export function renderCoin(size = 128) {
  renderer.setSize(size, size);
  renderer.setClearColor(0x000000, 0);
  const scene = toyScene(medalCoin());
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  cam.position.set(0, 4.2, 1.6);
  cam.lookAt(0, 0.1, 0);
  renderer.render(scene, cam);
  return renderer.domElement.toDataURL('image/png');
}
