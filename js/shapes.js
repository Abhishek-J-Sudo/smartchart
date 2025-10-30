// Shape library and rendering

const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  DIAMOND: 'diamond',
  TRIANGLE: 'triangle',
  TEXT: 'text',
  ARROW: 'arrow',
};

/**
 * Create a rectangle shape
 */
function createRectangle(options = {}) {
  // Get theme colors if not explicitly provided
  const themeColors = typeof getDefaultShapeColors === 'function' ? getDefaultShapeColors('rectangle') : null;

  const rect = new fabric.Rect({
    left: options.left || 100,
    top: options.top || 100,
    width: options.width || 240, // Process box
    height: options.height || 80,
    fill: options.fill || (themeColors ? themeColors.fill : '#81afe4'), // Modern blue
    stroke: options.stroke || (themeColors ? themeColors.stroke : '#2E5C8A'), // Darker blue border
    strokeWidth: options.strokeWidth || (themeColors ? themeColors.strokeWidth : 2.5),
    strokeUniform: true, // Keep stroke width constant when scaling
    rx: options.rx !== undefined ? options.rx : 10, // Slightly rounded corners by default
    ry: options.ry !== undefined ? options.ry : 10,
    id: generateId(),
    shapeType: SHAPE_TYPES.RECTANGLE,
    shadow: new fabric.Shadow({
      color: 'rgba(0, 0, 0, 0.15)',
      blur: 8,
      offsetX: 0,
      offsetY: 2,
    }),
  });

  // Text is now handled by persistent IText objects (see canvas.js)
  return rect;
}

/**
 * Create a circle shape
 */
function createCircle(options = {}) {
  // Get theme colors if not explicitly provided
  const themeColors = typeof getDefaultShapeColors === 'function' ? getDefaultShapeColors('circle') : null;

  const circle = new fabric.Circle({
    left: options.left || 100,
    top: options.top || 100,
    radius: options.radius || 50, // Start/End terminator
    fill: options.fill || (themeColors ? themeColors.fill : '#50C878'), // Emerald green
    stroke: options.stroke || (themeColors ? themeColors.stroke : '#2D7A4F'), // Darker green border
    strokeWidth: options.strokeWidth || (themeColors ? themeColors.strokeWidth : 2.5),
    strokeUniform: true, // Keep stroke width constant when scaling
    id: generateId(),
    shapeType: SHAPE_TYPES.CIRCLE,
    shadow: new fabric.Shadow({
      color: 'rgba(0, 0, 0, 0.15)',
      blur: 8,
      offsetX: 0,
      offsetY: 2,
    }),
  });

  // Text is now handled by persistent IText objects (see canvas.js)
  return circle;
}

/**
 * Create a diamond shape
 */
function createDiamond(options = {}) {
  // Get theme colors if not explicitly provided
  const themeColors = typeof getDefaultShapeColors === 'function' ? getDefaultShapeColors('diamond') : null;

  const width = options.width || 120; // Decision diamond
  const height = options.height || 120;

  const points = [
    { x: width / 2, y: 0 },
    { x: width, y: height / 2 },
    { x: width / 2, y: height },
    { x: 0, y: height / 2 },
  ];

  const diamond = new fabric.Polygon(points, {
    left: options.left || 100,
    top: options.top || 100,
    fill: options.fill || (themeColors ? themeColors.fill : '#ea6b62'), // Warm orange/amber
    stroke: options.stroke || (themeColors ? themeColors.stroke : '#cc3e2e'), // Darker orange border
    strokeWidth: options.strokeWidth || (themeColors ? themeColors.strokeWidth : 2.5),
    strokeUniform: true, // Keep stroke width constant when scaling
    id: generateId(),
    shapeType: SHAPE_TYPES.DIAMOND,
    shadow: new fabric.Shadow({
      color: 'rgba(0, 0, 0, 0.15)',
      blur: 8,
      offsetX: 0,
      offsetY: 2,
    }),
  });

  // Text is now handled by persistent IText objects (see canvas.js)
  return diamond;
}

/**
 * Create a triangle shape
 */
function createTriangle(options = {}) {
  // Get theme colors if not explicitly provided
  const themeColors = typeof getDefaultShapeColors === 'function' ? getDefaultShapeColors('triangle') : null;

  const triangle = new fabric.Triangle({
    left: options.left || 100,
    top: options.top || 100,
    width: options.width || 120, // Data/Document shape
    height: options.height || 100,
    fill: options.fill || (themeColors ? themeColors.fill : '#A78BFA'), // Purple/Lavender
    stroke: options.stroke || (themeColors ? themeColors.stroke : '#7C5CBF'), // Darker purple border
    strokeWidth: options.strokeWidth || (themeColors ? themeColors.strokeWidth : 2.5),
    strokeUniform: true, // Keep stroke width constant when scaling
    id: generateId(),
    shapeType: SHAPE_TYPES.TRIANGLE,
    shadow: new fabric.Shadow({
      color: 'rgba(0, 0, 0, 0.15)',
      blur: 8,
      offsetX: 0,
      offsetY: 2,
    }),
  });

  // Text is now handled by persistent IText objects (see canvas.js)
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
    fill: options.fill || '#1a1a1a', // Darker text for better readability
    fontFamily: options.fontFamily || 'Arial',
    textAlign: options.textAlign || 'left',
    id: generateId(),
    shapeType: SHAPE_TYPES.TEXT,
  });
}

/**
 * Create an arrow/line
 */
function createArrow(options = {}) {
  // Make line coordinates relative (0,0 to 0,100 for vertical)
  const points = [
    0, // x1 - relative to line's position
    0, // y1 - relative to line's position
    0, // x2 - same X = vertical
    100, // y2 - 100px down (already multiple of 20: 5 * 20)
  ];

  return new fabric.Line(points, {
    left: options.left || 100,
    top: options.top || 100,
    stroke: options.stroke || '#2c3e50',
    strokeWidth: options.strokeWidth || 2,
    id: generateId(),
    shapeType: SHAPE_TYPES.ARROW,
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
    [SHAPE_TYPES.ARROW]: createArrow,
  };

  return factories[type] || createRectangle;
}

/**
 * Clone a shape
 */
function cloneShape(shape, callback) {
  shape.clone(function (cloned) {
    cloned.set({
      left: shape.left + 20,
      top: shape.top + 20,
      id: generateId(),
    });
    if (callback) callback(cloned);
  });
}

/**
 * DEPRECATED: Old text rendering system
 * Text is now handled by persistent IText objects in canvas.js
 * This function is kept for backward compatibility with old saved files
 */
function addTextToShape(shape) {
  // No longer used - text is now handled by IText objects
  // Kept for backward compatibility
}
