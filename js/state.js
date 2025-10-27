// State management for undo/redo functionality

class StateManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = 50;
        this.currentState = null;
    }

    /**
     * Save current state for undo/redo
     */
    saveState(canvasState) {
        // Don't save if state is the same as current
        if (this.currentState && JSON.stringify(canvasState) === JSON.stringify(this.currentState)) {
            return;
        }

        this.undoStack.push(deepClone(canvasState));
        this.currentState = deepClone(canvasState);

        // Clear redo stack when new action is performed
        this.redoStack = [];

        // Limit stack size
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }

        this.updateButtons();
    }

    /**
     * Undo last action
     */
    undo() {
        if (this.undoStack.length === 0) return null;

        const state = this.undoStack.pop();
        if (this.currentState) {
            this.redoStack.push(deepClone(this.currentState));
        }
        this.currentState = deepClone(state);
        this.updateButtons();

        return state;
    }

    /**
     * Redo last undone action
     */
    redo() {
        if (this.redoStack.length === 0) return null;

        const state = this.redoStack.pop();
        if (this.currentState) {
            this.undoStack.push(deepClone(this.currentState));
        }
        this.currentState = deepClone(state);
        this.updateButtons();

        return state;
    }

    /**
     * Clear all history
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.currentState = null;
        this.updateButtons();
    }

    /**
     * Update undo/redo button states
     */
    updateButtons() {
        const undoBtn = document.getElementById('undo');
        const redoBtn = document.getElementById('redo');

        if (undoBtn) {
            undoBtn.disabled = this.undoStack.length === 0;
        }
        if (redoBtn) {
            redoBtn.disabled = this.redoStack.length === 0;
        }
    }

    /**
     * Check if undo is available
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * Check if redo is available
     */
    canRedo() {
        return this.redoStack.length > 0;
    }
}

// Global state manager instance
const stateManager = new StateManager();
