// Flowchart color themes for shapes

const FLOWCHART_THEMES = {
  'corporate-blue': {
    name: 'Corporate Blue',
    strokeWidth: 1,
    connectorWidth: 1.8,
    colors: {
      rectangle: { fill: '#e4effb', stroke: '#5786b2' }, // Process
      circle: { fill: '#b5e3b5', stroke: '#5786b2' }, // Start/End
      diamond: { fill: '#ffc2c2', stroke: '#5786b2' }, // Decision (was Action)
      triangle: { fill: '#f9ebd7', stroke: '#5786b2' }, // Action (was Decision)
      oval: { fill: '#5BC0DE', stroke: '#5786b2' }, // Connector
    },
  },
  'neutral-gray': {
    name: 'Neutral Gray',
    strokeWidth: 2,
    connectorWidth: 1.5,
    colors: {
      rectangle: { fill: '#D1D5DB', stroke: '#a0a6b0' },
      circle: { fill: '#d8eee4', stroke: '#72a192' },
      diamond: { fill: '#f7d9d9', stroke: '#ae8484' },
      triangle: { fill: '#f9f2d7', stroke: '#a8a267' },
      oval: { fill: '#93C5FD', stroke: '#2563EB' },
    },
  },
  'forest-green': {
    name: 'Forest Green',
    strokeWidth: 1.5,
    connectorWidth: 1.8,
    colors: {
      rectangle: { fill: '#6CA965', stroke: '#3F704D' },
      circle: { fill: '#82C897', stroke: '#4E8C6A' },
      diamond: { fill: '#F38181', stroke: '#A94C4C' },
      triangle: { fill: '#F1C232', stroke: '#B8860B' },
      oval: { fill: '#9AD3BC', stroke: '#5F9C8A' },
    },
  },
  'ocean-teal': {
    name: 'Ocean Teal',
    strokeWidth: 1.5,
    connectorWidth: 1.8,
    colors: {
      rectangle: { fill: '#48A9A6', stroke: '#2C6E6C' },
      circle: { fill: '#8be9d3', stroke: '#3F958A' },
      diamond: { fill: '#EE964B', stroke: '#BB6A1C' },
      triangle: { fill: '#F4D35E', stroke: '#C49B1C' },
      oval: { fill: '#56CFE1', stroke: '#249FB1' },
    },
  },
  'steel-slate': {
    name: 'Steel Slate',
    strokeWidth: 2,
    connectorWidth: 1.8,
    colors: {
      rectangle: { fill: '#f1f6fe', stroke: '#87a1c5' },
      circle: { fill: '#e5f7ff', stroke: '#0284c7' },
      diamond: { fill: '#ffe5e5', stroke: '#b91c1c' },
      triangle: { fill: '#fdf9e8', stroke: '#b38e09' },
      oval: { fill: '#A5B4FC', stroke: '#6366F1' },
    },
  },
  'warm-beige': {
    name: 'Warm Beige',
    strokeWidth: 2,
    connectorWidth: 1.5,
    colors: {
      rectangle: { fill: '#EBD9B4', stroke: '#BDA97E' },
      circle: { fill: '#A7C7A2', stroke: '#6B8E6B' },
      diamond: { fill: '#E59866', stroke: '#A85E32' },
      triangle: { fill: '#F2CC8F', stroke: '#C2933D' },
      oval: { fill: '#C9ADA7', stroke: '#9B7C77' },
    },
  },
  'navy-classic': {
    name: 'Navy Classic',
    strokeWidth: 1,
    connectorWidth: 1.8,
    colors: {
      rectangle: { fill: '#2C5282', stroke: '#1A365D' },
      circle: { fill: '#38A169', stroke: '#276749' },
      diamond: { fill: '#E53E3E', stroke: '#9B2C2C' },
      triangle: { fill: '#ECC94B', stroke: '#B7791F' },
      oval: { fill: '#63B3ED', stroke: '#2B6CB0' },
    },
  },
  'tech-cool': {
    name: 'Tech Cool',
    strokeWidth: 1,
    connectorWidth: 1.6,
    colors: {
      rectangle: { fill: '#60A5FA', stroke: '#2563EB' },
      circle: { fill: '#34D399', stroke: '#059669' },
      diamond: { fill: '#F87171', stroke: '#B91C1C' },
      triangle: { fill: '#FBBF24', stroke: '#B45309' },
      oval: { fill: '#A78BFA', stroke: '#6D28D9' },
    },
  },
  'aqua-professional': {
    name: 'Aqua Professional',
    strokeWidth: 1.5,
    connectorWidth: 1.8,
    colors: {
      rectangle: { fill: '#69e9f2', stroke: '#72c5f8' },
      circle: { fill: '#6aecd0', stroke: '#46c8b2' },
      diamond: { fill: '#ffa38a', stroke: '#f17350' },
      triangle: { fill: '#f9de9a', stroke: '#eeb853' },
      oval: { fill: '#9AD3D6', stroke: '#4E9FA3' },
    },
  },
  'graphite-modern': {
    name: 'Graphite Modern',
    strokeWidth: 2,
    connectorWidth: 1.8,
    colors: {
      rectangle: { fill: '#737d8c', stroke: '#1F2937' },
      circle: { fill: '#8ccfb4', stroke: '#047857' },
      diamond: { fill: '#e47c7c', stroke: '#B91C1C' },
      triangle: { fill: '#f1d988', stroke: '#B45309' },
      oval: { fill: '#93C5FD', stroke: '#2563EB' },
    },
  },
};

