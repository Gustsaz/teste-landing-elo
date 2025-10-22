import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.127.0/build/three.module.js';
import { MTLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.127.0/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'https://cdn.jsdelivr.net/npm/three@0.127.0/examples/jsm/loaders/OBJLoader.js';

// --- SCENE, CAMERA, RENDERER ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('container').appendChild(renderer.domElement);

const clock = new THREE.Clock();

// --- LIGHTS ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// --- FUNDO 3D TECNOLÓGICO REDUZIDO ---
const bgGroup = new THREE.Group();
scene.add(bgGroup);

// plano fundo
const bgPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial({ color: 0xF9F7FF })
);
bgPlane.position.z = -50;
bgGroup.add(bgPlane);

// partículas leves
const particleCount = 100;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 40;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particleMat = new THREE.PointsMaterial({ color: 0x7c69a9, size: 0.3, transparent: true, opacity: 0.7 });
const particles = new THREE.Points(particleGeo, particleMat);
bgGroup.add(particles);

// linhas com bolinhas reduzidas
const lineCount = 30;
const lines = [];
for (let i = 0; i < lineCount; i++) {
    const lineGeo = new THREE.BufferGeometry();
    const points = [];
    const segments = 2 + Math.floor(Math.random() * 2);
    for (let s = 0; s < segments; s++) {
        points.push(new THREE.Vector3(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 10
        ));
    }
    lineGeo.setFromPoints(points);
    const colors = [0x7c69a9, 0x6C4BBF, 0xECE4FF];
    const lineMat = new THREE.LineBasicMaterial({ color: colors[Math.floor(Math.random() * 3)], transparent: true, opacity: 0.6 });
    const line = new THREE.Line(lineGeo, lineMat);

    const sphereMat = new THREE.MeshBasicMaterial({ color: lineMat.color, transparent: true, opacity: 0.8 });
    points.forEach(p => {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), sphereMat);
        dot.position.copy(p);
        line.add(dot);
    });

    bgGroup.add(line);
    lines.push({ line, alpha: Math.random(), speed: 0.001 + Math.random() * 0.002 });
}

// blobs roxos pequenos
const blobCount = 5;
const blobs = [];
for (let i = 0; i < blobCount; i++) {
    const blobMat = new THREE.MeshBasicMaterial({ color: 0x7c69a9, transparent: true, opacity: 0.08 });
    const blobGeo = new THREE.SphereGeometry(Math.random() * 1 + 0.3, 16, 16);
    const blob = new THREE.Mesh(blobGeo, blobMat);
    blob.position.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 10);
    bgGroup.add(blob);
    blobs.push(blob);
}

// --- PARALLAX MOUSE PARA FUNDO ---
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// --- LOAD MODEL OBJ/MTL ---
let model;
const mtlLoader = new MTLLoader();
mtlLoader.load('source.mtl', materials => {
    materials.preload();
    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.load('source.obj', obj => {
        obj.scale.set(0.03, 0.03, 0.03);
        obj.rotation.x = THREE.MathUtils.degToRad(90);
        obj.rotation.y = THREE.MathUtils.degToRad(180);
        obj.rotation.z = THREE.MathUtils.degToRad(90);
        obj.position.set(0, 0, 0);
        scene.add(obj);
        model = obj;
    });
});

// --- ANIMATE ---
function animateBackground(dt) {
    // partículas leves
    const positions = particleGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(Date.now() * 0.0005 + i) * 0.001;
    }
    particleGeo.attributes.position.needsUpdate = true;

    // linhas fade in/out lento
    lines.forEach(l => {
        l.alpha += (Math.random() > 0.5 ? 1 : -1) * l.speed * dt * 60;
        l.alpha = Math.min(Math.max(l.alpha, 0.2), 0.7);
        l.line.children.forEach(c => {
            c.material.opacity = l.alpha;
        });
        l.line.material.opacity = l.alpha;
    });

    // blobs flutuantes suaves
    blobs.forEach(b => {
        b.position.x += Math.sin(Date.now() * 0.0003) * 0.01;
        b.position.y += Math.cos(Date.now() * 0.0004) * 0.01;
    });

    // parallax fundo suave
    bgGroup.position.x += (mouseX * 2 - bgGroup.position.x) * 0.02;
    bgGroup.position.y += (-mouseY * 2 - bgGroup.position.y) * 0.02;
}

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    animateBackground(dt);

    // modelo principal olha levemente para o mouse
    if (model) {
        const targetRotY = THREE.MathUtils.degToRad(180) + mouseX * 0.2;
        const targetRotX = THREE.MathUtils.degToRad(90) - mouseY * 0.1;
        model.rotation.y += (targetRotY - model.rotation.y) * 0.05;
        model.rotation.x += (targetRotX - model.rotation.x) * 0.05;
    }

    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
}
animate();

// --- RESIZE ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
