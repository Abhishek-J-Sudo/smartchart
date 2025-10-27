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
        <div style="font-size: 32px;">${shape.icon}</div>
        <span>${shape.name}</span>
    `;

    // Click to add shape to canvas
    div.addEventListener('click', () => {
        addShapeToCanvas(shape.type);
    });

    // Drag and drop support
    div.draggable = true;
    div.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('shapeType', shape.type);
        e.dataTransfer.setData('text/plain', shape.type); // Fallback
    });

    return div;
}

/**
 * Add a shape to the canvas
 */
function addShapeToCanvas(shapeType, position = null) {
    const factory = getShapeFactory(shapeType);

    // Calculate center position if not provided
    const pos = position || {
        left: canvas.width / 2,
        top: canvas.height / 2
    };

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
