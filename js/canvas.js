// Canvas management - pan, zoom, and interactions

let canvas;
let isGridVisible = false;
let currentZoom = 1;
let snapToGridEnabled = true;
const GRID_SIZE = 20;

/**
 * Initialize the canvas
 */
function initCanvas() {
    const canvasElement = document.getElementById('main-canvas');

    canvas = new fabric.Canvas('main-canvas', {
        width: window.innerWidth - 550, // Subtract sidebars width
        height: window.innerHeight - 50, // Subtract menu bar height
        backgroundColor: 'transparent',
        selection: true,
        preserveObjectStacking: true
    });

    // Enable grid by default
    toggleGrid();

    // Initialize connector system
    initConnectorSystem();

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

    // Object movement (disable connectors during drag)
    canvas.on('object:moving', handleObjectMoving);

    // Object scaling (snap to grid during resize)
    canvas.on('object:scaling', handleObjectScaling);

    // Double-click to add text to shapes
    canvas.on('mouse:dblclick', handleDoubleClick);

    // Mouse events for panning
    canvas.on('mouse:wheel', handleMouseWheel);
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    // Mouse events for connection ports
    canvas.on('mouse:over', handleMouseOver);
    canvas.on('mouse:out', handleMouseOut);
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
        // Delete or Backspace - Delete selected (but not when editing text)
        else if (e.key === 'Delete' || e.key === 'Backspace') {
            // Don't delete shapes if user is editing text
            const activeObject = canvas.getActiveObject();
            if (!activeObject || activeObject.type !== 'i-text' || !activeObject.isEditing) {
                e.preventDefault();
                handleDelete();
            }
        }
    });
}

/**
 * Handle selection change
 */
function handleSelectionChange(e) {
    updatePropertiesPanel(e.selected || [e.target]);

    // Highlight connector if selected
    const selected = e.selected || [e.target];
    selected.forEach(obj => {
        if ((obj.isConnector || obj.isConnectorArrow) && obj.connectorObject) {
            obj.connectorObject.highlight(true);
        }
        // Show connection handles if shape is selected (not text or connectors)
        else if (obj.id && !obj.isConnector && !obj.isConnectionHandle && obj.type !== 'i-text') {
            const manager = getConnectorManager();
            if (manager) {
                manager.showConnectionHandles(obj);
            }
        }
    });
}

/**
 * Handle selection cleared
 */
function handleSelectionCleared() {
    clearPropertiesPanel();

    // Unhighlight all connectors
    const manager = getConnectorManager();
    if (manager) {
        if (manager.connectors) {
            manager.connectors.forEach(connector => {
                connector.unhighlight();
            });
        }
        // Hide connection handles
        manager.hideConnectionHandles();
    }
}

/**
 * Handle object modification (when drag/resize/rotate ends)
 */
