const { mat4 } = glMatrix;

class RenderableObject {
  constructor (gl, vertices, indices, shaderProgramInfo, position, scale, color) {
    this.gl = gl
    this.shaderProgramInfo = shaderProgramInfo
    this.position = position
    this.scale = scale
    this.color = color
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
    const stride = 0
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
    // load indices
    const indicesBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      this.gl.STATIC_DRAW
    )
    this.vertexCount = indices.length
  }

  render (viewMatrix) {
    const fieldOfView = 45 * Math.PI / 180 // in radians
    const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight
    const zNear = 0.1
    const zFar = 100.0
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

    this.gl.uniform4fv(
      this.shaderProgramInfo.uniformLocations.color,
      this.color
    )

    this.gl.drawElements(this.gl.TRIANGLES, this.vertexCount, this.gl.UNSIGNED_SHORT, 0)
  }
}

class Camera {
  constructor (position) {
    this.position = position
    this.lookAt = [
      this.position[0],
      this.position[1],
      this.position[2] - 30
    ]
    window.addEventListener('keydown', e => {
      switch (e.key) {
        case 'w':
          this.position[2] -= 1
          this.lookAt[2] -= 1
          break
        case 'a':
          this.position[0] -= 1
          this.lookAt[0] -= 1
          break
        case 's':
          this.position[2] += 1
          this.lookAt[2] += 1
          break
        case 'd':
          this.position[0] += 1
          this.lookAt[0] += 1
          break
      }
      console.log('---')
      console.log(this.position)
      console.log(this.lookAt)
      console.log('---')
    })
  }
}

const vertexShaderSource = `
    attribute vec4 aVertexPosition;

    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
    }
`

const fragmentShaderSource = `
    precision mediump float;

    uniform vec4 uColor;

    void main() {
        gl_FragColor = uColor;
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
  mat4.lookAt(
    viewMatrix,
    camera.position,
    [0, 8, 0],
    [0, 1, 0]
  )

  for (const renderableObject of renderableObjects) {
    renderableObject.render(viewMatrix)
  }
}

function main () {
  const canvas = document.getElementById('my-canvas')
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
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition')
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelMatrix: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
      viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
      color: gl.getUniformLocation(shaderProgram, 'uColor')
    }
  }

  const renderableObjects = []

  const cube = new RenderableObject(
    gl,
    CubeData.vertices,
    CubeData.indices,
    programInfo,
    [0.0, 1.0, 0.0],
    0,
    [1.0, 0.0, 0.0, 1.0]
  )
  renderableObjects.push(cube)

  renderableObjects.push(new RenderableObject(
    gl,
    [-100, 0, 100, -100, 0, -100, 100, 0, -100, 100, 0, 100],
    [0, 1, 2, 2, 3, 0],
    programInfo,
    [0.0, 0.0, 0.0],
    0,
    [0.0, 1.0, 0.0, 1.0]
  ))

  const camera = new Camera([0, 8, 30])

  tick = () => {
    drawScene(gl, camera, renderableObjects)
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}


window.onload = main
