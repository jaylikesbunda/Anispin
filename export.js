function exportAnimation(renderer, scene, camera) {
    const exportProgress = document.getElementById('export-progress');
    const exportStatus = document.getElementById('export-status');
    const progressBar = document.getElementById('progress-bar');
    const exportButton = document.getElementById('exportBtn'); // Get button reference

    function updateProgress(percentage, statusText) {
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        progressBar.style.width = `${clampedPercentage}%`;
        exportStatus.textContent = statusText;
        console.log(`Export Progress: ${statusText} - ${clampedPercentage.toFixed(1)}%`);
    }

    function showProgress(statusText) {
        exportButton.disabled = true; // Disable button during export
        exportProgress.classList.remove('hidden');
        updateProgress(0, statusText);
    }

    function hideProgress(delay = 2000) {
        setTimeout(() => {
            exportProgress.classList.add('hidden');
            exportButton.disabled = false; // Re-enable button
        }, delay);
    }

    if (typeof CCapture !== 'undefined') {
        if (!renderer || !scene || !camera) {
            console.error('Renderer, scene, or camera not provided for export.');
            exportStatus.textContent = 'Error: Missing components.'; // Show error in UI
            hideProgress();
            return;
        }

        const framerate = 30;
        const durationSeconds = 3;
        const durationFrames = framerate * durationSeconds;

        showProgress(`Initializing... ( ${durationSeconds}s @ ${framerate}fps )`);

        const capturer = new CCapture({
            format: 'gif',
            workersPath: './',
            framerate: framerate,
            verbose: true,
             // quality: 10 // Lower quality for faster encoding? (1-30, lower is better)
            // workers: 2 // Reduce workers if CPU is bottlenecked?
        });

        // Listen for encoding progress (0 to 1)
        capturer.on('progress', (p) => {
             // Scale encoding progress (p=0..1) to the second half (50-100%)
             updateProgress(50 + p * 50, `Encoding Frame ${Math.round(p * durationFrames)}/${durationFrames}...`);
        });

        capturer.start();


        let frameCount = 0;


        function captureFrame() {
            if (frameCount < durationFrames) {
                requestAnimationFrame(captureFrame);


                renderer.render(scene, camera);


                capturer.capture(renderer.domElement);
                frameCount++;
                // Scale capture progress (frameCount) to the first half (0-50%)
                updateProgress((frameCount / durationFrames) * 50, `Capturing Frame ${frameCount}/${durationFrames}...`);

            } else {
                updateProgress(50, "Finalizing capture..."); // Indicate capture is done
                console.log('Finished capturing frames.');
                capturer.stop();
                capturer.save(blob => {
                    console.log('Save callback initiated.');
                    updateProgress(100, "Download starting...");

                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `anispin-export-${Date.now()}.gif`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    console.log('GIF saved.');
                    updateProgress(100, "Export Complete!");
                    hideProgress(); // Hide progress bar after completion
                });
            }
        }


        captureFrame();

    } else {
        console.error('CCapture library not found.');
        showProgress('Error: Export library not found.'); // Show error in UI
        hideProgress(3000); // Hide after showing error
    }
} 