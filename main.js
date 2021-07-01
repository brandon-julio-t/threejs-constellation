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

    const parent = [];
    const rank = [];

    this.spheres.forEach((sphere, idx) => {
      parent.push(idx);
      rank.push(0);
    });

    this.result = [];

    let e = 0;
    let i = 0;
    const maxE = this.spheres.length - 1;

    while (e < maxE) {
      const { src, dst } = this.edges[i++];

      const x = find(parent, src);
      const y = find(parent, dst);

      if (x !== y) {
        e++;
        this.result.push({ src, dst });
        union(parent, rank, x, y);
      }
    }

    let builtEdges = 0;

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
        if (builtEdges === this.spheres.length - 1) {
          control.autoRotate = true;
        }
      }, idx * edgesBuildingSpeed);
    });

    function find(parent, i) {
      if (parent[i] === i) return i;
      return find(parent, parent[i]);
    }

    function union(parent, rank, x, y) {
      const xroot = find(parent, x);
      const yroot = find(parent, y);

      if (rank[xroot] < rank[yroot]) {
        parent[xroot] = yroot;
      } else if (rank[xroot] > rank[yroot]) {
        parent[yroot] = xroot;
      } else {
        parent[yroot] = xroot;
        rank[xroot]++;
      }
    }
  }
}

new KruskalGraph();

renderer.setAnimationLoop(() => {
  control.update();
  renderer.render(scene, cam);
});
