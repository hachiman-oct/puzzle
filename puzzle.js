const gridSize = 8;
const zoneColors = {
    0: [158, 200, 255], 1: [204, 255, 184], 2: [232, 232, 238],
    3: [255, 247, 157], 4: [255, 216, 168], 5: [255, 182, 183],
    6: [149, 244, 242], 7: [213, 187, 255]
};

let zoneMap = [];

function closestZoneColor(rgb) {
    let minDist = Infinity;
    let closest = -1;
    for (const [zone, color] of Object.entries(zoneColors)) {
        const dist = Math.hypot(rgb[0] - color[0], rgb[1] - color[1], rgb[2] - color[2]);
        if (dist < minDist) {
            minDist = dist;
            closest = Number(zone);
        }
    }
    if (closest === 3 || closest === 4) {
        closest = rgb[1] < 219 ? 4 : 3;
    }
    return closest;
}

function getAverageColor(data, startX, startY, cellW, cellH, width) {
    let r = 0, g = 0, b = 0, count = 0;
    for (let y = startY; y < startY + cellH; y++) {
        for (let x = startX; x < startX + cellW; x++) {
            const i = (y * width + x) * 4;
            r += data[i]; g += data[i + 1]; b += data[i + 2];
            count++;
        }
    }
    return [r / count, g / count, b / count];
}

document.getElementById('imageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;
        const cellW = Math.floor(img.width / gridSize);
        const cellH = Math.floor(img.height / gridSize);
        zoneMap = [];
        for (let row = 0; row < gridSize; row++) {
            const rowZones = [];
            for (let col = 0; col < gridSize; col++) {
                const avg = getAverageColor(data, col * cellW, row * cellH, cellW, cellH, img.width);
                rowZones.push(closestZoneColor(avg));
            }
            zoneMap.push(rowZones);
        }
        renderGrid(Array.from({ length: gridSize }, () => Array(gridSize).fill('.')));
    };
    const reader = new FileReader();
    reader.onload = e => img.src = e.target.result;
    reader.readAsDataURL(file);
});

function renderGrid(board) {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.backgroundColor = `rgb(${zoneColors[zoneMap[i]?.[j] || 0].join(',')})`;
            cell.textContent = board[i][j] === '*' ? '★' : '';
            grid.appendChild(cell);
        }
    }
}

document.getElementById('solveBtn').addEventListener('click', () => {
    const board = Array.from({ length: gridSize }, () => Array(gridSize).fill('.'));
    if (solve(board)) {
        renderGrid(board);
    } else {
        alert('解なし');
    }
});

// Solve Logic (類似 Python の DFS)
const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
function isValid(board, r, c) {
    if (board[r][c] !== '.') return false;
    for (let [dr, dc] of directions) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
            if (board[nr][nc] === '*') return false;
        }
    }
    for (let i = 0; i < gridSize; i++) {
        if (board[r][i] === '*' || board[i][c] === '*') return false;
    }
    const zone = zoneMap[r][c];
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (zoneMap[i][j] === zone && board[i][j] === '*') return false;
        }
    }
    return true;
}

function solve(board, row = 0) {
    if (row === gridSize) return true;
    for (let col = 0; col < gridSize; col++) {
        if (isValid(board, row, col)) {
            board[row][col] = '*';
            if (solve(board, row + 1)) return true;
            board[row][col] = '.';
        }
    }
    return false;
}
