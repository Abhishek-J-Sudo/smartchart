// Left sidebar - Shape palette

/**
 * Initialize the shape palette
 */
function initToolbar() {
    const palette = document.getElementById('shape-palette');

    const shapes = [
        {
            type: SHAPE_TYPES.RECTANGLE,
            name: 'Rectangle',
            svg: '<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="70" rx="8" fill="currentColor" stroke="currentColor" stroke-width="2" opacity="0.9"/></svg>'
        },
        {
            type: SHAPE_TYPES.CIRCLE,
            name: 'Circle',
            svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.9"/></svg>'
        },
        {
            type: SHAPE_TYPES.DIAMOND,
            name: 'Diamond',
            svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,5 95,50 50,95 5,50" fill="currentColor" opacity="0.9"/></svg>'
        },
        {
            type: SHAPE_TYPES.TRIANGLE,
            name: 'Triangle',
            svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,10 90,90 10,90" fill="currentColor" opacity="0.9"/></svg>'
        },
        {
            type: SHAPE_TYPES.TEXT,
            name: 'Text',
            svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><text x="50" y="65" font-size="70" font-weight="600" text-anchor="middle" fill="currentColor" font-family="Arial">T</text></svg>'
        }
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
        <div class="shape-icon" style="width: 50px; height: 50px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center;">${shape.svg}</div>
        <span>${shape.name}</span>
        <div class="shape-hint" style="font-size: 9px; color: #a0aec0; margin-top: 6px; opacity: 0; transition: opacity 0.25s; font-weight: 500;">Click or drag</div>
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
