const container = document.getElementById('canvas-container');
const imageLoader = document.getElementById('imageLoader');
const speedSlider = document.getElementById('speed');
const directionSelect = document.getElementById('direction');
const exportBtn = document.getElementById('exportBtn');
const exportOptionsDiv = document.getElementById('export-options');
const startCaptureBtn = document.getElementById('startCaptureBtn');
const cancelExportBtn = document.getElementById('cancelExportBtn');
const exportDurationInput = document.getElementById('exportDuration');
const exportResolutionSelect = document.getElementById('exportResolution');

let scene, camera, renderer, mesh, textureLoader;
let speed = 1;
let direction = 1;
let isCapturing = false;

function init() {
    scene = new THREE.Scene();
    textureLoader = new THREE.TextureLoader();

    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    window.addEventListener('resize', onWindowResize, false);
    imageLoader.addEventListener('change', handleImageUpload, false);
    speedSlider.addEventListener('input', (event) => {
        speed = parseFloat(event.target.value);
    });
    directionSelect.addEventListener('change', (event) => {
        direction = parseInt(event.target.value);
    });

    exportBtn.addEventListener('click', () => {
        if (isCapturing) return;
        exportBtn.classList.add('hidden');
        exportOptionsDiv.classList.remove('hidden');
    });

    cancelExportBtn.addEventListener('click', () => {
        exportOptionsDiv.classList.add('hidden');
        exportBtn.classList.remove('hidden');
    });

    startCaptureBtn.addEventListener('click', () => {
        if (isCapturing) return;

        const duration = parseInt(exportDurationInput.value, 10) || 3;
        const resolutionOption = exportResolutionSelect.value;

        exportOptionsDiv.classList.add('hidden');

        if (typeof exportAnimation === 'function') {
            exportAnimation(renderer, scene, camera, mesh, speed, direction, duration, resolutionOption);
        } else {
            console.error('exportAnimation function not found.');
             exportBtn.classList.remove('hidden');
        }
    });

    const placeholderGeo = new THREE.BoxGeometry(2, 2, 0.1);
    const placeholderMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    mesh = new THREE.Mesh(placeholderGeo, placeholderMat);
    scene.add(mesh);

    animate();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            textureLoader.load(e.target.result, function(texture) {
                if (mesh) {
                    scene.remove(mesh);
                    mesh.geometry.dispose();
                    mesh.material.dispose();
                }
                 if (mesh && mesh.material.map) {
                    mesh.material.map.dispose();
                }

                const img = new Image();
                img.onload = () => {
                    const aspectRatio = img.width / img.height;
                    const planeHeight = 3;
                    const planeWidth = planeHeight * aspectRatio;

                    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                    const material = new THREE.MeshStandardMaterial({
                        map: texture,
                        side: THREE.DoubleSide,
                        transparent: true
                    });
                    mesh = new THREE.Mesh(geometry, material);
                    scene.add(mesh);
                }
                img.src = e.target.result;
            });
        }
        reader.readAsDataURL(file);
    }
}

function onWindowResize() {
    if (!container || !renderer || !camera) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate);

    if (isCapturing) {
        return;
    }

    if (mesh) {
        mesh.rotation.y += 0.01 * speed * direction;
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

if (container) {
    init();
} else {
    console.error('Canvas container not found.');
}