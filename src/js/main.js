const { mat4, vec3 } = glMatrix;

class RenderableObject {
  constructor (gl, vertices, indices, shaderProgramInfo, position, scale, texture_name) {
    this.gl = gl
    this.shaderProgramInfo = shaderProgramInfo
    this.position = position
    this.scale = scale
    // create a vao for the object
    this.vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(this.vao)
    // load vertices
    const vertexBuffer = gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer)
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(vertices),
      this.gl.STATIC_DRAW
    )
    // setup vertex attrib array
    const numComponents = 3
    const type = this.gl.FLOAT
    const normalize = false
    const stride = 4 * 8  // sizeof Float32 * 8
    const offset = 0
    this.gl.vertexAttribPointer(
      shaderProgramInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    )
    this.gl.enableVertexAttribArray(
      shaderProgramInfo.attribLocations.vertexPosition
    )
    // texture info
    this.gl.vertexAttribPointer(
      shaderProgramInfo.attribLocations.textureCoord,
      2,
      this.gl.FLOAT,
      normalize,
      stride,
      4 * 3  // sizeof Float32 * 3
    )
    this.gl.enableVertexAttribArray(
      shaderProgramInfo.attribLocations.textureCoord
    )
    // load indices
    const indicesBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      this.gl.STATIC_DRAW
    )
    this.vertexCount = indices.length
    // load texture
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);
  
    const image = new Image()
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    srcFormat, srcType, image)
      gl.generateMipmap(gl.TEXTURE_2D)
    }
    image.src = `assets/textures/${texture_name}`
  }

  render (viewMatrix) {
    const fieldOfView = 45 * Math.PI / 180 // in radians
    const canvas = document.getElementById('my-canvas')
    let aspect
    if (document.fullscreenElement == canvas) {
      canvas.width = screen.width
      canvas.height = screen.height
      aspect = screen.width / screen.height 
      this.gl.viewport(0, 0, screen.width, screen.height)
    } else {
      canvas.width = 1280
      canvas.height = 720
      aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight
      this.gl.viewport(0, 0, 1280, 720)
    }
    const zNear = 0.1
    const zFar = 1000.0
    const projectionMatrix = mat4.create()

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(
      projectionMatrix,
      fieldOfView,
      aspect,
      zNear,
      zFar
    )

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelMatrix = mat4.create()

    mat4.scale(
      modelMatrix,
      modelMatrix,
      [this.scale, this.scale, this.scale]
   )

    mat4.translate(
      modelMatrix,
      modelMatrix,
      this.position
    )

    this.gl.bindVertexArray(this.vao)
    this.gl.useProgram(this.shaderProgramInfo.program)

    // Set the shader uniforms
    this.gl.uniformMatrix4fv(
      this.shaderProgramInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix
    )

    this.gl.uniformMatrix4fv(
      this.shaderProgramInfo.uniformLocations.modelMatrix,
      false,
      modelMatrix
    )

    this.gl.uniformMatrix4fv(
      this.shaderProgramInfo.uniformLocations.viewMatrix,
      false,
      viewMatrix
    )

    this.gl.drawElements(this.gl.TRIANGLES, this.vertexCount, this.gl.UNSIGNED_SHORT, 0)
  }
}

class Movement {
  constructor() {
    this.w = null
    this.a = null
    this.s = null
    this.d = null
    window.addEventListener('keydown', e => {
      if (['w', 'a', 's', 'd'].includes(e.key)) {
        this[e.key] = Date.now()
      }
    })

    window.addEventListener('keyup', e => {
      if (['w', 'a', 's', 'd'].includes(e.key)) {
        this[e.key] = null
      }
    })
  }
}

class Mouse {
  constructor() {
    const canvas = document.getElementById('my-canvas')
    this.x = 0
    this.y = 0
    document.addEventListener('mousemove', e => {
      if (document.pointerLockElement === canvas) {
        this.x += e.movementX
        this.y += e.movementY
      }
    })
  }

  positionDelta() {
    const currentPos = [this.x, this.y]
    this.x = 0
    this.y = 0
    return currentPos
  }
}

const degToRad = deg => {
  return deg * (Math.PI / 180)
}