function handleObjectModified(e) {
    // Re-enable connectors after movement
    canvas.getObjects().forEach(obj => {
        if (obj.isConnector || obj.isConnectorArrow) {
            obj.evented = true;
        }
    });

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
 * Handle object moving - disable connector interaction during drag and snap to grid
 */
function handleObjectMoving(e) {
    const movingObject = e.target;

    // Skip if it's a connector itself
    if (movingObject.isConnector || movingObject.isConnectorArrow) {
        return;
    }

    // Apply snap-to-grid if enabled and grid is visible
    if (snapToGridEnabled && isGridVisible) {
        // Snap the object's position to the grid
        movingObject.set({
            left: snapToGrid(movingObject.left, GRID_SIZE),
            top: snapToGrid(movingObject.top, GRID_SIZE)
        });
        movingObject.setCoords();
    }

    // Disable all connectors temporarily to prevent interference
    canvas.getObjects().forEach(obj => {
        if (obj.isConnector || obj.isConnectorArrow) {
            obj.evented = false;
        }
    });
}

/**
 * Handle object scaling - snap dimensions to grid
 */
function handleObjectScaling(e) {
    const scalingObject = e.target;

    // Skip if it's a connector itself or text
    if (scalingObject.isConnector || scalingObject.isConnectorArrow || scalingObject.type === 'textbox') {
        return;
    }

    // Apply snap-to-grid if enabled and grid is visible
    if (snapToGridEnabled && isGridVisible) {
        // For circles, snap the radius
        if (scalingObject.type === 'circle') {
            const scaledRadius = scalingObject.radius * scalingObject.scaleX;
            const snappedRadius = snapToGrid(scaledRadius, GRID_SIZE);
            const newScale = snappedRadius / scalingObject.radius;
            scalingObject.set({
                scaleX: newScale,
                scaleY: newScale  // Keep circle circular
            });
        }
        // For other shapes, snap width and height
        else if (scalingObject.width && scalingObject.height) {
            const scaledWidth = scalingObject.width * scalingObject.scaleX;
            const scaledHeight = scalingObject.height * scalingObject.scaleY;

            const snappedWidth = snapToGrid(scaledWidth, GRID_SIZE);
            const snappedHeight = snapToGrid(scaledHeight, GRID_SIZE);

            scalingObject.set({
                scaleX: snappedWidth / scalingObject.width,
                scaleY: snappedHeight / scalingObject.height
            });
        }

        scalingObject.setCoords();
    }
}

/**
 * Handle double-click to add/edit text inside shapes
 */
function handleDoubleClick(opt) {
    const target = opt.target;

    // If double-clicked on a shape's or connector's text object, enter edit mode
    if (target && target.type === 'i-text' && (target._isShapeText || target._isConnectorText)) {
        target.enterEditing();
        target.selectAll();
        return;
    }

    // If double-clicked on a standalone textbox, ignore (let default behavior handle it)
    if (!target || target.type === 'textbox' || (target.type === 'i-text' && !target._isShapeText && !target._isConnectorText)) {
        return;
    }

    // Handle double-click on connector path or arrow
    if (target.isConnector || target.isConnectorArrow) {
        const connector = target.connectorObject;
        if (connector) {
            if (connector._textObject) {
                // Text object already exists, just enter edit mode
                const itext = connector._textObject;
                itext.enterEditing();
                itext.selectAll();
                canvas.setActiveObject(itext);

                // Add exit editing handler
                const exitEditingHandler = (e) => {
                    if (itext.isEditing && e.target !== itext) {
                        itext.exitEditing();
                        canvas.off('mouse:down', exitEditingHandler);
                    }
                };

                setTimeout(() => {
                    canvas.on('mouse:down', exitEditingHandler);
                }, 100);
            } else {
                // Create new text object for this connector
                createConnectorTextObject(connector);
            }
        }
        return;
    }

    // Ignore connection handles
    if (target.isConnectionHandle) {
        return;
    }

    // Only allow text editing for shapes
    if (!target.id || !target.shapeType) {
        return;
    }

    // Check if shape already has a text object
    if (target._textObject) {
        // Text object already exists, just enter edit mode
        const itext = target._textObject;
        itext.enterEditing();
        itext.selectAll();
        canvas.setActiveObject(itext);

        // Add exit editing handler
        const exitEditingHandler = (e) => {
            if (itext.isEditing && e.target !== itext) {
                itext.exitEditing();
                canvas.off('mouse:down', exitEditingHandler);
            }
        };

        setTimeout(() => {
            canvas.on('mouse:down', exitEditingHandler);
        }, 100);
    } else {
        // Create new text object for this shape
        createShapeTextObject(target);
    }
}

/**
 * Create a persistent text object for a shape
 */
function createShapeTextObject(shape) {
    // Calculate position for text (centered on shape)
    const shapeCenter = shape.getCenterPoint();

    // Determine width based on shape type
    let textWidth;
    if (shape.type === 'circle') {
        textWidth = (shape.radius * 2 * shape.scaleX) * 0.7; // 70% of diameter
    } else if (shape.width) {
        textWidth = (shape.width * shape.scaleX) * 0.8; // 80% of shape width
    } else {
        textWidth = 100; // Default width
    }

    // Get existing text if any (for backward compatibility with old saved files)
    const existingText = shape.text || '';

    // Create IText object
    const itext = new fabric.IText(existingText, {
        left: shapeCenter.x,
        top: shapeCenter.y,
        fontSize: 14,
        fontFamily: 'Arial',
        fill: 'white',
        stroke: '',
        strokeWidth: 0,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: textWidth,
        splitByGrapheme: true,
        editable: true,
        selectable: true, // Allow selection for editing
        _isShapeText: true, // Flag to identify as shape text
        _parentShape: shape, // Reference to parent shape
        lockMovementX: true, // Prevent independent movement
        lockMovementY: true,
        hasControls: false, // No resize handles
        hasBorders: true, // Show selection borders
        evented: true // Allow double-click events
    });

    // Store reference in both directions
    shape._textObject = itext;

    // Add to canvas
    canvas.add(itext);

    // Enter editing mode immediately
    canvas.setActiveObject(itext);
    itext.enterEditing();
    itext.selectAll();

    // Update text object position when shape moves
    shape.on('moving', () => {
        const center = shape.getCenterPoint();
        itext.set({
            left: center.x,
            top: center.y
        });
        itext.setCoords();
    });

    // Update text object when shape is modified (scaled, rotated, etc)
    shape.on('modified', () => {
        const center = shape.getCenterPoint();

        // Update text width based on new shape size
        if (shape.type === 'circle') {
            itext.set('width', (shape.radius * 2 * shape.scaleX) * 0.7);
        } else if (shape.width) {
            itext.set('width', (shape.width * shape.scaleX) * 0.8);
        }

        itext.set({
            left: center.x,
            top: center.y
        });
        itext.setCoords();
    });

    // When text is edited, update shape's text property for backward compatibility
    itext.on('changed', () => {
        shape.set('text', itext.text);
    });

    // Exit editing mode when clicking outside
    const exitEditingHandler = (e) => {
        if (itext.isEditing && e.target !== itext) {
            itext.exitEditing();
            canvas.off('mouse:down', exitEditingHandler);
        }
    };

    // Add listener after a short delay to prevent immediate trigger
    setTimeout(() => {
        canvas.on('mouse:down', exitEditingHandler);
    }, 100);

    canvas.requestRenderAll();
}

/**
 * Create a persistent text object for a connector
 */
function createConnectorTextObject(connector) {
    // Calculate midpoint of the connector path
    const midpoint = connector.getPathMidpoint();

    // Get existing text if any (for backward compatibility)
    const existingText = connector.text || '';

    // Create IText object with black text on white background
    const itext = new fabric.IText(existingText, {
        left: midpoint.x,
        top: midpoint.y,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: 'black',
        backgroundColor: 'white',
        stroke: '',
        strokeWidth: 0,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: 150,
        splitByGrapheme: true,
        editable: true,
        selectable: true, // Allow selection for editing
        _isConnectorText: true, // Flag to identify as connector text
        _parentConnector: connector, // Reference to parent connector
        lockMovementX: true, // Prevent independent movement
        lockMovementY: true,
        hasControls: false, // No resize handles
        hasBorders: true, // Show selection borders
        evented: true // Allow double-click events
    });

    // Store reference in connector
    connector._textObject = itext;

    // Add to canvas
    canvas.add(itext);

    // Enter editing mode immediately
    canvas.setActiveObject(itext);
    itext.enterEditing();
    itext.selectAll();

    // When text is edited, update connector's text property
    itext.on('changed', () => {
        connector.text = itext.text;
    });

    // Exit editing mode when clicking outside
    const exitEditingHandler = (e) => {
        if (itext.isEditing && e.target !== itext) {
            itext.exitEditing();
            canvas.off('mouse:down', exitEditingHandler);
        }
    };

    // Add listener after a short delay to prevent immediate trigger
    setTimeout(() => {
        canvas.on('mouse:down', exitEditingHandler);
    }, 100);

    canvas.requestRenderAll();
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
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';

        // Disable all object interaction during panning
        canvas.forEachObject(function(obj) {
            obj.evented = false;
        });

        opt.e.preventDefault();
        opt.e.stopPropagation();
    }
}