/**
 * Get the default colors and stroke width for a shape type
 */
function getDefaultShapeColors(shapeType) {
  const currentTheme = localStorage.getItem('smartchart-flowchart-theme') || 'modern-blue';
  const theme = FLOWCHART_THEMES[currentTheme];

  if (!theme || !theme.colors[shapeType]) {
    // Fallback to modern-blue theme
    return {
      ...(FLOWCHART_THEMES['modern-blue'].colors[shapeType] || {
        fill: '#81afe4',
        stroke: '#2E5C8A',
      }),
      strokeWidth: FLOWCHART_THEMES['modern-blue'].strokeWidth || 2.5,
    };
  }

  return {
    ...theme.colors[shapeType],
    strokeWidth: theme.strokeWidth || 2.5,
  };
}

/**
 * Apply a flowchart theme to all shapes on the canvas
 */
function applyFlowchartTheme(themeName, canvas) {
  const theme = FLOWCHART_THEMES[themeName];
  if (!theme || !canvas) return;

  const objects = canvas.getObjects();

  objects.forEach((obj) => {
    // Handle connectors/lines separately
    if (obj.type === 'line' || obj.isConnector) {
      if (theme.connectorWidth) {
        obj.set({ strokeWidth: theme.connectorWidth });
      }
      return;
    }

    // Determine shape type based on object properties
    let shapeType = null;

    if (obj.type === 'rect') {
      // Check if it's a rounded rectangle (oval) or regular rectangle
      if (obj.rx && obj.rx > 20) {
        shapeType = 'oval';
      } else {
        shapeType = 'rectangle';
      }
    } else if (obj.type === 'circle') {
      shapeType = 'circle';
    } else if (obj.type === 'polygon') {
      // Distinguish between diamond and triangle by point count
      if (obj.points && obj.points.length === 4) {
        shapeType = 'diamond';
      } else if (obj.points && obj.points.length === 3) {
        shapeType = 'triangle';
      }
    } else if (obj.type === 'triangle') {
      shapeType = 'triangle';
    } else if (obj.type === 'group') {
      // For grouped shapes, apply theme to the main shape (first object in group)
      const mainShape = obj._objects && obj._objects[0];
      if (mainShape) {
        if (mainShape.type === 'rect') {
          shapeType = mainShape.rx && mainShape.rx > 20 ? 'oval' : 'rectangle';
        } else if (mainShape.type === 'circle') {
          shapeType = 'circle';
        } else if (mainShape.type === 'polygon') {
          shapeType = mainShape.points && mainShape.points.length === 4 ? 'diamond' : 'triangle';
        } else if (mainShape.type === 'triangle') {
          shapeType = 'triangle';
        }

        if (shapeType && theme.colors[shapeType]) {
          mainShape.set({
            fill: theme.colors[shapeType].fill,
            stroke: theme.colors[shapeType].stroke,
            strokeWidth: theme.strokeWidth || 2.5,
          });
        }
      }
    }

    // Apply colors and stroke width if shape type was identified
    if (shapeType && theme.colors[shapeType]) {
      obj.set({
        fill: theme.colors[shapeType].fill,
        stroke: theme.colors[shapeType].stroke,
        strokeWidth: theme.strokeWidth || 2.5,
      });
    }
  });

  // Save theme preference
  localStorage.setItem('smartchart-flowchart-theme', themeName);

  // Re-render canvas
  canvas.requestRenderAll();
}

/**
 * Load saved flowchart theme
 */
function loadSavedFlowchartTheme() {
  const savedTheme = localStorage.getItem('smartchart-flowchart-theme') || 'modern-blue';
  const themeSelect = document.getElementById('flowchart-theme-select');

  if (themeSelect) {
    themeSelect.value = savedTheme;
  }

  return savedTheme;
}

/**
 * Initialize flowchart theme switcher
 */
function initFlowchartThemeSwitcher(canvas) {
  const themeSelect = document.getElementById('flowchart-theme-select');

  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      applyFlowchartTheme(e.target.value, canvas);
    });
  }

  // Load saved theme on page load
  loadSavedFlowchartTheme();
}
