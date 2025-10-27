# SmartChart - Diagram Tool

A modern, web-based diagramming tool with PowerPoint export functionality. Create flowcharts, diagrams, and visual content with an intuitive drag-and-drop interface.

## Features

- **Infinite Canvas**: Pan and zoom like Figma
- **Shape Library**: Rectangles, circles, diamonds, triangles, text, and arrows
- **Drag & Drop**: Easy shape placement
- **Rich Editing**:
  - Resize, rotate, and position shapes
  - Customizable colors, borders, and styles
  - Text formatting options
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + Z` - Undo
  - `Ctrl/Cmd + Y` - Redo
  - `Ctrl/Cmd + C/V` - Copy/Paste
  - `Ctrl/Cmd + D` - Duplicate
  - `Ctrl/Cmd + A` - Select All
  - `Delete/Backspace` - Delete selected
- **PowerPoint Export**: Convert your diagrams to .pptx files
- **Save/Load**: Save projects as JSON and reload them
- **Auto-save**: Automatic local storage backup

## Getting Started

### Prerequisites

To enable PowerPoint export, download the PptxGenJS library:

1. Download from: https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.min.js
2. Place it in the `lib/` folder as `pptxgen.min.js`

### Running Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/Abhishek-J-Sudo/smartchart.git
   cd smartchart
   ```

2. Open `index.html` in your browser, or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx http-server
   ```

3. Navigate to `http://localhost:8000` in your browser

## Project Structure

```
smartchart/
├── index.html          # Main application page
├── css/
│   ├── main.css       # Layout and styling
│   └── shapes.css     # Shape-specific styles
├── js/
│   ├── canvas.js      # Canvas management (pan, zoom)
│   ├── shapes.js      # Shape library and rendering
│   ├── toolbar.js     # Left sidebar (shape palette)
│   ├── properties.js  # Right sidebar (formatting)
│   ├── state.js       # Undo/redo state management
│   ├── utils.js       # Utility functions
│   └── export.js      # PowerPoint export logic
└── lib/
    └── pptxgen.min.js # PowerPoint generation library
```

## Technologies Used

- **Fabric.js** - Canvas manipulation and object handling
- **PptxGenJS** - PowerPoint file generation
- **Vanilla JavaScript** - Lightweight and fast
- **CSS Grid/Flexbox** - Responsive layout

## Usage

### Creating Shapes

1. Click on a shape in the left sidebar to add it to the canvas center
2. Or drag a shape from the sidebar and drop it anywhere on the canvas

### Editing Shapes

1. Click a shape to select it
2. Use the handles to resize or rotate
3. Drag to reposition
4. Edit properties in the right sidebar:
   - Fill and border colors
   - Border width and style
   - Position and size
   - Opacity
   - Layer order

### Canvas Navigation

- **Pan**: Hold `Alt` and drag, or use middle mouse button
- **Zoom**: Use mouse wheel, or click Zoom +/- buttons
- **Reset**: Click "Reset" button to restore 100% zoom

### Exporting

- **PowerPoint**: Click "Export to PowerPoint" to download as .pptx
- **Save Project**: Click "Save" to download as JSON
- **Load Project**: Click "Load" to open a saved JSON file

## Roadmap

### Phase A - Core MVP ✅
- [x] Canvas foundation with pan/zoom
- [x] Shape palette and basic shapes
- [x] Shape manipulation (move, resize, rotate)
- [x] Save/Load functionality
- [x] Keyboard shortcuts

### Phase B - Advanced Features (Coming Soon)
- [ ] Properties panel enhancements
- [ ] Smart connectors/arrows between shapes
- [ ] Alignment and distribution tools
- [ ] More shape types
- [ ] Collaborative features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Author

Abhishek J (@Abhishek-J-Sudo)

## Acknowledgments

- Built with [Fabric.js](http://fabricjs.com/)
- PowerPoint export via [PptxGenJS](https://gitbrent.github.io/PptxGenJS/)
