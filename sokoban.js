import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

const lerp = (x, y, a) => x + a * (y - x);
const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
const invlerp = (x, y, a) => clamp((a - x) / (y - x));
const range = (x1, y1, x2, y2, a) => lerp(x2, y2, invlerp(x1, y1, a));
function smoothStep(x) { //Normal smoothstep
    return -2 * Math.pow(x, 3) + 3 * Math.pow(x, 2);
}

function Resize(Renderer) {
    const Canvas = Renderer.domElement;
    const Dirty = Canvas.width != Canvas.clientWidth || Canvas.height != Canvas.clientHeight;
    if (Dirty) {
        Renderer.setSize(Canvas.clientWidth, Canvas.clientHeight, false);
    }
    return Dirty;
}

const Canvas = document.querySelector('#c');
const Renderer = new THREE.WebGLRenderer({ canvas: Canvas, antialias: true });

const Scene = new THREE.Scene();
const Camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const MousePos = { x: 0, y: 0 };
clearPickPosition();

function getCanvasRelativePosition(event) {
    const rect = Canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * Canvas.width / rect.width,
        y: (event.clientY - rect.top) * Canvas.height / rect.height,
    };
}

function setPickPosition(event) {
    const pos = getCanvasRelativePosition(event);
    MousePos.x = (pos.x / Canvas.width) * 2 - 1;
    MousePos.y = (pos.y / Canvas.height) * -2 + 1;
}

function clearPickPosition() {
    MousePos.x = -100000;
    MousePos.y = -100000;
}

window.addEventListener('mousemove', setPickPosition);
window.addEventListener('mouseout', clearPickPosition);
window.addEventListener('mouseleave', clearPickPosition);

window.addEventListener('touchstart', (event) => {
    // prevent the window from scrolling
    event.preventDefault();
    setPickPosition(event.touches[0]);
}, { passive: false });

window.addEventListener('touchmove', (event) => {
    setPickPosition(event.touches[0]);
});

window.addEventListener('touchend', clearPickPosition);

const Raycaster = new THREE.Raycaster();

function MouseHit(object) {
    Raycaster.setFromCamera(MousePos, Camera);
    var intersections = Raycaster.intersectObject(object);
    if (intersections.length > 0) {
        return true;
    }
    return false;
}

function Run() {

    Camera.aspect = Canvas.clientWidth / Canvas.clientHeight;
    Camera.updateProjectionMatrix();

    const Red = new THREE.MeshPhongMaterial({ color: 0xff0000, flatShading: false });
    const Green = new THREE.MeshPhongMaterial({ color: 0x00ff00, flatShading: false });
    const Blue = new THREE.MeshPhongMaterial({ color: 0x0000ff, flatShading: false });

    const AmbientLight = new THREE.AmbientLight(0xFFFFFF, 0.01);
    //Scene.add(AmbientLight);

    const PointLight = new THREE.PointLight(0xFFFFFF, 99999);
    PointLight.position.set(0, 20, 100);
    PointLight.distance = 1000;
    Scene.add(PointLight);

    var TextChars = [];
    const Loader = new FontLoader();
    Loader.load('assets/fonts/Roboto Condensed_Regular.json', function (font) {

        const title = 'Sokoban';
        for (var i = 0; i < title.length; i++) {
            const TextGeo = new TextGeometry(title[i], {
                font: font,
                size: 80,
                depth: 2,
                curveSegments: 24,
                bevelEnabled: true,
                bevelThickness: 500,
                bevelSize: 0,
                bevelOffset: 0,
                bevelSegments: 24
            });

            // Text
            TextChars.push(new THREE.Mesh(TextGeo, Green));
            TextChars[i].position.set(-190 + i * 55, 500, -300);
            Scene.add(TextChars[i]);
        }
    });

    Camera.position.z = 500;

    const SpikySphereMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00, flatShading: false });
    const SphereGeometry = new THREE.SphereGeometry(25, 64, 64);
    const Sphere = new THREE.Mesh(SphereGeometry, SpikySphereMaterial);
    Sphere.position.set(0, -100, 0);

    const SpikeGeometry = new THREE.ConeGeometry(10, 200);

    const SpikesPerRing = 20;
    const SpikeRings = 10;
    for (var SpikeRing = 0; SpikeRing < SpikeRings; SpikeRing++) {
        var Spikes = new THREE.Object3D();
        for (var SpikeIndex = 0; SpikeIndex < SpikesPerRing; SpikeIndex++) {
            var Phase = (SpikeIndex / SpikesPerRing) * Math.PI * 2;
            const Spike = new THREE.Mesh(SpikeGeometry, SpikySphereMaterial);
            Spike.position.x = Math.sin(Phase) * 50;
            Spike.position.y = Math.cos(Phase) * 50;
            Spike.rotation.z = -Phase;
            Spikes.add(Spike);
        }

        var Phase = (SpikeRing / SpikeRings) * Math.PI;
        Spikes.rotation.x = Phase;
        Sphere.add(Spikes);
    }

    Scene.add(Sphere);
    var SphereScale = 0;


    const Clock = new THREE.Clock();
    var Time = 0;

    function Draw() {
        Time += Clock.getDelta();

        // Resize canvas if necessary
        if (Resize(Renderer)) {
            Camera.aspect = Canvas.clientWidth / Canvas.clientHeight;
            Camera.updateProjectionMatrix();
        }

        for (var i = 0; i < TextChars.length; i++) {
            var StartZPos = -1000;
            var DesiredZPos = -300;

            TextChars[i].position.y = 100 + Math.sin(Time * 0.8 + i * 2) * 10;
            TextChars[i].position.z = lerp(StartZPos, DesiredZPos, smoothStep(clamp(Time / 8 - 0.05, 0, 1)));
        }

        PointLight.position.z = 500;

        var SphereGoalScale = 0.45;
        SpikySphereMaterial.color.set(0x00ff00);
        if (MouseHit(Sphere)) {
            SphereGoalScale = 0.75;
            SpikySphereMaterial.color.set(0xffffff);
        }
        SphereScale = lerp(SphereScale, SphereGoalScale, 0.05);

        Sphere.scale.x = SphereScale + Math.sin(Time) * (SphereScale / 2);
        Sphere.scale.y = SphereScale + Math.cos(Time * 1.4) * (SphereScale / 2);
        Sphere.scale.z = SphereScale + Math.sin(Time * 1.2) * (SphereScale / 2);

        Sphere.rotation.set(Time, Time, Time);
        Renderer.render(Scene, Camera);
    }

    Renderer.setAnimationLoop(Draw);
}

Run();


