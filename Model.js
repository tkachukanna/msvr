class Model {
    constructor(gl, uSteps, vSteps, L, T, B) {
        this.gl = gl;
        this.uSteps = uSteps;
        this.vSteps = vSteps;
        this.L = L; 
        this.T = T;
        this.B = B; 

        this.uMin = 0.0;
        this.uMax = 1.0;
        this.vMin = -0.3;
        this.vMax = 1.0;

        this.uLinesPlus = [];
        this.uLinesMinus = [];
        this.vLinesPlus = [];
        this.vLinesMinus = [];
        this.generateWireframeData();

        let filledData = this.generateFilledSurfaceData();
        this.vertices = filledData.vertices;
        this.indices = filledData.indices;
        this.count = this.indices.length;

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    }

    generateWireframeData() {
        for (let j = 0; j <= this.vSteps; j++) {
            let vVal = this.vMin + (this.vMax - this.vMin) * (j / this.vSteps);
            let oneULinePlus = [];
            let oneULineMinus = [];
            for (let i = 0; i <= this.uSteps; i++) {
                let uVal = this.uMin + (this.uMax - this.uMin) * (i / this.uSteps);
                let vertPlus = this.calculateVertex(uVal, vVal, +1);
                let vertMinus = this.calculateVertex(uVal, vVal, -1);
                oneULinePlus.push(...vertPlus);
                oneULineMinus.push(...vertMinus);
            }
            this.uLinesPlus.push(oneULinePlus);
            this.uLinesMinus.push(oneULineMinus);
        }

        for (let i = 0; i <= this.uSteps; i++) {
            let uVal = this.uMin + (this.uMax - this.uMin) * (i / this.uSteps);
            let oneVLinePlus = [];
            let oneVLineMinus = [];
            for (let j = 0; j <= this.vSteps; j++) {
                let vVal = this.vMin + (this.vMax - this.vMin) * (j / this.vSteps);
                let vertPlus = this.calculateVertex(uVal, vVal, +1);
                let vertMinus = this.calculateVertex(uVal, vVal, -1);
                oneVLinePlus.push(...vertPlus);
                oneVLineMinus.push(...vertMinus);
            }
            this.vLinesPlus.push(oneVLinePlus);
            this.vLinesMinus.push(oneVLineMinus);
        }
    }

    calculateVertex(u, v, sign) {
        const X = this.L * (1 - u);
        const Y = sign * 2.5426 * this.B * v * Math.sqrt((3 * (1 - v)) / (1 + 3 * v)) * u;
        const Z = ((Math.sqrt(3)*this.T)/3)*(1-u) + u*v*this.T;
        return [X, Y, Z];
    }

    generateFilledSurfaceData() {
        let verticesPlus = [];
        let verticesMinus = [];
        let indicesPlus = [];
        let indicesMinus = [];

        for (let j = 0; j <= this.vSteps; j++) {
            let v = this.vMin + (this.vMax - this.vMin) * (j / this.vSteps);
            for (let i = 0; i <= this.uSteps; i++) {
                let u = this.uMin + (this.uMax - this.uMin) * (i / this.uSteps);
                let vert = this.calculateVertex(u, v, +1);
                verticesPlus.push(...vert);
            }
        }

        for (let j = 0; j <= this.vSteps; j++) {
            let v = this.vMin + (this.vMax - this.vMin) * (j / this.vSteps);
            for (let i = 0; i <= this.uSteps; i++) {
                let u = this.uMin + (this.uMax - this.uMin) * (i / this.uSteps);
                let vert = this.calculateVertex(u, v, -1);
                verticesMinus.push(...vert);
            }
        }

        for (let j = 0; j < this.vSteps; j++) {
            for (let i = 0; i < this.uSteps; i++) {
                let index = j * (this.uSteps + 1) + i;
                indicesPlus.push(index, index + 1, index + this.uSteps + 1);
                indicesPlus.push(index + 1, index + this.uSteps + 2, index + this.uSteps + 1);
            }
        }

        let offset = (this.uSteps + 1) * (this.vSteps + 1);
        for (let j = 0; j < this.vSteps; j++) {
            for (let i = 0; i < this.uSteps; i++) {
                let index = j * (this.uSteps + 1) + i + offset;
                indicesMinus.push(index, index + this.uSteps + 1, index + 1);
                indicesMinus.push(index + 1, index + this.uSteps + 1, index + this.uSteps + 2);
            }
        }

        let vertices = verticesPlus.concat(verticesMinus);
        let indices = indicesPlus.concat(indicesMinus);
        return {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices)
        };
    }

    draw() {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    drawWireframe(shaderProgram) {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.iAttribVertex);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        for (let i = 0; i < this.count; i += 3) {
            gl.drawElements(gl.LINE_LOOP, 3, gl.UNSIGNED_SHORT, i * 2);
        }
    }
}