function exportAnimation(renderer, scene, camera, mesh, speed, direction, durationSeconds, resolutionOption) {
    const exportProgress = document.getElementById('export-progress');
    const exportStatus = document.getElementById('export-status');
    const progressBar = document.getElementById('progress-bar');
    const exportButton = document.getElementById('exportBtn');
    const canvasContainer = document.getElementById('canvas-container');

    const originalSize = new THREE.Vector2();
    renderer.getSize(originalSize);
    const originalAspect = camera.aspect;

    let targetWidth = originalSize.width;
    let targetHeight = originalSize.height;
    let resizeNeeded = false;

    if (resolutionOption !== 'current') {
        const resValue = parseInt(resolutionOption, 10);
        if (!isNaN(resValue)) {
            targetWidth = resValue;
            targetHeight = resValue;
            resizeNeeded = true;
        }
    }
    const targetAspect = targetWidth / targetHeight;

    function updateProgress(percentage, statusText) {
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        progressBar.style.width = `${clampedPercentage}%`;
        exportStatus.textContent = statusText;
        console.log(`Export Progress: ${statusText} - ${clampedPercentage.toFixed(1)}%`);
    }

    function hideProgress(delay = 2000) {
        setTimeout(() => {
            exportProgress.classList.add('hidden');
             if (!isCapturing) {
                 exportButton.classList.remove('hidden');
             } else {
                 exportButton.disabled = false;
                 exportButton.classList.remove('hidden');
             }

            if (resizeNeeded) {
                renderer.setSize(originalSize.width, originalSize.height);
                camera.aspect = originalAspect;
                camera.updateProjectionMatrix();
            }
             isCapturing = false;
        }, delay);
    }

     function showProgress(statusText) {
        isCapturing = true;
        exportProgress.classList.remove('hidden');
        updateProgress(0, statusText);
     }

    if (typeof CCapture !== 'undefined') {
        if (!renderer || !scene || !camera) {
            console.error('Renderer, scene, or camera not provided for export.');
            showProgress('Error: Missing components.');
            hideProgress();
            return;
        }

        const framerate = 30;
        const durationFrames = framerate * durationSeconds;

        if (resizeNeeded) {
             renderer.setSize(targetWidth, targetHeight);
             camera.aspect = targetAspect;
             camera.updateProjectionMatrix();
         }

        showProgress(`Initializing... ( ${durationSeconds}s @ ${framerate}fps, ${targetWidth}x${targetHeight} )`);

        const capturer = new CCapture({
            format: 'gif',
            workersPath: './',
            framerate: framerate,
            verbose: true,
        });

        capturer.on('progress', (p) => {
             updateProgress(50 + p * 50, `Encoding Frame ${Math.round(p * durationFrames)}/${durationFrames}...`);
        });

        try {
            capturer.start();
            let frameCount = 0;

            function captureFrame() {
                if (frameCount < durationFrames) {
                    requestAnimationFrame(captureFrame);
                    if (mesh) {
                        mesh.rotation.y += 0.01 * speed * direction;
                    }
                    renderer.render(scene, camera);
                    capturer.capture(renderer.domElement);
                    frameCount++;
                    updateProgress((frameCount / durationFrames) * 50, `Capturing Frame ${frameCount}/${durationFrames}...`);
                } else {
                    updateProgress(50, "Finalizing capture...");
                    capturer.stop();
                    capturer.save(blob => {
                        updateProgress(100, "Download starting...");
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `anispin-export-${Date.now()}_${targetWidth}x${targetHeight}.gif`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        updateProgress(100, "Export Complete!");
                        hideProgress();
                    });
                }
            }
            captureFrame();
        } catch (error) {
             console.error("Error during capture process:", error);
             showProgress(`Error during capture: ${error.message}`);
             hideProgress(5000);
        }

    } else {
        console.error('CCapture library not found.');
        showProgress('Error: Export library not found.');
        hideProgress(3000);
    }
} 