const CubeData = new function(){
  this.vertices = [
    // back
    -1.0, 1.0, -1.0, // top left
    -1.0, -1.0, -1.0, // bottom left
    1.0, -1.0, -1.0, // bottom right
    1.0, 1.0, -1.0, // top right
    // front
    -1.0, 1.0, 1.0, // top left
    -1.0, -1.0, 1.0, // bottom left
    1.0, -1.0, 1.0, // bottom right
    1.0, 1.0, 1.0 // top right
  ]

  this.indices = [
    // back
    0, 1, 2, // top left
    2, 3, 0, // bottom right
    // right
    2, 3, 7, // top left
    2, 7, 6, // bottom right
    // left
    0, 4, 5, // top left
    5, 1, 0, // bottom right
    // bottom
    5, 1, 6, // top left
    1, 6, 2,
    // top
    0, 4, 3,
    4, 7, 3,
    // front
    4, 5, 6, // top left
    6, 7, 4, // bottom right
  ]
}()
