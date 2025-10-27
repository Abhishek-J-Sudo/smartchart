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
        { type: SHAPE_TYPES.ARROW, name: 'Arrow', icon: '→' },
        { type: SHAPE_TYPES.TEXT, name: 'Text', icon: 'T' },
        { type: 'connector', name: 'Connector', icon: '↔', isConnector: true }
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

    // Click to add shape to canvas or activate connector mode
    div.addEventListener('click', () => {
        if (shape.isConnector) {
            activateConnectorMode();
        } else {
            addShapeToCanvas(shape.type);
        }
    });

    // Drag and drop support (not for connector tool)
    if (!shape.isConnector) {
        div.draggable = true;
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('shapeType', shape.type);
        });
    }

    return div;
}

/**
 * Activate connector mode - user can hover over shapes and click connection ports
 */
function activateConnectorMode() {
    // Show a notification
    const notification = document.createElement('div');
    notification.id = 'connector-mode-notification';
    notification.style.cssText = `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: #3498db;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    notification.textContent = 'Connector Mode Active: Hover over shapes and click connection ports to connect them';
    document.body.appendChild(notification);

    // Add escape key listener to exit connector mode
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            deactivateConnectorMode();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    // Remove notification after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);

    console.log('Connector mode activated. Hover over shapes to see connection ports.');
}

/**
 * Deactivate connector mode
 */
function deactivateConnectorMode() {
    const notification = document.getElementById('connector-mode-notification');
    if (notification) {
        notification.remove();
    }
    console.log('Connector mode deactivated.');
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

        const shapeType = e.dataTransfer.getData('shapeType');
        if (!shapeType) return;

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
