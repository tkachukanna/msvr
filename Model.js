function createSurfaceData() {
    
    const uSteps = 50;
    const vSteps = 50;

    const uMin = 0.0;
    const uMax = 2.0;
    const vMin = -0.3;
    const vMax = 1.0;

    let verticesPlus = [];
    let verticesMinus = [];
    let indicesPlus = [];
    let indicesMinus = [];

    for (let j = 0; j <= vSteps; j++) {
        let v = vMin + (vMax - vMin) * (j / vSteps);
        for (let i = 0; i <= uSteps; i++) {
            let u = uMin + (uMax - uMin) * (i / uSteps);
            let vert = calculateVertex(u, v, 1);
            verticesPlus.push(vert);
        }
    }
    for(let j = vSteps; j >= 0; j--) {
        let v = vMin + (vMax - vMin) * (j / vSteps);
        for(let i = uSteps; i >= 0; i--) {
            let u = uMin + (uMax - uMin) * (i / uSteps);
            let vert = calculateVertex(u, v, -1);
            verticesMinus.push(vert);
        }
    }

    for (let j = 0; j < vSteps; j++) {
        for (let i = 0; i < uSteps; i++) {
            let index = j * (uSteps + 1) + i;
            indicesPlus.push([index, index + 1, index + uSteps + 1]);
            indicesPlus.push([index + 1, index + uSteps + 2, index + uSteps + 1]);
        }
    }

    let offset = (uSteps + 1) * (vSteps + 1);
    for (let j = vSteps; j >= 0; j--) {
        for (let i = uSteps; i >= 0; i--) {
            let index = j * (uSteps + 1) + i + offset;
            indicesMinus.push([index, index + uSteps + 1, index + 1]);
            indicesMinus.push([index + 1, index + uSteps + 1, index + uSteps + 2]);
        }
    }

    let vertices = verticesPlus.concat(verticesMinus);
    let faces = indicesPlus.concat(indicesMinus);
   
    let objData = "# Surface\n";
   
    vertices.forEach((v) => {
        objData += `v ${v[0]} ${v[1]} ${v[2]}\n`;
    });
    faces.forEach((f) => {
        objData += `f ${f[0]} ${f[1]} ${f[2]}\n`;
    });

    return objData;
}

function calculateVertex(u, v, sign) {
    const L = 4;
    const B = 0.5;
    const T = 2;
    const X = L * (1 - u);
    const Y = sign * 2.5426 * B * v * Math.sqrt((3 * (1 - v)) / (1 + 3 * v)) * u;
    const Z = ((Math.sqrt(3) * T) / 3) * (1 - u) + u * v * T;
    return [X, Y, Z];
}

function loadSurface() {
    const objData = createSurfaceData();
    const objBlob = new Blob([objData], { type: "text/plain" });
    const objURL = URL.createObjectURL(objBlob);

    const loader = new THREE.OBJLoader();
    loader.load(
        objURL,
        (object) => {
            const material = new THREE.MeshNormalMaterial({
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
            });

            object.traverse((child) => {
                if (child.isMesh) child.material = material;
            });

            object.position.y = 2;
            object.scale.set(0.1, 0.1, 0.1);
            arWorldRoot.add(object);

            URL.revokeObjectURL(objURL);
        },
        undefined,
        (error) => {
            console.error("OBJ loading failed:", error);
        }
    );
}
