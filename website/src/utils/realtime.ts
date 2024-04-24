import { EDGEIMPULSE } from 'astrowind:config';

export const loadImage = (image) => {
    return new Promise((resolve, reject) => {
        image.onload = () => resolve(true);
        image.onerror = reject;
    });
}
// Wrap the loading process in a promise  
export const wait = (time) => {
    return new Promise((resolve) => {
        setTimeout(resolve, time)
    });
}

export const takeSnapshot = (video, canvas) => {

    let imageWidth = 320
    let imageHeight = 320

    canvas.width = imageWidth;
    canvas.height = imageHeight;

    return new Promise((resolve, reject) => {
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error("Canvas not supported");
        }

        context.drawImage(video, 0, 0, imageWidth, imageHeight);
        let imageData = context.getImageData(0, 0, imageWidth, imageHeight);
        let values: any = [];
        for (let ix = 0; ix < imageWidth * imageHeight; ix++) {
            // tslint:disable-next-line: no-bitwise
            values.push(Number((imageData.data[ix * 4] << 16)
                // tslint:disable-next-line: no-bitwise
                | (imageData.data[ix * 4 + 1] << 8)
                // tslint:disable-next-line: no-bitwise
                | (imageData.data[ix * 4 + 2])));
        }

        resolve({
            values: values,
            intervalMs: 0,
            sensors: [{
                name: "image",
                units: "rgba"
            }]
        });
    });
}



export const cleanCamera = (cameraInner) => {
    cameraInner.current?.querySelectorAll('.bounding-box-container').forEach(el => el.remove());
}
export const displayAnomalyScoreBlocks = (res, canvasRef, videoRef, cameraInner) => {

    let widthFactor = Number(canvasRef.current.width) /
        Number(videoRef.current.clientWidth);

    let heightFactor = Number(canvasRef.current.height) /
        Number(videoRef.current.clientHeight);

    for (let b of res.visual_ad_grid_cells) {

        if (b.value < EDGEIMPULSE.model_threshold) continue

        if (typeof b.x !== 'number' ||
            typeof b.y !== 'number' ||
            typeof b.width !== 'number' ||
            typeof b.height !== 'number') {
            continue;
        }

        let bb = {
            x: b.x / widthFactor,
            y: b.y / heightFactor,
            width: b.width / widthFactor,
            height: b.height / heightFactor,
            label: b.label,
            value: b.value
        };

        function valueToJetColor(value) {
            const v = Math.max(0, Math.min((value - 10) / 10, 1)); // Ensure value is between 0 and 1  
            const r = Math.floor(255 * Math.min(4 * v - 1.5, -4 * v + 4.5));
            const g = Math.floor(255 * Math.min(4 * v - 0.5, -4 * v + 3.5));
            const b = Math.floor(255 * Math.min(4 * v + 0.5, -4 * v + 2.5));
            return `rgba(${r},${g},${b}, 0.5)`;
        }

        let el = document.createElement('div');
        el.classList.add('bounding-box-container');
        el.style.position = 'absolute';
        // Apply jet color map based on b.value  
        el.style.background = valueToJetColor(bb.value);
        // el.style.background = valueToJetColor(bb.value);

        el.style.width = (bb.width) + 'px';
        el.style.height = (bb.height) + 'px';
        el.style.left = (bb.x) + 'px';
        el.style.top = (bb.y) + 'px';

        // Render label and/or scores. For visual AD, the score is printed
        // in the middle of the bounding box.
        let score = document.createElement('div');
        score.style.fontSize = `${Math.min(20, bb.width * 0.4)}px`;
        score.style.color = 'white';
        score.textContent = bb.value > 1 ? bb.value.toFixed(1) : bb.value.toFixed(2);
        el.appendChild(score);

        // Center align the score
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';

        cameraInner.current.appendChild(el);
    }
}

export const getUserCamera = async () => {
    return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            width: { ideal: 512 },
            height: { ideal: 512 },
            facingMode: {
                ideal: 'environment'
            }
        }
    })
}  