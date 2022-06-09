import { cube as cubeMesh } from "./meshes.js";
import { mat4, vec3 } from "./../lib/glMatrix/index.js"
import * as glMatrix from "./../lib/glMatrix/index.js"

export function GenerateCubefield(cubefieldSize)
{
    //Helper functions
    function Radians(degrees)
    {
        return degrees * (Math.PI / 180);
    }

    function ResizeCanvasToDisplaySize(canvas)
    {
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) 
        {
            canvas.width  = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }
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

    if (!gl)
    {
        LogError("OpenGL 2.0 not supported");
        return;
    }

    //Shaders
    let vertexShaderSource = 
    `#version 300 es

    in vec3 a_position;
    in vec3 a_normal;
    in vec3 a_cubePos;

    uniform mat4 view;
    uniform mat4 projection;
    uniform float expand;
    uniform float scale;

    out vec3 vert_normal;

    void main()
    {
        vec3 pos = a_cubePos * expand + a_position * scale;
        gl_Position = projection * view * vec4(pos, 1.0);
        vert_normal = a_normal;
    }
    `;

    let fragmentShaderSource = 
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
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
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
        let program = gl.createProgram();
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        let success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success)
        {
            return program;
        }

        //Compile failed, show log
        LogError(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    //Create shader program
    let vertShader = CreateShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    let fragShader = CreateShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    let shaderProgram = CreateShaderProgram(gl, vertShader, fragShader);

    //Set up shader attributes
    let positionAttributeLocation = gl.getAttribLocation(shaderProgram, "a_position");
    let normalAttributeLocation = gl.getAttribLocation(shaderProgram, "a_normal");
    let cubePosAttributeLocation = gl.getAttribLocation(shaderProgram, "a_cubePos");

    let viewLocation = gl.getUniformLocation(shaderProgram, "view");
    let projectionLocation = gl.getUniformLocation(shaderProgram, "projection");
    let expandLocation = gl.getUniformLocation(shaderProgram, "expand");
    let scaleLocation = gl.getUniformLocation(shaderProgram, "scale");

    //Set up vertex array
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    //Set up vertex buffer
    let vbo = gl.createBuffer();
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

    let cubefieldVerts = new Array();
    let cubefieldIndices = new Array();

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

    //Camera controls
    let camRotation = 30;
    let camGoalRotation = camRotation;
    let camDragStartRotation = camRotation;

    let mousePosX, mousePosY;
    let dragStartX, dragStartY;
    let dragging = false;

    //Set up mouse events
    window.addEventListener("mousedown", (event) => {
        dragStartX = mousePosX;
        dragStartY = mousePosY;
        camDragStartRotation = camGoalRotation;
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
        LogError(firstTouch.clientX + ", " + firstTouch.clientY);

        dragStartX = firstTouch.clientX;
        dragStartY = firstTouch.clientY;
        camDragStartRotation = camGoalRotation;
        dragging = true;
    });

    window.addEventListener("touchmove", (event) => {
        var firstTouch = event.touches.item(0);
        LogError(firstTouch.clientX + ", " + firstTouch.clientY);

        mousePosX = firstTouch.clientX;
        mousePosY = firstTouch.clientY;
    });

    window.addEventListener("touchend", (event) => {
        dragging = false;
    });

    gl.useProgram(shaderProgram);
    gl.enable(gl.DEPTH_TEST);

    let timeOffset;
    let firstFrame = true;

    function Draw(time)
    {
        //Get mouse delta
        if (dragging)
        {
            let mouseDragDeltaX = mousePosX - dragStartX;
            let mouseDragDeltaY = mousePosY - dragStartY;
            camGoalRotation = camDragStartRotation - mouseDragDeltaX;
        }

        //Rotate camera towards goal using decay function
        camRotation += (camGoalRotation - camRotation) / 50;

        //make sure we start at zero
        if (firstFrame)
        {
            timeOffset = -time * 0.001;
            firstFrame = false;
        }

        //Convert time to seconds
        time = timeOffset + time * 0.001;

        //Resize canvas and viewport
        ResizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);

        //Calculate view matrix
        let view = mat4.create();
        let camDist = cubefieldSize * 7;
        let eye = vec3.fromValues(Math.sin(Radians(camRotation)) * camDist, camDist * 0.685, Math.cos(Radians(camRotation)) * camDist);
        mat4.lookAt(view, eye, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

        //Calculate projection matrix
        let projection = mat4.create();
        mat4.perspective(projection, Radians(45), gl.canvas.clientWidth / gl.canvas.clientHeight, 1, 4000);

        //Send matrices
        gl.uniformMatrix4fv(viewLocation, false, view);
        gl.uniformMatrix4fv(projectionLocation, false, projection);

        //Send expand and scale
        const expand = 0.3 + Math.abs(Math.sin(Math.pow(Math.sin(time / 10.0), 3.0))) * 150.0;
        const scale = 1.0 + (expand / 40.0);
        gl.uniform1f(expandLocation, expand);
        gl.uniform1f(scaleLocation, scale);

        //Clear
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        //Draw
        gl.drawElements(gl.TRIANGLES, cubefieldIndices.length, gl.UNSIGNED_INT, 0);

        //Loop
        requestAnimationFrame(Draw);
    }

    requestAnimationFrame(Draw);
}