/**
 * Handle mouse move for panning
 */
function handleMouseMove(opt) {
    if (isPanning) {
        canvas.defaultCursor = 'grabbing';
        canvas.hoverCursor = 'grabbing';
        const evt = opt.e;
        const vpt = canvas.viewportTransform;
        vpt[4] += evt.clientX - lastPosX;
        vpt[5] += evt.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        opt.e.preventDefault();
        opt.e.stopPropagation();
    }
}

/**
 * Handle mouse up
 */
function handleMouseUp() {
    if (isPanning) {
        isPanning = false;
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';

        // Re-enable all objects when panning ends
        canvas.forEachObject(function(obj) {
            obj.evented = true;
        });

        canvas.requestRenderAll();
    }
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
        console.log('Grid enabled - canvas-grid class added');
    } else {
        container.classList.remove('canvas-grid');
        console.log('Grid disabled - canvas-grid class removed');
    }

    canvas.requestRenderAll();
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
    // Get canvas objects (excluding connector visuals, text editing objects, and shape text)
    const canvasObjects = canvas.getObjects().filter(obj =>
        !obj.isConnector && !obj.isConnectorArrow && !obj.isPort && !obj._isEditingText && !obj._isShapeText
    );

    // Save canvas state
    const canvasState = {
        version: canvas.version,
        objects: canvasObjects.map(obj => obj.toJSON(['id', 'shapeType', 'text']))
    };

    // Save connectors state
    const connectorsState = getConnectorManager().toJSON();

    // Combine both states
    const state = {
        canvas: canvasState,
        connectors: connectorsState
    };

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
            // If deleting a connector line/arrow, remove the connector
            if (obj.isConnector || obj.isConnectorArrow) {
                const connector = obj.connectorObject;
                if (connector) {
                    getConnectorManager().removeConnector(connector.id);
                }
            }
            // If deleting a shape, remove all its connectors and text
            else if (obj.id && obj.shapeType) {
                getConnectorManager().removeConnectorsForShape(obj);
                // Also remove associated text object if it exists
                if (obj._textObject) {
                    canvas.remove(obj._textObject);
                }
                canvas.remove(obj);
            }
            // Otherwise just remove the object
            else {
                canvas.remove(obj);
            }
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
    // Handle legacy state format (before connector system)
    if (state.objects || state.version) {
        canvas.loadFromJSON(state, () => {
            canvas.requestRenderAll();
        });
        return;
    }

    // New state format with separate canvas and connectors
    if (state.canvas) {
        canvas.loadFromJSON(state.canvas, () => {
            // After canvas is loaded, restore text objects for shapes that have text
            const shapes = canvas.getObjects().filter(obj => obj.id && obj.shapeType);
            shapes.forEach(shape => {
                if (shape.text) {
                    // Recreate text object for shapes that have text (don't enter edit mode)
                    const shapeCenter = shape.getCenterPoint();
                    let textWidth;
                    if (shape.type === 'circle') {
                        textWidth = (shape.radius * 2 * shape.scaleX) * 0.7;
                    } else if (shape.width) {
                        textWidth = (shape.width * shape.scaleX) * 0.8;
                    } else {
                        textWidth = 100;
                    }

                    const itext = new fabric.IText(shape.text, {
                        left: shapeCenter.x,
                        top: shapeCenter.y,
                        fontSize: 14,
                        fontFamily: 'Arial',
                        fill: '#ffffff',
                        stroke: '',
                        strokeWidth: 0,
                        textAlign: 'center',
                        originX: 'center',
                        originY: 'center',
                        width: textWidth,
                        splitByGrapheme: true,
                        editable: true,
                        selectable: false,
                        _isShapeText: true,
                        _parentShape: shape,
                        lockMovementX: true,
                        lockMovementY: true,
                        hasControls: false,
                        hasBorders: false,
                        evented: true
                    });

                    shape._textObject = itext;
                    canvas.add(itext);

                    // Bind events for this text object
                    shape.on('moving', () => {
                        const center = shape.getCenterPoint();
                        itext.set({ left: center.x, top: center.y });
                        itext.setCoords();
                    });

                    shape.on('modified', () => {
                        const center = shape.getCenterPoint();
                        if (shape.type === 'circle') {
                            itext.set('width', (shape.radius * 2 * shape.scaleX) * 0.7);
                        } else if (shape.width) {
                            itext.set('width', (shape.width * shape.scaleX) * 0.8);
                        }
                        itext.set({ left: center.x, top: center.y });
                        itext.setCoords();
                    });

                    itext.on('changed', () => {
                        shape.set('text', itext.text);
                    });
                }
            });

            // Restore connectors
            if (state.connectors && state.connectors.length > 0) {
                getConnectorManager().fromJSON(state.connectors, shapes);
            }

            canvas.requestRenderAll();
        });
    }
}

