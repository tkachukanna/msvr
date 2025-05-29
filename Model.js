class Model {
    constructor(uSteps, vSteps, L, T, B) {
        this.uSteps = uSteps;
        this.vSteps = vSteps;
        this.L = L; 
        this.T = T;
        this.B = B; 

        let filledData = this.generateFilledSurfaceData();
        this.vertices = filledData.vertices;
        this.indices = filledData.indices;
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
        const cols = this.uSteps + 1;

        for (let j = 0; j <= this.vSteps; j++) {
            const v = j / this.vSteps;
            for (let i = 0; i <= this.uSteps; i++) {
                const u = i / this.uSteps;
                verticesPlus.push(...this.calculateVertex(u, v, +1));
                verticesMinus.push(...this.calculateVertex(u, v, -1));
            }
        }

        for (let j = 0; j < this.vSteps; j++) {
            for (let i = 0; i < this.uSteps; i++) {
                const b = j * cols + i;
                indicesPlus.push(b, b + 1, b + cols, b + 1, b + cols + 1, b + cols);
            }
        }

        const offset = cols * (this.vSteps + 1);
        for (let j = 0; j < this.vSteps; j++) {
            for (let i = 0; i < this.uSteps; i++) {
                const b = j * cols + i + offset;
                indicesMinus.push(b, b + cols, b + 1, b + 1, b + cols, b + cols + 1);
            }
        }

        return {
            vertices: new Float32Array(verticesPlus.concat(verticesMinus)),
            indices:  new Uint16Array(indicesPlus.concat(indicesMinus))
        };
    }


    createThreeJsMesh(color = 0x44ff44) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(this.vertices, 3));
        geo.setIndex(new THREE.BufferAttribute(this.indices, 1));

        const bbox = new THREE.Box3().setFromBufferAttribute(geo.attributes.position);
        const center = bbox.getCenter(new THREE.Vector3());
        geo.translate(-center.x, -center.y, -center.z);

        geo.computeVertexNormals();

        return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide
        }));
    }

    createBoundingCube(color = 0xff0000, opacity = 0.3) {
        const attr = new THREE.BufferAttribute(this.vertices, 3);
        const bbox = new THREE.Box3().setFromBufferAttribute(attr);
        const size = bbox.getSize(new THREE.Vector3());

        const cubeGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
        const cubeMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            side: THREE.DoubleSide
        });
        return new THREE.Mesh(cubeGeo, cubeMat);
    }
}