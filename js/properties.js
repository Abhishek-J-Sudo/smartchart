// Right sidebar - Properties panel

/**
 * Initialize properties panel
 */
function initPropertiesPanel() {
    const panel = document.getElementById('properties-panel');

    // Create property controls
    panel.innerHTML = `
        <div id="no-selection">
            <p>Select a shape to edit its properties</p>
        </div>
        <div id="shape-properties" class="hidden">
            <div class="property-group">
                <label>Fill Color</label>
                <input type="color" id="prop-fill" />
            </div>

            <div class="property-group">
                <label>Border Color</label>
                <input type="color" id="prop-stroke" />
            </div>

            <div class="property-group">
                <label>Border Width</label>
                <input type="number" id="prop-stroke-width" min="0" max="20" value="2" />
            </div>

            <div class="property-group">
                <label>Border Style</label>
                <select id="prop-stroke-style">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                </select>
            </div>

            <div class="property-group">
                <label>Opacity</label>
                <input type="range" id="prop-opacity" min="0" max="1" step="0.1" value="1" />
            </div>

            <div class="property-group">
                <label>Position</label>
                <div class="property-row">
                    <input type="number" id="prop-left" placeholder="X" />
                    <input type="number" id="prop-top" placeholder="Y" />
                </div>
            </div>

            <div class="property-group">
                <label>Size</label>
                <div class="property-row">
                    <input type="number" id="prop-width" placeholder="Width" />
                    <input type="number" id="prop-height" placeholder="Height" />
                </div>
            </div>

            <div class="property-group" id="text-properties" class="hidden">
                <label>Font Size</label>
                <input type="number" id="prop-font-size" min="8" max="72" value="16" />
            </div>

            <div class="property-group" id="text-properties-2" class="hidden">
                <label>Font Family</label>
                <select id="prop-font-family">
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                </select>
            </div>

            <div class="property-group">
                <label>Layer</label>
                <div class="property-row">
                    <button id="bring-forward">Forward</button>
                    <button id="send-backward">Backward</button>
                </div>
            </div>

            <div class="property-group">
                <button id="delete-shape" style="background-color: #e74c3c; color: white; padding: 10px; border: none; border-radius: 4px; cursor: pointer; width: 100%;">Delete Shape</button>
            </div>
        </div>
    `;

    setupPropertyListeners();
}

/**
 * Setup property change listeners
 */
function setupPropertyListeners() {
    // Fill color
    document.getElementById('prop-fill').addEventListener('input', (e) => {
        updateActiveObjectProperty('fill', e.target.value);
    });

    // Stroke color
    document.getElementById('prop-stroke').addEventListener('input', (e) => {
        updateActiveObjectProperty('stroke', e.target.value);
    });

    // Stroke width
    document.getElementById('prop-stroke-width').addEventListener('input', (e) => {
        updateActiveObjectProperty('strokeWidth', parseInt(e.target.value));
    });

    // Stroke style
    document.getElementById('prop-stroke-style').addEventListener('change', (e) => {
        const style = e.target.value;
        const dashArray = style === 'dashed' ? [5, 5] : style === 'dotted' ? [2, 2] : null;
        updateActiveObjectProperty('strokeDashArray', dashArray);
    });

    // Opacity
    document.getElementById('prop-opacity').addEventListener('input', (e) => {
        updateActiveObjectProperty('opacity', parseFloat(e.target.value));
    });

    // Position
    document.getElementById('prop-left').addEventListener('input', (e) => {
        updateActiveObjectProperty('left', parseInt(e.target.value));
    });

    document.getElementById('prop-top').addEventListener('input', (e) => {
        updateActiveObjectProperty('top', parseInt(e.target.value));
    });

    // Size
    document.getElementById('prop-width').addEventListener('input', (e) => {
        updateActiveObjectSize('width', parseInt(e.target.value));
    });

    document.getElementById('prop-height').addEventListener('input', (e) => {
        updateActiveObjectSize('height', parseInt(e.target.value));
    });

    // Font size
    document.getElementById('prop-font-size').addEventListener('input', (e) => {
        updateActiveObjectProperty('fontSize', parseInt(e.target.value));
    });

    // Font family
    document.getElementById('prop-font-family').addEventListener('change', (e) => {
        updateActiveObjectProperty('fontFamily', e.target.value);
    });

    // Layer controls
    document.getElementById('bring-forward').addEventListener('click', () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            canvas.bringForward(activeObject);
            canvas.requestRenderAll();
        }
    });

    document.getElementById('send-backward').addEventListener('click', () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            canvas.sendBackwards(activeObject);
            canvas.requestRenderAll();
        }
    });

    // Delete shape
    document.getElementById('delete-shape').addEventListener('click', () => {
        handleDelete();
    });
}

