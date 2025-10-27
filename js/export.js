// PowerPoint export and save/load functionality

/**
 * Initialize export functionality
 */
function initExport() {
    // Export to PowerPoint
    document.getElementById('export-pptx').addEventListener('click', exportToPowerPoint);

    // Save project
    document.getElementById('save-project').addEventListener('click', saveProject);

    // Load project
    document.getElementById('load-project').addEventListener('click', loadProject);

    // New project
    document.getElementById('new-project').addEventListener('click', newProject);

    // Setup undo/redo buttons
    document.getElementById('undo').addEventListener('click', handleUndo);
    document.getElementById('redo').addEventListener('click', handleRedo);
}

/**
 * Export canvas to PowerPoint
 */
async function exportToPowerPoint() {
    try {
        // Check if PptxGenJS is loaded
        if (typeof PptxGenJS === 'undefined') {
            showNotification('PowerPoint library not loaded. Please add pptxgen.min.js to the lib folder.', 'error');
            alert('PowerPoint export requires pptxgen.min.js library.\n\nPlease download it from:\nhttps://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.min.js\n\nAnd place it in the lib/ folder.');
            return;
        }

        const pptx = new PptxGenJS();
        const slide = pptx.addSlide();

        // Get all objects from canvas
        const objects = canvas.getObjects();

        if (objects.length === 0) {
            showNotification('Canvas is empty. Add some shapes first!', 'warning');
            return;
        }

        // Convert each canvas object to PowerPoint shape
        objects.forEach(obj => {
            convertObjectToPptx(slide, obj);
        });

        // Download the file
        const filename = `smartchart_${new Date().getTime()}.pptx`;
        await pptx.writeFile({ fileName: filename });

        showNotification(`Exported to ${filename} successfully!`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification(`Export failed: ${error.message}`, 'error');
        alert(`Export failed: ${error.message}`);
    }
}

/**
 * Convert canvas object to PowerPoint shape
 */
function convertObjectToPptx(slide, obj) {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Convert canvas coordinates to PowerPoint inches (assuming 10" x 7.5" slide)
    const toInches = (val, dimension) => {
        const slideSize = dimension === 'width' ? 10 : 7.5;
        const canvasSize = dimension === 'width' ? canvasWidth : canvasHeight;
        return (val / canvasSize) * slideSize;
    };

    const x = toInches(obj.left, 'width');
    const y = toInches(obj.top, 'height');

    const options = {
        x: x,
        y: y,
        fill: { color: obj.fill ? obj.fill.replace('#', '') : '3498db' },
        line: { color: obj.stroke ? obj.stroke.replace('#', '') : '000000', width: obj.strokeWidth || 1 }
    };

    // Handle different object types
    switch (obj.type) {
        case 'rect':
            options.w = toInches(obj.width * (obj.scaleX || 1), 'width');
            options.h = toInches(obj.height * (obj.scaleY || 1), 'height');
            slide.addShape('rect', options);
            break;

        case 'circle':
            const diameter = obj.radius * 2 * (obj.scaleX || 1);
            options.w = toInches(diameter, 'width');
            options.h = toInches(diameter, 'height');
            slide.addShape('ellipse', options);
            break;

        case 'triangle':
            options.w = toInches(obj.width * (obj.scaleX || 1), 'width');
            options.h = toInches(obj.height * (obj.scaleY || 1), 'height');
            slide.addShape('triangle', options);
            break;

        case 'textbox':
        case 'text':
            options.w = toInches(obj.width * (obj.scaleX || 1), 'width');
            options.h = toInches(obj.height * (obj.scaleY || 1), 'height');
            slide.addText(obj.text || '', {
                x: x,
                y: y,
                w: options.w,
                h: options.h,
                fontSize: obj.fontSize || 16,
                color: obj.fill ? obj.fill.replace('#', '') : '000000',
                fontFace: obj.fontFamily || 'Arial',
                align: obj.textAlign || 'left'
            });
            break;

        case 'line':
            options.w = toInches(obj.width * (obj.scaleX || 1), 'width');
            options.h = toInches(obj.height * (obj.scaleY || 1), 'height');
            slide.addShape('line', options);
            break;

        case 'polygon':
            // For diamond and other polygons, use rectangle as approximation
            options.w = toInches(obj.width * (obj.scaleX || 1), 'width');
            options.h = toInches(obj.height * (obj.scaleY || 1), 'height');
            slide.addShape('diamond', options);
            break;

        default:
            console.warn('Unsupported shape type:', obj.type);
    }
}

/**
 * Save project to JSON
 */
function saveProject() {
    try {
        const json = canvas.toJSON(['id', 'shapeType', 'text']);
        const jsonStr = JSON.stringify(json, null, 2);

        // Download as JSON file
        downloadFile(jsonStr, `smartchart_${new Date().getTime()}.json`, 'application/json');

        // Also save to localStorage
        localStorage.setItem('smartchart_autosave', jsonStr);

        showNotification('Project saved successfully!', 'success');
    } catch (error) {
        console.error('Save error:', error);
        showNotification(`Save failed: ${error.message}`, 'error');
    }
}

/**
 * Load project from JSON
 */
function loadProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                loadCanvasFromJSON(json);
                showNotification('Project loaded successfully!', 'success');
            } catch (error) {
                console.error('Load error:', error);
                showNotification(`Load failed: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

/**
 * Load canvas from JSON
 */
function loadCanvasFromJSON(json) {
    canvas.loadFromJSON(json, () => {
        // Re-apply text rendering to all loaded shapes
        canvas.getObjects().forEach(obj => {
            if (obj.type !== 'textbox' && obj.type !== 'i-text' && obj.type !== 'text') {
                addTextToShape(obj);
            }
        });

        canvas.requestRenderAll();
        stateManager.clear();
        saveCanvasState();
    });
}

/**
 * Create new project
 */
function newProject() {
    if (canvas.getObjects().length > 0) {
        if (!confirm('Are you sure? This will clear the current canvas.')) {
            return;
        }
    }

    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    stateManager.clear();
    clearPropertiesPanel();
    canvas.requestRenderAll();

    showNotification('New project created', 'success');
}

/**
 * Auto-save functionality
 */
function setupAutoSave() {
    // Auto-save every 30 seconds
    setInterval(() => {
        try {
            const json = canvas.toJSON(['id', 'shapeType', 'text']);
            localStorage.setItem('smartchart_autosave', JSON.stringify(json));
            console.log('Auto-saved');
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }, 30000);
}

/**
 * Try to restore from auto-save
 */
function restoreAutoSave() {
    try {
        const saved = localStorage.getItem('smartchart_autosave');
        if (saved && canvas.getObjects().length === 0) {
            // Show notification bar instead of alert
            showAutoSaveNotification(saved);
        }
    } catch (error) {
        console.error('Auto-save restore error:', error);
    }
}

/**
 * Show auto-save notification bar
 */
function showAutoSaveNotification(savedData) {
    const notification = document.getElementById('autosave-notification');
    const restoreBtn = document.getElementById('restore-autosave');
    const dismissBtn = document.getElementById('dismiss-autosave');

    // Show the notification
    notification.classList.remove('hidden');

    // Handle restore button
    restoreBtn.onclick = () => {
        try {
            const json = JSON.parse(savedData);
            loadCanvasFromJSON(json);
            showNotification('Auto-save restored', 'success');
            notification.classList.add('hidden');
        } catch (error) {
            console.error('Restore error:', error);
            showNotification('Failed to restore auto-save', 'error');
        }
    };

    // Handle dismiss button
    dismissBtn.onclick = () => {
        notification.classList.add('hidden');
        // Optionally clear the auto-save
        // localStorage.removeItem('smartchart_autosave');
    };
}

// Initialize export functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initExport();
    setupAutoSave();

    // Try to restore auto-save after a brief delay
    setTimeout(restoreAutoSave, 1000);
});
