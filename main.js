import * as THREE from './resources/three.module.js';
import { OrbitControls } from './resources/OrbitControls.js';

const size = 64;
const sizeMultiplier = 2;
const edgesBuildingSpeed = 16;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const cam = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight);
cam.position.z = size * sizeMultiplier;

const control = new OrbitControls(cam, renderer.domElement);
control.enablePan = false;
control.enableDamping = true;

const scene = new THREE.Scene();

const bg = THREE.MathUtils.randInt(0, 1) ? 'corona' : 'redeclipse';
scene.background = new THREE.CubeTextureLoader().load([
  `ulukai/${bg}_ft.png`,
  `ulukai/${bg}_bk.png`,
  `ulukai/${bg}_up.png`,
  `ulukai/${bg}_dn.png`,
  `ulukai/${bg}_rt.png`,
  `ulukai/${bg}_lf.png`,
]);

class KruskalGraph {
  constructor() {
    this.initSpheres();
    this.initEdges();
    this.encodeSpheres();
    this.kruskal();
    this.builtEdges();
    scene.add(...this.spheres);
  }

  initSpheres() {
    this.spheres = Array(size)
      .fill(1)
      .map(() => {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(1, 32, 32),
          new THREE.MeshBasicMaterial({ color: THREE.MathUtils.randFloat(0x000000, 0xffffff) })
        );
        sphere.position.x = THREE.MathUtils.randFloatSpread(size * sizeMultiplier);
        sphere.position.y = THREE.MathUtils.randFloatSpread(size * sizeMultiplier);
        sphere.position.z = THREE.MathUtils.randFloatSpread(size * sizeMultiplier);
        return sphere;
      });
  }

  initEdges() {
    this.edges = [];

    this.spheres.forEach((s1, i1) => {
      this.spheres.forEach((s2, i2) => {
        if (s1 === s2) return;
        this.edges.push({ src: i1, dst: i2, distance: s1.position.distanceTo(s2.position) });
      });
    });
  }

  encodeSpheres() {
    this.encoding = {};
    this.spheres.forEach((sphere, idx) => {
      this.encoding[idx] = sphere;
    });
  }

  kruskal() {
    this.edges = this.edges.sort((e1, e2) => e1.distance - e2.distance);

    const subsets = this.spheres.map((_, idx) => ({ parent: idx, rank: 0 }));

    this.result = [];

    let builtEdgesCount = 0;
    const maxE = this.spheres.length - 1;
    let i = 0;

    while (builtEdgesCount < maxE) {
      const { src, dst } = this.edges[i++];

      const x = find(subsets, src);
      const y = find(subsets, dst);

      if (x !== y) {
        builtEdgesCount++;
        this.result.push({ src, dst });
        union(subsets, x, y);
      }
    }

    function find(subsets, i) {
      if (subsets[i].parent === i) return i;
      return find(subsets, subsets[i].parent);
    }

    function union(subsets, x, y) {
      const xroot = find(subsets, x);
      const yroot = find(subsets, y);

      if (subsets[xroot].rank < subsets[yroot].rank) {
        subsets[xroot].parent = yroot;
      } else if (subsets[xroot].rank > subsets[yroot].rank) {
        subsets[yroot].parent = xroot;
      } else {
        subsets[yroot].parent = xroot;
        subsets[xroot].rank++;
      }
    }
  }

  builtEdges() {
    let builtEdges = 0;
    const maxE = this.spheres.length - 1;

    this.result.forEach((edge, idx) => {
      setTimeout(() => {
        const { src, dst } = edge;
        const sphere1 = this.encoding[src];
        const sphere2 = this.encoding[dst];
        scene.add(
          new THREE.Line(
            new THREE.BufferGeometry()
              .setFromPoints([sphere1.position, sphere2.position])
              .setAttribute(
                'color',
                new THREE.BufferAttribute(
                  new Float32Array([
                    ...Object.values(sphere1.material.color),
                    ...Object.values(sphere2.material.color),
                  ]),
                  3
                )
              ),
            new THREE.LineBasicMaterial({ vertexColors: true })
          )
        );

        builtEdges++;
        if (builtEdges === maxE) {
          control.autoRotate = true;
        }
      }, idx * edgesBuildingSpeed);
    });
  }
}

new KruskalGraph();

renderer.setAnimationLoop(() => {
  control.update();
  renderer.render(scene, cam);
});
