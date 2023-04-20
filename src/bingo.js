import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import WebGL from '/src/WebGL.js';
import { ericisms } from '/src/bingo_terms.js';

//Helper functions
function Radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

//Set up renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//Set up scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;
camera.lookAt(0, 0, 0);
const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
dirLight.position.set(-1, 2, 4);
scene.add(dirLight);

let sqrtCubeCount = 3;
let halfSqrtCubeCount = sqrtCubeCount / 2.0;

class BingoCube {
    constructor(x, y, z, label) {
        this.x = x;
        this.y = y;
        this.z = z;

        //Create cube
        var cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        this.cubeMat = new THREE.MeshLambertMaterial();

        this.cube = new THREE.Mesh(cubeGeo, this.cubeMat);
        this.cube.position.x = x - halfSqrtCubeCount + 0.5;
        this.cube.position.y = y - halfSqrtCubeCount + 0.5;
        this.cube.position.z = z - halfSqrtCubeCount + 0.5;

        //Create label quad
        var labelCanvas = document.createElement('canvas');
        labelCanvas.width = 512;
        labelCanvas.height = 512;

        //Label canvas
        var ctx = labelCanvas.getContext("2d");
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.0;
        ctx.fillRect(0, 0, 512, 512);

        ctx.globalAlpha = 1.0;

        ctx.strokeStyle = '#AAAAAA';
        ctx.lineWidth = 2;
        ctx.strokeRect(80, 220, 370, 50);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(80, 220, 370, 50);

        ctx.font = "35px verdana";
        ctx.textAlign = "center";
        ctx.fillStyle = '#FF0000';
        ctx.globalAlpha = 1.0;
        ctx.fillText(label, 256, 256, 512);

        var labelGeo = new THREE.PlaneGeometry(2, 2);
        var labelMat = new THREE.MeshBasicMaterial();
        labelMat.map = new THREE.Texture(labelCanvas);
        labelMat.map.needsUpdate = true;
        labelMat.transparent = true;
        this.labelQuad = new THREE.Mesh(labelGeo, labelMat);
        this.labelQuad.position.x = x - halfSqrtCubeCount + 0.5;
        this.labelQuad.position.y = y - halfSqrtCubeCount + 0.5;
        this.labelQuad.position.z = z - halfSqrtCubeCount + 0.5;

        //Draw label on top
        this.labelQuad.renderOrder = 999;
        this.labelQuad.onBeforeRender = function (renderer) { renderer.clearDepth(); };

        scene.add(this.cube);
        scene.add(this.labelQuad);
    }
}

//Generate cubes
let bingoCubes = new Array();
var cubeIndex = 0;
for (let z = 0; z < sqrtCubeCount; z++) {
    for (let y = 0; y < sqrtCubeCount; y++) {
        for (let x = 0; x < sqrtCubeCount; x++) {
            bingoCubes.push(new BingoCube(x, y, z, ericisms[cubeIndex]));
            cubeIndex++;
        }
    }
}

//Camera controls
let camRotationX = 45;
let camRotationY = 45;
let camGoalRotationX = camRotationX;
let camGoalRotationY = camRotationY;
let camDragStartRotationX = camRotationX;
let camDragStartRotationY = camRotationY;

let mousePosX, mousePosY;
let dragStartX, dragStartY;
let dragging = false;

//Set up mouse events
window.addEventListener("mousedown", (event) => {
    dragStartX = mousePosX;
    dragStartY = mousePosY;
    camDragStartRotationX = camGoalRotationX;
    camDragStartRotationY = camGoalRotationY;
    dragging = true;
});

window.addEventListener("mousemove", (event) => {
    mousePosX = event.x;
    mousePosY = event.y;
});

window.addEventListener("mouseup", (event) => {
    dragging = false;
});

window.addEventListener("wheel", (event) => {
    //event.deltaY
});

//Set up touch events
window.addEventListener("touchstart", (event) => {
    var firstTouch = event.touches.item(0);
    dragStartX = firstTouch.clientX;
    dragStartY = firstTouch.clientY;
    camDragStartRotationX = camGoalRotationX;
    camDragStartRotationY = camGoalRotationY;
    dragging = true;
});

window.addEventListener("touchmove", (event) => {
    var firstTouch = event.touches.item(0);
    let mouseDragDeltaX = firstTouch.clientX - dragStartX;
    let mouseDragDeltaY = firstTouch.clientY - dragStartY;
    camGoalRotationX = camDragStartRotationX - mouseDragDeltaX;
    camGoalRotationY = camDragStartRotationY - mouseDragDeltaY;
});

window.addEventListener("touchend", (event) => {
    dragging = false;
});

let timeOffset;
let firstFrame = true;

function animate(time) {
    //make sure we start at zero
    if (firstFrame) {
        timeOffset = -time * 0.001;
        firstFrame = false;
    }

    //Convert time to seconds
    time = timeOffset + time * 0.001;

    //Get mouse delta
    if (dragging) {
        let mouseDragDeltaX = mousePosX - dragStartX;
        let mouseDragDeltaY = mousePosY - dragStartY;
        camGoalRotationX = camDragStartRotationX - mouseDragDeltaX * 0.2;
        camGoalRotationY = camDragStartRotationY - mouseDragDeltaY * 0.2;
        camGoalRotationY = clamp(camGoalRotationY, 45, 135);
        console.log(camGoalRotationY);
    }

    //Rotate camera towards goal using decay function
    camRotationX += (camGoalRotationX - camRotationX) / 10;
    camRotationY += (camGoalRotationY - camRotationY) / 10;

    //Update camera position and rotation
    camera.position.setFromSphericalCoords(4.0, Radians(-camRotationY), Radians(camRotationX));
    camera.lookAt(0, 0, 0);

    //Update bingo cubes
    bingoCubes.forEach((bingoCube) => {
        //Label billboarding
        bingoCube.labelQuad.setRotationFromQuaternion(camera.quaternion);

        //Order by depth in scene
        // const cubePosition = new THREE.Vector3(bingoCube.x, bingoCube.y, bingoCube.z);
        // var cameraWorldDir = new THREE.Vector3();
        // camera.getWorldDirection(cameraWorldDir);
        // const distance = camera.position.clone().sub(cubePosition).dot(cameraWorldDir);

        // // Set the renderOrder property based on the distance
        // bingoCube.labelQuad.renderOrder = distance;
    })

    renderer.render(scene, camera);

    requestAnimationFrame(animate);
}

//Perform WebGL check
if (WebGL.isWebGLAvailable()) {
    //Startup
    requestAnimationFrame(animate);
} else {
    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById('container').appendChild(warning);
}
