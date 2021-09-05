from flask import Flask
from flask_cors import CORS, cross_origin

import parse
import struct

import json
import os

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

def floatToBits(f):
    s = struct.pack('>f', f)
    return struct.unpack('>l', s)[0]

def read_obj(f):
    vertices = []
    v_parse = parse.compile('v {:f} {:f} {:f}\n')

    uvs = []
    vt_parse = parse.compile('vt {:f} {:f}\n')

    normals = []
    vn_parse = parse.compile('vn {:f} {:f} {:f}\n')

    faces = []
    f_parse = parse.compile('f {:d}/{:d}/{:d} {:d}/{:d}/{:d} {:d}/{:d}/{:d}\n')

    for line in f:
        if line.startswith('v '):
            vertices.append(v_parse.parse(line).fixed)
        if line.startswith('vt '):
            uvs.append(vt_parse.parse(line).fixed)
        if line.startswith('vn '):
            normals.append(vn_parse.parse(line).fixed)
        if line.startswith('f '):
            faces.append(f_parse.parse(line).fixed)

    vertex_index = {}
    vertex_buffer = []
    index_buffer = []
    index_count = 0
    for face in faces:
        face_indices = (face[0:3], face[3:6], face[6:9])
        for index in face_indices:
            vertex_data = (*vertices[index[0] - 1], *uvs[index[1] - 1], *normals[index[2] - 1])
            if vertex_data in vertex_index:
                index_buffer.append(vertex_index[vertex_data])
            else:
                vertex_index[vertex_data] = index_count
                index_buffer.append(index_count)
                vertex_buffer += vertex_data
                index_count += 1
    payload = {
        'vertices': vertex_buffer,
        'indices': index_buffer
    }
    return json.dumps(payload)
            
    
@cross_origin
@app.route('/model/<filename>')
def model(filename):
    path = f'../../assets/models/{filename}'
    if not os.path.exists(path):
        return '', 404
    with open(path, 'r') as f:
        return read_obj(f)