/**
 * Handle mouse over shape - show connection handles (only if no shape is selected)
 */
function handleMouseOver(e) {
    const target = e.target;

    // Don't show on hover if something is already selected
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        return;
    }

    // Only show handles for shapes (not text, connectors, or handles themselves)
    if (!target || target.type === 'textbox' || target.isConnector || target.isConnectorArrow || target.isConnectionHandle) {
        return;
    }

    // Only show if shape has an id (is a real shape)
    if (target.id && target.shapeType) {
        const manager = getConnectorManager();
        manager.showConnectionHandles(target);
    }
}

/**
 * Handle mouse out of shape - hide connection handles (only if no shape is selected)
 */
function handleMouseOut(e) {
    const target = e.target;

    // Don't hide on mouseout if something is selected
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        return;
    }

    // Don't hide immediately - let user move to the handle
    setTimeout(() => {
        const manager = getConnectorManager();
        const pointer = canvas.getPointer(e.e);
        const currentTarget = canvas.findTarget(e.e, false);

        // Only hide if not hovering over a handle and nothing is selected
        if ((!currentTarget || !currentTarget.isConnectionHandle) && !canvas.getActiveObject()) {
            manager.hideConnectionHandles();
        }
    }, 100);
}

// Old port system removed - now using diagrams.net-style connection handles

// Initialize canvas when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
});
