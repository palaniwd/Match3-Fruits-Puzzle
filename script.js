/**
 * Fruit Match-3 Game
 * Core Logic and Interaction
 */

class Game {
    constructor() {
        this.boardElement = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.movesElement = document.getElementById('moves');
        this.resetBtn = document.getElementById('reset-btn');

        this.gridSize = 8;
        this.fruits = ['🍎', '🍌', '🍇', '🍓', '🍍', '🍒', '🍉', '🍊'];

        this.board = [];
        this.score = 0;
        this.moves = 0;
        this.selectedCell = null;
        this.isProcessing = false;

        this.initGame();
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.resetBtn.addEventListener('click', () => this.initGame());
    }

    initGame() {
        this.score = 0;
        this.moves = 0;
        this.updateStats();
        this.selectedCell = null;
        this.isProcessing = false;

        this.createBoard();
        this.renderBoard();
    }

    updateStats() {
        this.scoreElement.textContent = this.score;
        this.movesElement.textContent = this.moves;
    }

    getRandomFruit() {
        return this.fruits[Math.floor(Math.random() * this.fruits.length)];
    }

    createBoard() {
        this.board = [];
        for (let r = 0; r < this.gridSize; r++) {
            let row = [];
            for (let c = 0; c < this.gridSize; c++) {
                let fruit;
                // Simple regeneration to avoid initial matches (optional but good for polish)
                do {
                    fruit = this.getRandomFruit();
                } while (
                    (c >= 2 && row[c - 1] === fruit && row[c - 2] === fruit) ||
                    (r >= 2 && this.board[r - 1][c] === fruit && this.board[r - 2][c] === fruit)
                );
                row.push(fruit);
            }
            this.board.push(row);
        }
    }

