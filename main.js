'use strict';


    const renderer = new THREE.WebGLRenderer({
		alpha: true
	});
    renderer.setClearColor(new THREE.Color('lightgrey'), 0);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.domElement.style.position = 'absolute';
	renderer.domElement.style.top = '0px';
	renderer.domElement.style.left = '0px';
	document.body.appendChild(renderer.domElement);

    const onRenderFcts = [];
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
	scene.add(camera);

    const arSource = new THREEx.ArToolkitSource({
		sourceType: 'webcam',
	});
    arSource.init(function onReady() {
		onResize()
	});
    window.addEventListener('resize', function () {
		onResize()
	});

    function onResize() {
		arSource.onResizeElement();
		arSource.copyElementSizeTo(renderer.domElement);
		if (arContext.arController !== null) {
			arSource.copyElementSizeTo(arContext.arController.canvas);
		}
	}

    const arContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: 'markers/camera_para.dat',
		detectionMode: 'mono',
		maxDetectionRate: 30,
		canvasWidth: 80 * 3,
		canvasHeight: 60 * 3
	})
    arContext.init(function onCompleted() {
		camera.projectionMatrix.copy(arContext.getProjectionMatrix());
	})

    onRenderFcts.push(function () {
		if (arSource.ready === false) return;
		arContext.update(arSource.domElement);
	})

    const markerRoot = new THREE.Group;
	scene.add(markerRoot);
	const artoolkitMarker = new THREEx.ArMarkerControls(arContext, markerRoot, {
		type: 'pattern',
		patternUrl: 'markers/marker.patt'
	});
		
	const smoothedRoot = new THREE.Group();
	scene.add(smoothedRoot);
	
    const smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
		lerpPosition: 0.4,
		lerpQuaternion: 0.3,
		lerpScale: 1
	});
	onRenderFcts.push(function (delta) {
		smoothedControls.update(markerRoot)
	});

    const arWorldRoot = smoothedRoot;
	const geometry = new THREE.BoxGeometry(1, 0.1, 1);
	const material = new THREE.MeshNormalMaterial({
		transparent: true,
		opacity: 0.25,
		side: THREE.DoubleSide
	});
	const mesh = new THREE.Mesh(geometry, material);
	mesh.position.y = geometry.parameters.height / 2;
	arWorldRoot.add(mesh);
	
    loadSurface();

    const stats = new Stats();
	document.body.appendChild(stats.dom);
		
	onRenderFcts.push(function () {
		renderer.render(scene, camera);
		stats.update();
	})

	let lastTimeMsec = null
	requestAnimationFrame(function animate(nowMsec) {
        requestAnimationFrame(animate);
		lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
		const deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
		lastTimeMsec = nowMsec;
		onRenderFcts.forEach(function (onRenderFct) {
			onRenderFct(deltaMsec / 1000, nowMsec / 1000)
		})
	});