/**
 * Update properties panel based on selection
 */
function updatePropertiesPanel(selectedObjects) {
    if (!selectedObjects || selectedObjects.length === 0) {
        clearPropertiesPanel();
        return;
    }

    const obj = selectedObjects[0];

    document.getElementById('no-selection').classList.add('hidden');
    document.getElementById('shape-properties').classList.remove('hidden');

    // Update property values
    if (obj.fill) document.getElementById('prop-fill').value = obj.fill;
    if (obj.stroke) document.getElementById('prop-stroke').value = obj.stroke;
    if (obj.strokeWidth) document.getElementById('prop-stroke-width').value = obj.strokeWidth;
    if (obj.opacity !== undefined) document.getElementById('prop-opacity').value = obj.opacity;

    document.getElementById('prop-left').value = Math.round(obj.left);
    document.getElementById('prop-top').value = Math.round(obj.top);

    // Handle different object types
    if (obj.width !== undefined) {
        document.getElementById('prop-width').value = Math.round(obj.width * (obj.scaleX || 1));
    }
    if (obj.height !== undefined) {
        document.getElementById('prop-height').value = Math.round(obj.height * (obj.scaleY || 1));
    }
    if (obj.radius !== undefined) {
        document.getElementById('prop-width').value = Math.round(obj.radius * 2 * (obj.scaleX || 1));
        document.getElementById('prop-height').value = Math.round(obj.radius * 2 * (obj.scaleY || 1));
    }

    // Show/hide text properties
    if (obj.type === 'textbox' || obj.type === 'text') {
        document.getElementById('text-properties').classList.remove('hidden');
        document.getElementById('text-properties-2').classList.remove('hidden');
        if (obj.fontSize) document.getElementById('prop-font-size').value = obj.fontSize;
        if (obj.fontFamily) document.getElementById('prop-font-family').value = obj.fontFamily;
    } else {
        document.getElementById('text-properties').classList.add('hidden');
        document.getElementById('text-properties-2').classList.add('hidden');
    }
}

/**
 * Clear properties panel
 */
function clearPropertiesPanel() {
    document.getElementById('no-selection').classList.remove('hidden');
    document.getElementById('shape-properties').classList.add('hidden');
}

/**
 * Update active object property
 */
function updateActiveObjectProperty(property, value) {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        activeObject.set(property, value);
        canvas.requestRenderAll();
        saveCanvasState();
    }
}

/**
 * Update active object size
 */
function updateActiveObjectSize(dimension, value) {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    if (activeObject.type === 'circle') {
        const radius = value / 2;
        activeObject.set('radius', radius);
        activeObject.set('scaleX', 1);
        activeObject.set('scaleY', 1);
    } else {
        const currentValue = dimension === 'width' ?
            (activeObject.width * (activeObject.scaleX || 1)) :
            (activeObject.height * (activeObject.scaleY || 1));

        if (currentValue > 0) {
            const scale = value / (dimension === 'width' ? activeObject.width : activeObject.height);
            activeObject.set(dimension === 'width' ? 'scaleX' : 'scaleY', scale);
        }
    }

    canvas.requestRenderAll();
    saveCanvasState();
}

// Initialize properties panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initPropertiesPanel();
});
