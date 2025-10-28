// Left sidebar - Shape palette

/**
 * Initialize the shape palette
 */
function initToolbar() {
    const palette = document.getElementById('shape-palette');

    const shapes = [
        { type: SHAPE_TYPES.RECTANGLE, name: 'Rectangle', icon: '▭' },
        { type: SHAPE_TYPES.CIRCLE, name: 'Circle', icon: '●' },
        { type: SHAPE_TYPES.DIAMOND, name: 'Diamond', icon: '◆' },
        { type: SHAPE_TYPES.TRIANGLE, name: 'Triangle', icon: '▲' },
        { type: SHAPE_TYPES.TEXT, name: 'Text', icon: 'T' }
    ];

    shapes.forEach(shape => {
        const shapeItem = createShapeItem(shape);
        palette.appendChild(shapeItem);
    });
}

/**
 * Create a shape palette item
 */
function createShapeItem(shape) {
    const div = document.createElement('div');
    div.className = 'shape-item';
    div.setAttribute('data-shape-type', shape.type);
    div.innerHTML = `
        <div class="shape-icon" style="font-size: 40px; margin-bottom: 8px; transition: transform 0.2s;">${shape.icon}</div>
        <span style="font-size: 12px; font-weight: 600; color: #495057; letter-spacing: 0.3px;">${shape.name}</span>
        <div class="shape-hint" style="font-size: 10px; color: #adb5bd; margin-top: 4px; opacity: 0; transition: opacity 0.2s;">Click or drag</div>
    `;

    // Click to add shape to canvas
    div.addEventListener('click', () => {
        addShapeToCanvas(shape.type);
        // Add click animation
        div.style.transform = 'scale(0.95)';
        setTimeout(() => {
            div.style.transform = 'scale(1)';
        }, 100);
    });

    // Hover effects
    div.addEventListener('mouseenter', () => {
        const icon = div.querySelector('.shape-icon');
        const hint = div.querySelector('.shape-hint');
        icon.style.transform = 'scale(1.1)';
        hint.style.opacity = '1';
    });

    div.addEventListener('mouseleave', () => {
        const icon = div.querySelector('.shape-icon');
        const hint = div.querySelector('.shape-hint');
        icon.style.transform = 'scale(1)';
        hint.style.opacity = '0';
    });

    // Drag and drop support
    div.draggable = true;
    div.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('shapeType', shape.type);
        e.dataTransfer.setData('text/plain', shape.type); // Fallback
        div.style.opacity = '0.5';
    });

    div.addEventListener('dragend', () => {
        div.style.opacity = '1';
    });

    return div;
}

/**
 * Add a shape to the canvas
 */
function addShapeToCanvas(shapeType, position = null) {
    const factory = getShapeFactory(shapeType);

    // Calculate center position if not provided
    let pos = position || {
        left: canvas.width / 2,
        top: canvas.height / 2
    };

    // Snap to grid if enabled and grid is visible
    if (typeof snapToGridEnabled !== 'undefined' && snapToGridEnabled &&
        typeof isGridVisible !== 'undefined' && isGridVisible) {
        pos = {
            left: snapToGrid(pos.left, 20),
            top: snapToGrid(pos.top, 20)
        };
    }

    const shape = factory(pos);

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.requestRenderAll();

    return shape;
}

/**
 * Setup drag and drop on canvas
 */
function setupCanvasDragDrop() {
    const canvasContainer = document.getElementById('canvas-container');

    canvasContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    canvasContainer.addEventListener('drop', (e) => {
        e.preventDefault();

        let shapeType = e.dataTransfer.getData('shapeType');
        if (!shapeType) {
            // Try fallback
            shapeType = e.dataTransfer.getData('text/plain');
        }

        if (!shapeType || !canvas) return;

        // Calculate canvas position accounting for zoom and pan
        const pointer = canvas.getPointer(e);

        addShapeToCanvas(shapeType, {
            left: pointer.x,
            top: pointer.y
        });
    });
}

// Initialize toolbar when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initToolbar();
    setupCanvasDragDrop();
});
