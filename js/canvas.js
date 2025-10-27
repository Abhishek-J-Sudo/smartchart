// Canvas management - pan, zoom, and interactions

let canvas;
let isGridVisible = true;
let currentZoom = 1;

/**
 * Initialize the canvas
 */
function initCanvas() {
    const canvasElement = document.getElementById('main-canvas');

    canvas = new fabric.Canvas('main-canvas', {
        width: window.innerWidth - 550, // Subtract sidebars width
        height: window.innerHeight - 50, // Subtract menu bar height
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true
    });

    // Enable grid by default
    toggleGrid();

    // Set up event listeners
    setupCanvasEvents();
    setupControlButtons();
    setupKeyboardShortcuts();

    // Handle window resize
    window.addEventListener('resize', debounce(handleResize, 250));

    return canvas;
}

/**
 * Setup canvas event listeners
 */
function setupCanvasEvents() {
    // Object selection
    canvas.on('selection:created', handleSelectionChange);
    canvas.on('selection:updated', handleSelectionChange);
    canvas.on('selection:cleared', handleSelectionCleared);

    // Object modification
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);

    // Double-click to add text to shapes
    canvas.on('mouse:dblclick', handleDoubleClick);

    // Mouse events for panning
    canvas.on('mouse:wheel', handleMouseWheel);
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
}

/**
 * Setup control buttons
 */
function setupControlButtons() {
    document.getElementById('zoom-in').addEventListener('click', () => zoomCanvas(1.1));
    document.getElementById('zoom-out').addEventListener('click', () => zoomCanvas(0.9));
    document.getElementById('reset-zoom').addEventListener('click', resetZoom);
    document.getElementById('toggle-grid').addEventListener('click', toggleGrid);
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Z - Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            handleUndo();
        }
        // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
        else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
            e.preventDefault();
            handleRedo();
        }
        // Ctrl/Cmd + C - Copy
        else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            handleCopy();
        }
        // Ctrl/Cmd + V - Paste
        else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            handlePaste();
        }
        // Ctrl/Cmd + D - Duplicate
        else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            handleDuplicate();
        }
        // Ctrl/Cmd + A - Select All
        else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            handleSelectAll();
        }
        // Delete or Backspace - Delete selected
        else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            handleDelete();
        }
    });
}

/**
 * Handle selection change
 */
function handleSelectionChange(e) {
    updatePropertiesPanel(e.selected || [e.target]);
}

/**
 * Handle selection cleared
 */
function handleSelectionCleared() {
    clearPropertiesPanel();
}

/**
 * Handle object modification
 */
function handleObjectModified(e) {
    saveCanvasState();
}

/**
 * Handle object added
 */
function handleObjectAdded(e) {
    saveCanvasState();
}

/**
 * Handle object removed
 */
function handleObjectRemoved(e) {
    saveCanvasState();
}

/**
 * Handle double-click to add/edit text inside shapes
 */
function handleDoubleClick(opt) {
    const target = opt.target;

    // Ignore if clicked on textbox (standalone text)
    if (!target || target.type === 'textbox' || target.type === 'i-text') {
        return;
    }

    // Check if shape already has text
    const existingText = target.text;

    // Prompt for text input
    const userText = prompt('Enter text for this shape:', existingText || '');

    if (userText !== null) {
        // Add text property to the shape
        target.set('text', userText);

        // Force re-render with text
        canvas.requestRenderAll();
        saveCanvasState();
    }
}

/**
 * Handle mouse wheel for zoom
 */
function handleMouseWheel(opt) {
    const delta = opt.e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;

    if (zoom > 20) zoom = 20;
    if (zoom < 0.1) zoom = 0.1;

    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    currentZoom = zoom;

    opt.e.preventDefault();
    opt.e.stopPropagation();
}

let isPanning = false;
let lastPosX, lastPosY;

/**
 * Handle mouse down for panning
 */
function handleMouseDown(opt) {
    const evt = opt.e;
    if (evt.altKey === true || (evt.button === 1)) {
        isPanning = true;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        canvas.selection = false;
    }
}

/**
 * Handle mouse move for panning
 */
function handleMouseMove(opt) {
    if (isPanning) {
        const evt = opt.e;
        const vpt = canvas.viewportTransform;
        vpt[4] += evt.clientX - lastPosX;
        vpt[5] += evt.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
    }
}

/**
 * Handle mouse up
 */
function handleMouseUp() {
    isPanning = false;
    canvas.selection = true;
}

/**
 * Zoom canvas
 */
function zoomCanvas(factor) {
    const center = canvas.getCenter();
    currentZoom *= factor;

    if (currentZoom > 20) currentZoom = 20;
    if (currentZoom < 0.1) currentZoom = 0.1;

    canvas.zoomToPoint({ x: center.left, y: center.top }, currentZoom);
    canvas.requestRenderAll();
}

/**
 * Reset zoom to 100%
 */
function resetZoom() {
    currentZoom = 1;
    canvas.setZoom(1);
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    canvas.requestRenderAll();
}

/**
 * Toggle grid visibility
 */
function toggleGrid() {
    isGridVisible = !isGridVisible;
    const container = document.getElementById('canvas-container');

    if (isGridVisible) {
        container.classList.add('canvas-grid');
    } else {
        container.classList.remove('canvas-grid');
    }
}

/**
 * Handle window resize
 */
function handleResize() {
    canvas.setDimensions({
        width: window.innerWidth - 550,
        height: window.innerHeight - 50
    });
    canvas.requestRenderAll();
}

/**
 * Save current canvas state
 */
function saveCanvasState() {
    const state = canvas.toJSON(['id', 'shapeType']);
    stateManager.saveState(state);
}

/**
 * Keyboard shortcut handlers
 */
let clipboard = null;

function handleCopy() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        activeObject.clone((cloned) => {
            clipboard = cloned;
        });
    }
}

function handlePaste() {
    if (clipboard) {
        clipboard.clone((cloned) => {
            cloned.set({
                left: cloned.left + 20,
                top: cloned.top + 20,
                id: generateId()
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
        });
    }
}

function handleDuplicate() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        activeObject.clone((cloned) => {
            cloned.set({
                left: cloned.left + 20,
                top: cloned.top + 20,
                id: generateId()
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
        });
    }
}

function handleSelectAll() {
    canvas.discardActiveObject();
    const selection = new fabric.ActiveSelection(canvas.getObjects(), {
        canvas: canvas,
    });
    canvas.setActiveObject(selection);
    canvas.requestRenderAll();
}

function handleDelete() {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
        activeObjects.forEach((obj) => {
            canvas.remove(obj);
        });
        canvas.discardActiveObject();
        canvas.requestRenderAll();
    }
}

function handleUndo() {
    const state = stateManager.undo();
    if (state) {
        loadCanvasState(state);
    }
}

function handleRedo() {
    const state = stateManager.redo();
    if (state) {
        loadCanvasState(state);
    }
}

/**
 * Load canvas state
 */
function loadCanvasState(state) {
    canvas.loadFromJSON(state, () => {
        canvas.requestRenderAll();
    });
}

// Initialize canvas when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
});
