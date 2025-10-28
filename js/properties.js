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

            <div class="property-group" id="text-properties-group" class="hidden">
                <h3 style="margin-top: 10px; margin-bottom: 10px; font-size: 14px;">Text Formatting</h3>

                <label>Font Family</label>
                <select id="prop-font-family">
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                </select>

                <label style="margin-top: 8px;">Font Size</label>
                <input type="number" id="prop-font-size" min="8" max="72" value="16" />

                <label style="margin-top: 8px;">Text Color</label>
                <input type="color" id="prop-text-color" value="#000000" />

                <label style="margin-top: 8px;">Text Background</label>
                <input type="color" id="prop-text-bg-color" value="#ffffff" />

                <label style="margin-top: 8px;">Font Style</label>
                <div class="property-row" style="display: flex; gap: 5px; margin-top: 5px;">
                    <button id="text-bold" class="text-format-btn" title="Bold" style="flex: 1; padding: 8px; border: 1px solid #ccc; background: white; cursor: pointer; font-weight: bold;">B</button>
                    <button id="text-italic" class="text-format-btn" title="Italic" style="flex: 1; padding: 8px; border: 1px solid #ccc; background: white; cursor: pointer; font-style: italic;">I</button>
                    <button id="text-underline" class="text-format-btn" title="Underline" style="flex: 1; padding: 8px; border: 1px solid #ccc; background: white; cursor: pointer; text-decoration: underline;">U</button>
                </div>

                <label style="margin-top: 8px;">Text Align</label>
                <div class="property-row" style="display: flex; gap: 5px; margin-top: 5px;">
                    <button id="text-align-left" class="text-align-btn" title="Align Left" style="flex: 1; padding: 8px; border: 1px solid #ccc; background: white; cursor: pointer;">⬅</button>
                    <button id="text-align-center" class="text-align-btn" title="Align Center" style="flex: 1; padding: 8px; border: 1px solid #ccc; background: white; cursor: pointer;">↔</button>
                    <button id="text-align-right" class="text-align-btn" title="Align Right" style="flex: 1; padding: 8px; border: 1px solid #ccc; background: white; cursor: pointer;">➡</button>
                </div>
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
        updateTextProperty('fontSize', parseInt(e.target.value));
    });

    // Font family
    document.getElementById('prop-font-family').addEventListener('change', (e) => {
        updateTextProperty('fontFamily', e.target.value);
    });

    // Text color
    document.getElementById('prop-text-color').addEventListener('input', (e) => {
        updateTextProperty('fill', e.target.value);
    });

    // Text background color
    document.getElementById('prop-text-bg-color').addEventListener('input', (e) => {
        updateTextProperty('backgroundColor', e.target.value);
    });

    // Bold
    document.getElementById('text-bold').addEventListener('click', () => {
        toggleTextStyle('fontWeight', 'bold', 'normal');
    });

    // Italic
    document.getElementById('text-italic').addEventListener('click', () => {
        toggleTextStyle('fontStyle', 'italic', 'normal');
    });

    // Underline
    document.getElementById('text-underline').addEventListener('click', () => {
        toggleTextStyle('underline', true, false);
    });

    // Text align
    document.getElementById('text-align-left').addEventListener('click', () => {
        updateTextProperty('textAlign', 'left');
    });

    document.getElementById('text-align-center').addEventListener('click', () => {
        updateTextProperty('textAlign', 'center');
    });

    document.getElementById('text-align-right').addEventListener('click', () => {
        updateTextProperty('textAlign', 'right');
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

    // Show/hide text properties for text objects and shape/connector text
    const isTextObject = obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text';
    const isShapeTextObject = isTextObject && obj._isShapeText; // User selected the shape's text directly
    const isConnectorTextObject = isTextObject && obj._isConnectorText; // User selected the connector's text directly
    const isConnectorWithText = (obj.isConnector || obj.isConnectorArrow) && obj.connectorObject && obj.connectorObject._textObject;

    // Only show RTE when:
    // 1. A standalone text object is selected
    // 2. A shape's text object is selected (not the shape itself)
    // 3. A connector's text object is selected OR the connector itself is selected
    if ((isTextObject && !obj._parentShape) || isShapeTextObject || isConnectorTextObject || isConnectorWithText) {
        document.getElementById('text-properties-group').classList.remove('hidden');

        // Get the actual text object
        let textObj = obj;
        if (isConnectorWithText && !isConnectorTextObject) {
            // Connector line/arrow selected, get its text object
            textObj = obj.connectorObject._textObject;
        }
        // If shape text or connector text is selected directly, obj is already the text object

        // Update text formatting controls
        if (textObj.fontSize) document.getElementById('prop-font-size').value = textObj.fontSize;
        if (textObj.fontFamily) document.getElementById('prop-font-family').value = textObj.fontFamily;

        // Convert color to hex format for color picker
        if (textObj.fill) {
            const fillColor = convertToHex(textObj.fill);
            document.getElementById('prop-text-color').value = fillColor;
        }
        if (textObj.backgroundColor) {
            const bgColor = convertToHex(textObj.backgroundColor);
            document.getElementById('prop-text-bg-color').value = bgColor;
        }

        // Update button states for bold/italic/underline
        updateTextFormatButtonStates(textObj);
        updateTextAlignButtonStates(textObj);
    } else {
        document.getElementById('text-properties-group').classList.add('hidden');
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

/**
 * Update text property for the active text object (including shape/connector text)
 */
function updateTextProperty(property, value) {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    let textObj = null;

    // Check if it's a text object
    if (activeObject.type === 'textbox' || activeObject.type === 'text' || activeObject.type === 'i-text') {
        textObj = activeObject;
    }
    // Check if it's a shape with text
    else if (activeObject._textObject) {
        textObj = activeObject._textObject;
    }
    // Check if it's a connector with text
    else if ((activeObject.isConnector || activeObject.isConnectorArrow) && activeObject.connectorObject && activeObject.connectorObject._textObject) {
        textObj = activeObject.connectorObject._textObject;
    }

    if (textObj) {
        textObj.set(property, value);
        canvas.requestRenderAll();
        saveCanvasState();

        // Update button states after change
        if (property === 'textAlign') {
            updateTextAlignButtonStates(textObj);
        }
    }
}

/**
 * Toggle text style (bold, italic, underline)
 */
function toggleTextStyle(property, activeValue, inactiveValue) {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    let textObj = null;

    // Check if it's a text object
    if (activeObject.type === 'textbox' || activeObject.type === 'text' || activeObject.type === 'i-text') {
        textObj = activeObject;
    }
    // Check if it's a shape with text
    else if (activeObject._textObject) {
        textObj = activeObject._textObject;
    }
    // Check if it's a connector with text
    else if ((activeObject.isConnector || activeObject.isConnectorArrow) && activeObject.connectorObject && activeObject.connectorObject._textObject) {
        textObj = activeObject.connectorObject._textObject;
    }

    if (textObj) {
        const currentValue = textObj.get(property);
        const newValue = currentValue === activeValue ? inactiveValue : activeValue;
        textObj.set(property, newValue);
        canvas.requestRenderAll();
        saveCanvasState();

        // Update button states
        updateTextFormatButtonStates(textObj);
    }
}

/**
 * Update text format button states (bold, italic, underline)
 */
function updateTextFormatButtonStates(textObj) {
    const boldBtn = document.getElementById('text-bold');
    const italicBtn = document.getElementById('text-italic');
    const underlineBtn = document.getElementById('text-underline');

    // Bold
    if (textObj.fontWeight === 'bold') {
        boldBtn.style.backgroundColor = '#3498db';
        boldBtn.style.color = 'white';
    } else {
        boldBtn.style.backgroundColor = 'white';
        boldBtn.style.color = 'black';
    }

    // Italic
    if (textObj.fontStyle === 'italic') {
        italicBtn.style.backgroundColor = '#3498db';
        italicBtn.style.color = 'white';
    } else {
        italicBtn.style.backgroundColor = 'white';
        italicBtn.style.color = 'black';
    }

    // Underline
    if (textObj.underline === true) {
        underlineBtn.style.backgroundColor = '#3498db';
        underlineBtn.style.color = 'white';
    } else {
        underlineBtn.style.backgroundColor = 'white';
        underlineBtn.style.color = 'black';
    }
}

/**
 * Update text align button states
 */
function updateTextAlignButtonStates(textObj) {
    const leftBtn = document.getElementById('text-align-left');
    const centerBtn = document.getElementById('text-align-center');
    const rightBtn = document.getElementById('text-align-right');

    // Reset all
    leftBtn.style.backgroundColor = 'white';
    leftBtn.style.color = 'black';
    centerBtn.style.backgroundColor = 'white';
    centerBtn.style.color = 'black';
    rightBtn.style.backgroundColor = 'white';
    rightBtn.style.color = 'black';

    // Highlight active
    const align = textObj.textAlign || 'left';
    if (align === 'left') {
        leftBtn.style.backgroundColor = '#3498db';
        leftBtn.style.color = 'white';
    } else if (align === 'center') {
        centerBtn.style.backgroundColor = '#3498db';
        centerBtn.style.color = 'white';
    } else if (align === 'right') {
        rightBtn.style.backgroundColor = '#3498db';
        rightBtn.style.color = 'white';
    }
}

/**
 * Convert color to hex format for color picker
 */
function convertToHex(color) {
    if (!color) return '#000000';

    // Already hex
    if (color.startsWith('#')) return color;

    // Named colors
    const namedColors = {
        'black': '#000000',
        'white': '#ffffff',
        'red': '#ff0000',
        'green': '#00ff00',
        'blue': '#0000ff'
    };

    if (namedColors[color.toLowerCase()]) {
        return namedColors[color.toLowerCase()];
    }

    // RGB format: rgb(255, 255, 255)
    if (color.startsWith('rgb')) {
        const matches = color.match(/\d+/g);
        if (matches && matches.length >= 3) {
            const r = parseInt(matches[0]).toString(16).padStart(2, '0');
            const g = parseInt(matches[1]).toString(16).padStart(2, '0');
            const b = parseInt(matches[2]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        }
    }

    return '#000000';
}

// Initialize properties panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initPropertiesPanel();
});
