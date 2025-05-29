'use strict';

function init() {
    const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.Camera();
    scene.add(camera);

    const arSource = new THREEx.ArToolkitSource({ sourceType:'webcam' });
    arSource.init(() => resize());
    window.addEventListener('resize', resize);
    function resize(){
        arSource.onResizeElement();
        arSource.copyElementSizeTo(renderer.domElement);
        if(arContext.arController) arSource.copyElementSizeTo(arContext.arController.canvas);
    }

    const arContext = new THREEx.ArToolkitContext({
        detectionMode: 'mono',
        cameraParametersUrl: 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.7/data/data/camera_para.dat',
        maxDetectionRate: 30
    });
    arContext.init(() => camera.projectionMatrix.copy(arContext.getProjectionMatrix()));

    const markerRoot = new THREE.Group();
    scene.add(markerRoot);
    new THREEx.ArMarkerControls(arContext, markerRoot, {
        type: 'pattern',
        patternUrl: 'markers/marker.patt',
        changeMatrixMode: 'modelViewMatrix'
    });

    
    const L = 4.0;     
    const T = 2.0;     
    const B = 0.5;     

    const uSteps = 50;
    const vSteps = 50;

    const model = new Model(uSteps, vSteps, L, T, B);
    const coneMesh = model.createThreeJsMesh(0x44ff44);
    const cubeMesh = model.createBoundingCube(0xff0000, 0.3);

    coneMesh.scale.set(0.5, 0.5, 0.5);
    cubeMesh.scale.set(0.5, 0.5, 0.5);

    markerRoot.add(coneMesh, cubeMesh);

    (function render(){
        requestAnimationFrame(render);
        if(!arSource.ready) return;
        arContext.update(arSource.domElement);
        renderer.render(scene, camera);
    })();
}