class Camera {
  constructor (position) {
    this.position = vec3.fromValues(
      position[0],
      position[1],
      position[2]
    )
    this.front = vec3.fromValues(0.0, 0.0, -1.0)
    this.up = vec3.fromValues(0.0, 1.0, 0.0)
    this.yaw = 270
    this.pitch = 0
    this.movement = new Movement()
    this.mouse = new Mouse()
  }

  update() {
    // update the angle
    const positionDelta = this.mouse.positionDelta()
    this.yaw += positionDelta[0] * 0.2
    this.pitch += positionDelta[1] * -0.2
    const direction = [
      Math.cos(degToRad(this.yaw)) * Math.cos(degToRad(this.pitch)),
      Math.sin(degToRad(this.pitch)),
      Math.sin(degToRad(this.yaw)) * Math.cos(degToRad(this.pitch))
    ]
    vec3.normalize(this.front, direction)

    // update the position
    const cameraDelta = vec3.create()
    vec3.scaleAndAdd(
      this.position,
      this.position,
      this.front,
      0.3 * Math.min(Math.max(this.movement.w - this.movement.s, -1), 1)
    )

    const tempVec = vec3.create()
    vec3.cross(
      tempVec,
      this.front,
      this.up
    )
    vec3.normalize(
      tempVec,
      tempVec
    )
    vec3.scale(
      tempVec,
      tempVec,
      0.3 * Math.min(Math.max(this.movement.d - this.movement.a, -1), 1)
    )
    vec3.add(
      this.position,
      this.position,
      tempVec
    )

    this.position = vec3.fromValues(
      this.position[0],
      8,
      this.position[2]
    )
  }
}

const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
    }
`

const fragmentShaderSource = `
    precision mediump float;

    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main() {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
`

function initShaderProgram (gl, vertexShaderSource, fragmentShaderSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

  // Create the shader program

  const shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram))
    return null
  }

  return shaderProgram
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
  
    // Send the source to the shader object
  
    gl.shaderSource(shader, source);
  
    // Compile the shader program
  
    gl.compileShader(shader);
  
    // See if it compiled successfully
  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
  
    return shader;
  }

function drawScene (gl, camera, renderableObjects) {
  gl.clearColor(0.52, 0.8, 0.98, 1.0) // Clear to black, fully opaque
  gl.clearDepth(1.0) // Clear everything
  gl.enable(gl.DEPTH_TEST) // Enable depth testing
  gl.depthFunc(gl.LEQUAL) // Near things obscure far things

  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  const viewMatrix = mat4.create()
  const target = vec3.create()
  vec3.add(target, camera.position, camera.front)
  mat4.lookAt(
    viewMatrix,
    camera.position,
    target,
    camera.up
  )

  for (const renderableObject of renderableObjects) {
    renderableObject.render(viewMatrix)
  }
}

function main () {
  const canvas = document.getElementById('my-canvas')
  canvas.addEventListener('click', e => {
    canvas.requestPointerLock()
    canvas.requestFullscreen()
  })
  const gl = canvas.getContext('webgl2')

  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.")
    return
  }
  console.log('Got WebGL context')

  const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource)

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord')
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelMatrix: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
      viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
    }
  }

  const renderableObjects = []

  renderableObjects.push(new RenderableObject(
    gl,
    [
      -100.0, 0.0, 100.0, 0.2, 0.54, 0.0, 0.0, 0.0,
      -100.0, 0.0, -100.0, 0.2, 0.54, 0.0, 0.0, 0.0,
      100.0, 0.0, -100.0, 0.2, 0.54, 0.0, 0.0, 0.0,
      100.0, 0.0, 100.0, 0.2, 0.54, 0.0, 0.0, 0.0
    ],
    [0, 1, 2, 2, 3, 0],
    programInfo,
    [0.0, 0.0, 0.0],
    1,
    'apple_tree.jpg'
  ))

  const modelReq = new XMLHttpRequest()
  modelReq.addEventListener('load', data => {
    modelData = JSON.parse(modelReq.response)
    renderableObjects.push(new RenderableObject(
      gl,
      modelData.vertices,
      modelData.indices,
      programInfo,
      [0.0, 0.0, 0.0],
      5,
      'apple_tree.jpg'
    ))
  })
  modelReq.open('GET', 'model/apple_tree.obj')
  modelReq.send()

  const camera = new Camera([0, 8, 30])

  tick = () => {
    camera.update()
    drawScene(gl, camera, renderableObjects)
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}


window.onload = main