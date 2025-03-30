const container = document.getElementById('canvas-container');
const imageLoader = document.getElementById('imageLoader');
const speedSlider = document.getElementById('speed');
const directionSelect = document.getElementById('direction');
const exportBtn = document.getElementById('exportBtn');

let scene, camera, renderer, mesh, textureLoader;
let speed = 1;
let direction = 1; // 1 for clockwise, -1 for counter-clockwise

function init() {
    scene = new THREE.Scene();
    textureLoader = new THREE.TextureLoader();

    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true for transparent background if needed
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
        // Call the function from export.js, passing necessary objects
        if (typeof exportAnimation === 'function') {
            exportAnimation(renderer, scene, camera);
        } else {
            console.error('exportAnimation function not found. Ensure export.js is loaded.');
            alert('Export function is not available.');
        }
    });


    // Placeholder geometry until image is loaded
    const placeholderGeo = new THREE.BoxGeometry(2, 2, 0.1); // Flat box
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
                // Remove old mesh if it exists
                if (mesh) {
                    scene.remove(mesh);
                    mesh.geometry.dispose();
                    mesh.material.dispose();
                }
                 if (mesh && mesh.material.map) {
                    mesh.material.map.dispose();
                }

                // Determine aspect ratio for the plane
                const img = new Image();
                img.onload = () => {
                    const aspectRatio = img.width / img.height;
                    const planeHeight = 3; // Set a fixed height
                    const planeWidth = planeHeight * aspectRatio;

                    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                    const material = new THREE.MeshStandardMaterial({
                        map: texture,
                        side: THREE.DoubleSide, // Show texture on both sides
                        transparent: true // Enable transparency if the image has it
                    });
                    mesh = new THREE.Mesh(geometry, material);
                    scene.add(mesh);
                }
                img.src = e.target.result; // Load image to get dimensions
            });
        }
        reader.readAsDataURL(file);
    }
}

function onWindowResize() {
    if (!container || !renderer || !camera) return; // Ensure elements are initialized

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}


function animate() {
    requestAnimationFrame(animate);

    if (mesh) {
        // Adjust rotation based on speed and direction
        mesh.rotation.y += 0.01 * speed * direction;
    }

    if (renderer && scene && camera) { // Check if renderer, scene, and camera exist
      renderer.render(scene, camera);
    }
}

// Only initialize if the container exists
if (container) {
    init();
} else {
    console.error('Canvas container not found.');
} 