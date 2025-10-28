// Right sidebar - Properties panel

/**
 * Initialize properties panel
 */
function initPropertiesPanel() {
    const panel = document.getElementById('properties-panel');

    // Create property controls
    panel.innerHTML = `
        <div id="no-selection" style="padding: 40px 20px; text-align: center; color: #95a5a6;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 16px; opacity: 0.5;">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 12h6M12 9v6"/>
            </svg>
            <p style="margin: 0; font-size: 14px; font-weight: 500;">Select an object to view properties</p>
        </div>
        <div id="shape-properties" class="hidden">
            <!-- Style Section -->
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 16px 0; font-size: 13px; font-weight: 600; color: #2c3e50; text-transform: uppercase; letter-spacing: 0.5px;">Style</h4>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px;">Fill</label>
                        <input type="color" id="prop-fill" style="width: 100%; height: 40px; padding: 2px; border: 2px solid #dee2e6; border-radius: 6px; cursor: pointer;" />
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px;">Stroke</label>
                        <input type="color" id="prop-stroke" style="width: 100%; height: 40px; padding: 2px; border: 2px solid #dee2e6; border-radius: 6px; cursor: pointer;" />
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px;">Width</label>
                        <input type="number" id="prop-stroke-width" min="0" max="20" value="2" style="width: 100%; padding: 8px 10px; border: 2px solid #dee2e6; border-radius: 6px; font-size: 13px; font-weight: 500;" />
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px;">Style</label>
                        <select id="prop-stroke-style" style="width: 100%; padding: 8px 10px; border: 2px solid #dee2e6; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: 500;">
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                        </select>
                    </div>
                </div>

                <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px;">Opacity</label>
                <input type="range" id="prop-opacity" min="0" max="1" step="0.1" value="1" style="width: 100%; height: 6px; cursor: pointer; accent-color: #3498db;" />
            </div>

            <!-- Transform Section -->
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 16px 0; font-size: 13px; font-weight: 600; color: #2c3e50; text-transform: uppercase; letter-spacing: 0.5px;">Transform</h4>

                <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px;">Position</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                    <div style="position: relative;">
                        <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 600; color: #95a5a6;">X</span>
                        <input type="number" id="prop-left" placeholder="0" style="width: 100%; padding: 8px 10px 8px 26px; border: 2px solid #dee2e6; border-radius: 6px; font-size: 13px; font-weight: 500;" />
                    </div>
                    <div style="position: relative;">
                        <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 600; color: #95a5a6;">Y</span>
                        <input type="number" id="prop-top" placeholder="0" style="width: 100%; padding: 8px 10px 8px 26px; border: 2px solid #dee2e6; border-radius: 6px; font-size: 13px; font-weight: 500;" />
                    </div>
                </div>

                <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px;">Size</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="position: relative;">
                        <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 600; color: #95a5a6;">W</span>
                        <input type="number" id="prop-width" placeholder="0" style="width: 100%; padding: 8px 10px 8px 28px; border: 2px solid #dee2e6; border-radius: 6px; font-size: 13px; font-weight: 500;" />
                    </div>
                    <div style="position: relative;">
                        <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 600; color: #95a5a6;">H</span>
                        <input type="number" id="prop-height" placeholder="0" style="width: 100%; padding: 8px 10px 8px 26px; border: 2px solid #dee2e6; border-radius: 6px; font-size: 13px; font-weight: 500;" />
                    </div>
                </div>
            </div>

            <!-- Text Section -->
            <div id="text-properties-group" class="hidden" style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 16px 0; font-size: 13px; font-weight: 600; color: #2c3e50; text-transform: uppercase; letter-spacing: 0.5px;">Text</h4>

                <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px;">Font Family</label>
                <select id="prop-font-family" style="width: 100%; padding: 8px 10px; margin-bottom: 12px; border: 2px solid #dee2e6; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: 500;">
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                </select>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px;">Size</label>
                        <input type="number" id="prop-font-size" min="8" max="72" value="16" style="width: 100%; padding: 8px 10px; border: 2px solid #dee2e6; border-radius: 6px; font-size: 13px; font-weight: 500;" />
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px;">Color</label>
                        <input type="color" id="prop-text-color" value="#000000" style="width: 100%; height: 38px; padding: 2px; border: 2px solid #dee2e6; border-radius: 6px; cursor: pointer;" />
                    </div>
                </div>

                <label style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px;">Background</label>
                <input type="color" id="prop-text-bg-color" value="#ffffff" style="width: 100%; height: 40px; padding: 2px; margin-bottom: 12px; border: 2px solid #dee2e6; border-radius: 6px; cursor: pointer;" />

                <label style="display: block; margin-bottom: 8px; font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px;">Style</label>
                <div class="property-row" style="display: flex; gap: 8px; margin-bottom: 12px;">
                    <button id="text-bold" class="text-format-btn" title="Bold" style="flex: 1; padding: 10px; border: 2px solid #dee2e6; border-radius: 6px; background: white; cursor: pointer; font-weight: bold; font-size: 14px; transition: all 0.2s;">B</button>
                    <button id="text-italic" class="text-format-btn" title="Italic" style="flex: 1; padding: 10px; border: 2px solid #dee2e6; border-radius: 6px; background: white; cursor: pointer; font-style: italic; font-size: 14px; transition: all 0.2s;">I</button>
                    <button id="text-underline" class="text-format-btn" title="Underline" style="flex: 1; padding: 10px; border: 2px solid #dee2e6; border-radius: 6px; background: white; cursor: pointer; text-decoration: underline; font-size: 14px; transition: all 0.2s;">U</button>
                </div>

                <label style="display: block; margin-bottom: 8px; font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px;">Alignment</label>
                <div class="property-row" style="display: flex; gap: 8px;">
                    <button id="text-align-left" class="text-align-btn" title="Align Left" style="flex: 1; padding: 10px; border: 2px solid #dee2e6; border-radius: 6px; background: white; cursor: pointer; font-size: 16px; transition: all 0.2s;">←</button>
                    <button id="text-align-center" class="text-align-btn" title="Align Center" style="flex: 1; padding: 10px; border: 2px solid #dee2e6; border-radius: 6px; background: white; cursor: pointer; font-size: 16px; transition: all 0.2s;">↔</button>
                    <button id="text-align-right" class="text-align-btn" title="Align Right" style="flex: 1; padding: 10px; border: 2px solid #dee2e6; border-radius: 6px; background: white; cursor: pointer; font-size: 16px; transition: all 0.2s;">→</button>
                </div>
            </div>

            <!-- Arrange Section -->
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #2c3e50; text-transform: uppercase; letter-spacing: 0.5px;">Arrange</h4>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                    <button id="bring-forward" style="padding: 10px 12px; border: 2px solid #dee2e6; border-radius: 6px; background: white; color: #495057; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s;">↑ Forward</button>
                    <button id="send-backward" style="padding: 10px 12px; border: 2px solid #dee2e6; border-radius: 6px; background: white; color: #495057; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s;">↓ Backward</button>
                </div>

                <button id="delete-shape" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 12px; border: none; border-radius: 6px; cursor: pointer; width: 100%; font-size: 13px; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 4px rgba(231, 76, 60, 0.3);">🗑 Delete</button>
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
        boldBtn.style.borderColor = '#3498db';
    } else {
        boldBtn.style.backgroundColor = 'white';
        boldBtn.style.color = '#333';
        boldBtn.style.borderColor = '#ddd';
    }

    // Italic
    if (textObj.fontStyle === 'italic') {
        italicBtn.style.backgroundColor = '#3498db';
        italicBtn.style.color = 'white';
        italicBtn.style.borderColor = '#3498db';
    } else {
        italicBtn.style.backgroundColor = 'white';
        italicBtn.style.color = '#333';
        italicBtn.style.borderColor = '#ddd';
    }

    // Underline
    if (textObj.underline === true) {
        underlineBtn.style.backgroundColor = '#3498db';
        underlineBtn.style.color = 'white';
        underlineBtn.style.borderColor = '#3498db';
    } else {
        underlineBtn.style.backgroundColor = 'white';
        underlineBtn.style.color = '#333';
        underlineBtn.style.borderColor = '#ddd';
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
    leftBtn.style.color = '#333';
    leftBtn.style.borderColor = '#ddd';
    centerBtn.style.backgroundColor = 'white';
    centerBtn.style.color = '#333';
    centerBtn.style.borderColor = '#ddd';
    rightBtn.style.backgroundColor = 'white';
    rightBtn.style.color = '#333';
    rightBtn.style.borderColor = '#ddd';

    // Highlight active
    const align = textObj.textAlign || 'left';
    if (align === 'left') {
        leftBtn.style.backgroundColor = '#3498db';
        leftBtn.style.color = 'white';
        leftBtn.style.borderColor = '#3498db';
    } else if (align === 'center') {
        centerBtn.style.backgroundColor = '#3498db';
        centerBtn.style.color = 'white';
        centerBtn.style.borderColor = '#3498db';
    } else if (align === 'right') {
        rightBtn.style.backgroundColor = '#3498db';
        rightBtn.style.color = 'white';
        rightBtn.style.borderColor = '#3498db';
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
