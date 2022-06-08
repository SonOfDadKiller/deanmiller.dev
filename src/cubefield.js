import { cube as cubeMesh } from "./meshes.js";
import { mat4, vec3 } from "./../lib/glMatrix/index.js"
import * as glMatrix from "./../lib/glMatrix/index.js"

function Radians(degrees)
{
    var pi = Math.PI;
    return degrees * (pi / 180);
}

//Some bullshit
function resizeCanvasToDisplaySize(canvas)
{
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Check if the canvas is not the same size.
    const needResize = canvas.width  !== displayWidth ||
                       canvas.height !== displayHeight;
    
    if (needResize) {
        // Make the canvas the same size
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
    }
    
    return needResize;
}

//Set up canvas, webGL context and error handling
const canvas = document.querySelector('#c');
const gl = canvas.getContext("webgl2");
const errorText = document.querySelector('#error');

function LogError(message)
{
    console.error(message);
    errorText.innerHTML = message;
}

if (!gl) LogError("OpenGL 2.0 not supported");

//Shaders
var vertexShaderSource = 
`#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec3 a_cubePos;

uniform mat4 view;
uniform mat4 projection;
uniform float time;

out vec3 vert_normal;

void main()
{
    float expand = sin(pow(sin(time / 15.0), 5.0)) * 200.0;
    vec3 pos = a_cubePos * expand + a_position;

    gl_Position = projection * view * vec4(pos, 1.0);

    vert_normal = vec3(abs(a_normal.x), abs(a_normal.y), abs(a_normal.z));
}
`;

var fragmentShaderSource = 
`#version 300 es

precision highp float;

in vec3 vert_normal;

out vec4 frag_color;

void main()
{
    frag_color = vec4(vert_normal, 1);
}
`;

//Shader functions
function CreateShader(gl, type, source)
{
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success)
    {
        return shader;
    }

    //Compile failed, show log
    LogError(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function CreateShaderProgram(gl, vertShader, fragShader)
{
    var program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success)
    {
        return program;
    }

    //Compile failed, show log
    LogError(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

//Create shader program
var vertShader = CreateShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragShader = CreateShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
var shaderProgram = CreateShaderProgram(gl, vertShader, fragShader);

//Set up shader attributes
var positionAttributeLocation = gl.getAttribLocation(shaderProgram, "a_position");
var normalAttributeLocation = gl.getAttribLocation(shaderProgram, "a_normal");
var cubePosAttributeLocation = gl.getAttribLocation(shaderProgram, "a_cubePos");

var viewLocation = gl.getUniformLocation(shaderProgram, "view");
var projectionLocation = gl.getUniformLocation(shaderProgram, "projection");
var timeLocation = gl.getUniformLocation(shaderProgram, "time");

//Set up vertex array
var vao = gl.createVertexArray();
gl.bindVertexArray(vao);

//Set up vertex buffer
var vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

//Set up index buffer
const ebo = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);

//Set up attribute pointers
//Position
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 4 * 9, 0);
//Normal
gl.enableVertexAttribArray(normalAttributeLocation);
gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 4 * 9, 4 * 3);
//CubePos
gl.enableVertexAttribArray(cubePosAttributeLocation);
gl.vertexAttribPointer(cubePosAttributeLocation, 3, gl.FLOAT, false, 4 * 9, 4 * 6);

//Generate cubefield
//let cubefieldSize = 15;
let halfCubefieldSize = cubefieldSize / 2;
let totalCubeCount = Math.pow(cubefieldSize, 3);

var cubefieldVerts = new Array();
var cubefieldIndices = new Array();

cubefieldVerts.length = 24 * 9 * totalCubeCount;

let cubeIndex = 0;

for (let z = -halfCubefieldSize; z < halfCubefieldSize; z++)
{
    for (let y = -halfCubefieldSize; y < halfCubefieldSize; y++)
    {
        for (let x = -halfCubefieldSize; x < halfCubefieldSize; x++)
        {
            //Copy vert data
            let vOffset = 0;
            while (vOffset < 264)
            {
                let v = (cubeIndex * 24 * 9) + vOffset;
                cubefieldVerts[v] = cubeMesh.vertices[vOffset];
                cubefieldVerts[v + 1] = cubeMesh.vertices[vOffset + 1];
                cubefieldVerts[v + 2] = cubeMesh.vertices[vOffset + 2];
                cubefieldVerts[v + 3] = cubeMesh.vertices[vOffset + 3];
                cubefieldVerts[v + 4] = cubeMesh.vertices[vOffset + 4];
                cubefieldVerts[v + 5] = cubeMesh.vertices[vOffset + 5];
                cubefieldVerts[v + 6] = x;
                cubefieldVerts[v + 7] = y;
                cubefieldVerts[v + 8] = z;
                vOffset += 9;
            }

            cubeMesh.indices.forEach((index) => {
                cubefieldIndices.push(index + cubeIndex * 24);
            });

            cubeIndex++;
        }
    }
}

//Send vert data to buffers
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubefieldVerts), gl.STATIC_DRAW);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(cubefieldIndices), gl.STATIC_DRAW);

gl.useProgram(shaderProgram);
gl.enable(gl.DEPTH_TEST);

var timeOffset;
var firstFrame = true;

function Draw(time)
{
    if (firstFrame)
    {
        timeOffset = -time * 0.001;
        firstFrame = false;
    }

    //Convert time to seconds
    time = timeOffset + time * 0.001;

    //Resize canvas and viewport
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);

    //Calculate view matrix
    var view = mat4.create();
    let camDist = cubefieldSize * 7;
    let eye = vec3.fromValues(Math.sin(time / 20) * camDist, camDist * 0.7, Math.cos(time / 20) * camDist);
    mat4.lookAt(view, eye, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

    //Calculate projection matrix
    var projection = mat4.create();
    mat4.perspective(projection, Radians(45), gl.canvas.clientWidth / gl.canvas.clientHeight, 1, 5000);

    //Send matrices
    gl.uniformMatrix4fv(viewLocation, false, view);
    gl.uniformMatrix4fv(projectionLocation, false, projection);

    //Send time
    gl.uniform1f(timeLocation, time);

    //Clear
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //Draw
    gl.drawElements(gl.TRIANGLES, cubefieldIndices.length, gl.UNSIGNED_INT, 0);

    //Loop
    requestAnimationFrame(Draw);
}

requestAnimationFrame(Draw);