    renderBoard() {
        this.boardElement.innerHTML = '';

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.textContent = this.board[r][c];

                // Event listener for click/tap
                cell.addEventListener('click', () => this.handleInteraction(r, c));

                this.boardElement.appendChild(cell);
            }
        }
    }

    async handleInteraction(row, col) {
        if (this.isProcessing) return;

        const cells = document.querySelectorAll('.cell');
        const index = row * this.gridSize + col;
        const clickedCell = cells[index];

        // 1. If nothing selected, select clicked
        if (!this.selectedCell) {
            this.selectedCell = { row, col, index };
            clickedCell.classList.add('selected');
            return;
        }

        // 2. If clicked same cell, deselect
        if (this.selectedCell.row === row && this.selectedCell.col === col) {
            clickedCell.classList.remove('selected');
            this.selectedCell = null;
            return;
        }

        // 3. Check adjacency
        const prevRow = this.selectedCell.row;
        const prevCol = this.selectedCell.col;
        const rowDiff = Math.abs(row - prevRow);
        const colDiff = Math.abs(col - prevCol);

        if (rowDiff + colDiff === 1) {
            // Valid adjacent click -> Attempt Swap
            const prevIndex = this.selectedCell.index;
            const prevCellElement = cells[prevIndex];

            // Deselect visually
            prevCellElement.classList.remove('selected');
            this.selectedCell = null;

            // Perform Swap
            await this.swapFruits(prevRow, prevCol, row, col);

            // Check for matches
            const hasMatches = await this.findMatches();

            if (!hasMatches) {
                // Invalid move, swap back
                await new Promise(r => setTimeout(r, 200)); // Short pause
                await this.swapFruits(row, col, prevRow, prevCol);
            } else {
                // Valid move, process matches
                this.moves++;
                this.updateStats();
                await this.processMatches();
            }

        } else {
            // Invalid non-adjacent click -> Select new, deselect old
            const prevIndex = this.selectedCell.index;
            cells[prevIndex].classList.remove('selected');

            this.selectedCell = { row, col, index };
            clickedCell.classList.add('selected');
        }
    }

    async swapFruits(r1, c1, r2, c2) {
        this.isProcessing = true;

        const cells = document.querySelectorAll('.cell');
        const index1 = r1 * this.gridSize + c1;
        const index2 = r2 * this.gridSize + c2;
        const cell1 = cells[index1];
        const cell2 = cells[index2];

        // Visual Swap (using transform)
        // Calculate relative distance
        const xDiff = (c2 - c1) * 100; // 100% of cell width ?? No, use pixels or calculate based on grid
        // Actually, easiest is to just swap textContent but animate it. 
        // Better: swap DOM positions? Or just animate transform then swap content.

        // Let's use CSS Transition on transform
        // We know they are adjacent.
        // Get positions
        const rect1 = cell1.getBoundingClientRect();
        const rect2 = cell2.getBoundingClientRect();
        const xMove = rect2.left - rect1.left;
        const yMove = rect2.top - rect1.top;

        cell1.style.transform = `translate(${xMove}px, ${yMove}px)`;
        cell2.style.transform = `translate(${-xMove}px, ${-yMove}px)`;
        cell1.style.zIndex = 100;

        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 300));

        // Logic Swap
        const temp = this.board[r1][c1];
        this.board[r1][c1] = this.board[r2][c2];
        this.board[r2][c2] = temp;

        // DOM Content Swap & Reset Transform
        cell1.textContent = this.board[r1][c1];
        cell2.textContent = this.board[r2][c2];

        cell1.style.transform = '';
        cell2.style.transform = '';
        cell1.style.zIndex = '';

        this.isProcessing = false;
    }

    // Placeholder for finding matches - needed for logic to work
    async findMatches() {
        let matches = [];

        // Horizontal
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize - 2; c++) {
                const fruit = this.board[r][c];
                if (fruit && fruit === this.board[r][c + 1] && fruit === this.board[r][c + 2]) {
                    // Collect match
                    matches.push({ r, c }, { r, c: c + 1 }, { r, c: c + 2 });
                    // Optimization: check for longer matches here or let next iteration catch it 
                    // (Sets will handle duplicates later)
                }
            }
        }

        // Vertical
        for (let c = 0; c < this.gridSize; c++) {
            for (let r = 0; r < this.gridSize - 2; r++) {
                const fruit = this.board[r][c];
                if (fruit && fruit === this.board[r + 1][c] && fruit === this.board[r + 2][c]) {
                    matches.push({ r, c }, { r: r + 1, c }, { r: r + 2, c });
                }
            }
        }

        // Store unique matches for processing if needed
        this.currentMatches = matches; // Array of objects
        return matches.length > 0;
    }

    async processMatches() {
        this.isProcessing = true;

        // Loop until no more matches
        while (await this.findMatches()) {
            await this.removeMatches();
            await this.applyGravity();
            await this.refillBoard();

            // Allow small pause for visual pacing
            await new Promise(r => setTimeout(r, 300));
        }

        this.isProcessing = false;
        // Check for game over or valid moves here if desired
    }

    async removeMatches() {
        // Deduplicate matches
        const uniqueMatches = new Set();
        this.currentMatches.forEach(m => uniqueMatches.add(`${m.r},${m.c}`));

        let scoreGain = 0;
        const cells = document.querySelectorAll('.cell');

        // Visual Removal
        uniqueMatches.forEach(coord => {
            const [r, c] = coord.split(',').map(Number);
            const index = r * this.gridSize + c;
            const cell = cells[index];

            cell.classList.add('match'); // Animation defined in CSS

            // Logic Removal
            this.board[r][c] = null;
            scoreGain += 10;
        });

        this.score += scoreGain;
        this.updateStats();

        // Wait for match animation
        await new Promise(r => setTimeout(r, 300));

        // Cleanup classes
        uniqueMatches.forEach(coord => {
            const [r, c] = coord.split(',').map(Number);
            const index = r * this.gridSize + c;
            cells[index].classList.remove('match');
            cells[index].textContent = ''; // Clear visually
        });
    }

    async applyGravity() {
        const cells = document.querySelectorAll('.cell');
        let moves = [];

        // For each column
        for (let c = 0; c < this.gridSize; c++) {
            let writeRow = this.gridSize - 1;

            // Start from bottom, find non-empty fruits and bring them down
            for (let r = this.gridSize - 1; r >= 0; r--) {
                if (this.board[r][c] !== null) {
                    if (writeRow !== r) {
                        // Move fruit logic
                        this.board[writeRow][c] = this.board[r][c];
                        this.board[r][c] = null; // Clear old spot loop-internally

                        moves.push({ from: { r, c }, to: { r: writeRow, c } });
                    }
                    writeRow--;
                }
            }
        }

        // Render update for gravity (could be animated better, but fast redraw for now)
        // To animate: calculate deltas for existing items
        // For simplicity in this version, we will just re-render content but add drops class
        this.renderBoard();
        await new Promise(r => setTimeout(r, 50)); // Very brief frame yield
    }

    async refillBoard() {
        let newFruits = false;
        const newIndices = [];

        for (let c = 0; c < this.gridSize; c++) {
            for (let r = 0; r < this.gridSize; r++) {
                if (this.board[r][c] === null) {
                    this.board[r][c] = this.getRandomFruit();
                    newFruits = true;
                    newIndices.push(r * this.gridSize + c);
                }
            }
        }

        if (newFruits) {
            this.renderBoard();
            const cells = document.querySelectorAll('.cell');

            newIndices.forEach(index => {
                cells[index].classList.add('drop');
            });

            // Wait for animation to finish visually
            await new Promise(r => setTimeout(r, 400));

            // Remove drop class (optional, but cleaner)
            newIndices.forEach(index => {
                cells[index].classList.remove('drop');
            });
        }
    }
}

// Start the game
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
