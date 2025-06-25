const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');


const gridSize = 4;
const chunkSize = 2000;
const worldWidth = gridSize * chunkSize;
const worldHeight = gridSize * chunkSize;

const imageSources = [];
for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
        imageSources.push(`../Fotos/images/chunk_${x}_${y}.png`);
    }
}

const images = [];

function loadImages() {
    let loadedImagesCount = 0;

    imageSources.forEach((src, index) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            images[index] = img;
            loadedImagesCount++;
            if (loadedImagesCount === imageSources.length) {
                render();
            }
        };
        img.onerror = () => {
            console.error(`Error loading image: ${src}`);
        };
    });
}





function renderGrid(cameraX, cameraY) {
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const img = images[y * gridSize + x];
            if (img) {
                const imgX = x * chunkSize - cameraX;
                const imgY = y * chunkSize - cameraY;

                if (
                    imgX + chunkSize > 0 &&
                    imgY + chunkSize > 0 &&
                    imgX < canvas.width &&
                    imgY < canvas.height
                ) {
                    ctx.drawImage(img, imgX, imgY, chunkSize, chunkSize);
                }
            }
        }
    }
}



function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cameraX = Math.max(
        0,
        Math.min(character.x - canvas.width / 2, worldWidth - canvas.width)
    );
    const cameraY = Math.max(
        0,
        Math.min(character.y - canvas.height / 2, worldHeight - canvas.height)
    );

    renderGrid(cameraX, cameraY);
    drawCharacter(cameraX, cameraY);
    updateCharacter();
    requestAnimationFrame(render);
}

function init() {
    loadImages();
    render();
}

init();
