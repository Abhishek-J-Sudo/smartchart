// Shape library and rendering

const SHAPE_TYPES = {
    RECTANGLE: 'rectangle',
    CIRCLE: 'circle',
    DIAMOND: 'diamond',
    TRIANGLE: 'triangle',
    TEXT: 'text',
    ARROW: 'arrow'
};

/**
 * Create a rectangle shape
 */
function createRectangle(options = {}) {
    const rect = new fabric.Rect({
        left: options.left || 100,
        top: options.top || 100,
        width: options.width || 80,
        height: options.height || 60,
        fill: options.fill || '#3498db',
        stroke: options.stroke || '#2c3e50',
        strokeWidth: options.strokeWidth || 2,
        rx: options.rx || 0,
        ry: options.ry || 0,
        id: generateId(),
        shapeType: SHAPE_TYPES.RECTANGLE
    });

    // Add text rendering
    addTextToShape(rect);
    return rect;
}

/**
 * Create a circle shape
 */
function createCircle(options = {}) {
    const circle = new fabric.Circle({
        left: options.left || 100,
        top: options.top || 100,
        radius: options.radius || 30,
        fill: options.fill || '#2ecc71',
        stroke: options.stroke || '#2c3e50',
        strokeWidth: options.strokeWidth || 2,
        id: generateId(),
        shapeType: SHAPE_TYPES.CIRCLE
    });

    addTextToShape(circle);
    return circle;
}

/**
 * Create a diamond shape
 */
function createDiamond(options = {}) {
    const width = options.width || 70;
    const height = options.height || 70;

    const points = [
        { x: width / 2, y: 0 },
        { x: width, y: height / 2 },
        { x: width / 2, y: height },
        { x: 0, y: height / 2 }
    ];

    const diamond = new fabric.Polygon(points, {
        left: options.left || 100,
        top: options.top || 100,
        fill: options.fill || '#e74c3c',
        stroke: options.stroke || '#2c3e50',
        strokeWidth: options.strokeWidth || 2,
        id: generateId(),
        shapeType: SHAPE_TYPES.DIAMOND
    });

    addTextToShape(diamond);
    return diamond;
}

/**
 * Create a triangle shape
 */
function createTriangle(options = {}) {
    const triangle = new fabric.Triangle({
        left: options.left || 100,
        top: options.top || 100,
        width: options.width || 70,
        height: options.height || 70,
        fill: options.fill || '#f39c12',
        stroke: options.stroke || '#2c3e50',
        strokeWidth: options.strokeWidth || 2,
        id: generateId(),
        shapeType: SHAPE_TYPES.TRIANGLE
    });

    addTextToShape(triangle);
    return triangle;
}

/**
 * Create a text box
 */
function createTextBox(options = {}) {
    return new fabric.Textbox(options.text || 'Text', {
        left: options.left || 100,
        top: options.top || 100,
        width: options.width || 200,
        fontSize: options.fontSize || 16,
        fill: options.fill || '#2c3e50',
        fontFamily: options.fontFamily || 'Arial',
        textAlign: options.textAlign || 'left',
        id: generateId(),
        shapeType: SHAPE_TYPES.TEXT
    });
}

/**
 * Create an arrow/line
 */
function createArrow(options = {}) {
    // Make line coordinates relative (0,0 to 0,100 for vertical)
    const points = [
        0,    // x1 - relative to line's position
        0,    // y1 - relative to line's position
        0,    // x2 - same X = vertical
        100   // y2 - 100px down
    ];

    return new fabric.Line(points, {
        left: options.left || 100,
        top: options.top || 100,
        stroke: options.stroke || '#2c3e50',
        strokeWidth: options.strokeWidth || 2,
        id: generateId(),
        shapeType: SHAPE_TYPES.ARROW
    });
}

/**
 * Get shape factory by type
 */
function getShapeFactory(type) {
    const factories = {
        [SHAPE_TYPES.RECTANGLE]: createRectangle,
        [SHAPE_TYPES.CIRCLE]: createCircle,
        [SHAPE_TYPES.DIAMOND]: createDiamond,
        [SHAPE_TYPES.TRIANGLE]: createTriangle,
        [SHAPE_TYPES.TEXT]: createTextBox,
        [SHAPE_TYPES.ARROW]: createArrow
    };

    return factories[type] || createRectangle;
}

/**
 * Clone a shape
 */
function cloneShape(shape, callback) {
    shape.clone(function(cloned) {
        cloned.set({
            left: shape.left + 20,
            top: shape.top + 20,
            id: generateId()
        });
        if (callback) callback(cloned);
    });
}

/**
 * Add text rendering capability to a shape
 */
function addTextToShape(shape) {
    const originalRender = shape._render;

    shape._render = function(ctx) {
        originalRender.call(this, ctx);

        // Render text if exists
        if (this.text) {
            ctx.save();

            // Set text properties
            const fontSize = 14;
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Add text stroke for better visibility
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 0.5;

            // Word wrap the text
            const maxWidth = this.width || (this.radius * 2) || 100;
            const words = this.text.split(' ');
            const lines = [];
            let currentLine = '';

            words.forEach(word => {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth - 10) {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });
            if (currentLine) lines.push(currentLine);

            // Draw each line
            const lineHeight = fontSize + 4;
            const totalHeight = lines.length * lineHeight;
            const startY = -(totalHeight / 2) + (lineHeight / 2);

            lines.forEach((line, index) => {
                const y = startY + (index * lineHeight);
                ctx.strokeText(line, 0, y);
                ctx.fillText(line, 0, y);
            });

            ctx.restore();
        }
    };
}
