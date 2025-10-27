// Professional connector system like diagrams.net
// Supports floating connectors, fixed connectors, waypoints, and orthogonal routing

/**
 * Connection types
 */
const CONNECTION_TYPE = {
    FLOATING: 'floating',  // Default - auto-routes to nearest perimeter point
    FIXED: 'fixed'         // Snaps to specific connection points
};

const ROUTING_STYLE = {
    STRAIGHT: 'straight',
    ORTHOGONAL: 'orthogonal',  // Right-angle paths
    CURVED: 'curved'
};

/**
 * Connector class - Professional implementation
 */
class Connector {
    constructor(fromShape, toShape, options = {}) {
        this.id = generateId();
        this.fromShape = fromShape;
        this.toShape = toShape;

        // Connection settings - ALWAYS use FIXED connection points
        this.connectionType = CONNECTION_TYPE.FIXED;
        this.routingStyle = options.routingStyle || ROUTING_STYLE.ORTHOGONAL;

        // Fixed connection points (only used if connectionType is FIXED)
        this.fromPoint = options.fromPoint || null;  // { x: 0.5, y: 0 } normalized coords
        this.toPoint = options.toPoint || null;

        // Visual properties
        this.strokeColor = options.strokeColor || '#2c3e50';
        this.strokeWidth = options.strokeWidth || 2;
        this.arrowSize = options.arrowSize || 10;

        // Waypoints for custom routing
        this.waypoints = options.waypoints || [];

        // Fabric.js objects
        this.path = null;
        this.arrow = null;
        this.waypointCircles = [];

        this.createVisuals();
        this.bindEvents();
    }

    /**
     * Create visual elements
     */
    createVisuals() {
        const pathData = this.calculatePath();

        console.log('Creating connector:', {
            fromPoint: this.fromPoint,
            toPoint: this.toPoint,
            pathData: pathData
        });

        // Create path
        this.path = new fabric.Path(pathData.pathString, {
            stroke: this.strokeColor,
            strokeWidth: this.strokeWidth,
            fill: '',
            selectable: true,
            hasControls: false,
            hasBorders: false,
            objectCaching: false,
            perPixelTargetFind: true,
            connectorId: this.id,
            isConnector: true
        });

        // Create arrow head
        this.arrow = this.createArrowHead(pathData.endPoint, pathData.endAngle);

        // Store reference
        this.path.connectorObject = this;
        this.arrow.connectorObject = this;

        canvas.add(this.path);
        canvas.add(this.arrow);

        // Send to back
        this.path.sendToBack();
        this.arrow.sendToBack();
    }

    /**
     * Calculate connection path
     */
    calculatePath() {
        // Get start and end points
        let startPoint, endPoint;

        if (this.connectionType === CONNECTION_TYPE.FLOATING) {
            // Floating - calculate optimal perimeter points
            const result = this.calculateFloatingPoints();
            startPoint = result.start;
            endPoint = result.end;
        } else {
            // Fixed - use specified connection points
            startPoint = this.getFixedConnectionPoint(this.fromShape, this.fromPoint);
            endPoint = this.getFixedConnectionPoint(this.toShape, this.toPoint);
        }

        // Generate path based on routing style
        let pathString, angle;

        switch (this.routingStyle) {
            case ROUTING_STYLE.ORTHOGONAL:
                const orthoPath = this.createOrthogonalPath(startPoint, endPoint);
                pathString = orthoPath.pathString;
                angle = orthoPath.endAngle;
                break;

            case ROUTING_STYLE.CURVED:
                const curvedPath = this.createCurvedPath(startPoint, endPoint);
                pathString = curvedPath.pathString;
                angle = curvedPath.endAngle;
                break;

            case ROUTING_STYLE.STRAIGHT:
            default:
                pathString = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
                angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) * 180 / Math.PI;
                break;
        }

        return {
            pathString,
            endPoint,
            endAngle: angle
        };
    }

    /**
     * Calculate optimal floating connection points
     */
    calculateFloatingPoints() {
        const fromBounds = this.fromShape.getBoundingRect(true);
        const toBounds = this.toShape.getBoundingRect(true);

        const fromCenter = {
            x: fromBounds.left + fromBounds.width / 2,
            y: fromBounds.top + fromBounds.height / 2
        };

        const toCenter = {
            x: toBounds.left + toBounds.width / 2,
            y: toBounds.top + toBounds.height / 2
        };

        // Find intersection with shape perimeters
        const start = this.getPerimeterPoint(this.fromShape, fromCenter, toCenter);
        const end = this.getPerimeterPoint(this.toShape, toCenter, fromCenter);

        return { start, end };
    }

    /**
     * Get point on shape perimeter in direction of target
     */
    getPerimeterPoint(shape, shapeCenter, targetPoint) {
        const bounds = shape.getBoundingRect(true);

        // Calculate angle from shape center to target
        const dx = targetPoint.x - shapeCenter.x;
        const dy = targetPoint.y - shapeCenter.y;
        const angle = Math.atan2(dy, dx);

        // Find intersection with rectangle bounds
        const halfWidth = bounds.width / 2;
        const halfHeight = bounds.height / 2;

        // Determine which edge the line intersects
        const tan = Math.tan(angle);
        let x, y;

        if (Math.abs(tan) < halfHeight / halfWidth) {
            // Intersects left or right edge
            if (dx > 0) {
                // Right edge
                x = shapeCenter.x + halfWidth;
                y = shapeCenter.y + halfWidth * tan;
            } else {
                // Left edge
                x = shapeCenter.x - halfWidth;
                y = shapeCenter.y - halfWidth * tan;
            }
        } else {
            // Intersects top or bottom edge
            if (dy > 0) {
                // Bottom edge
                y = shapeCenter.y + halfHeight;
                x = shapeCenter.x + halfHeight / tan;
            } else {
                // Top edge
                y = shapeCenter.y - halfHeight;
                x = shapeCenter.x - halfHeight / tan;
            }
        }

        return { x, y };
    }

    /**
     * Get fixed connection point on shape
     */
    getFixedConnectionPoint(shape, point) {
        const bounds = shape.getBoundingRect(true);

        if (!point) {
            // Default to center if not specified
            return {
                x: bounds.left + bounds.width / 2,
                y: bounds.top + bounds.height / 2
            };
        }

        // Normalize coordinates (0-1) to actual position
        return {
            x: bounds.left + bounds.width * point.x,
            y: bounds.top + bounds.height * point.y
        };
    }

    /**
     * Create orthogonal (right-angle) path
     */
    createOrthogonalPath(start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        // Determine connection directions based on fromPoint and toPoint
        const fromDir = this.getDirectionFromPoint(this.fromPoint);
        const toDir = this.getDirectionFromPoint(this.toPoint);

        let pathString;

        // Check if shapes are reasonably aligned - use straight line with tolerance
        const alignmentTolerance = 30; // pixels
        const isVerticallyAligned = Math.abs(dx) < alignmentTolerance;
        const isHorizontallyAligned = Math.abs(dy) < alignmentTolerance;

        // If reasonably aligned vertically, straighten to use same X coordinate
        if (isVerticallyAligned && (
            (fromDir === 'top' && toDir === 'bottom') ||
            (fromDir === 'bottom' && toDir === 'top')
        )) {
            // Use average X coordinate for perfectly straight vertical line
            const straightX = (start.x + end.x) / 2;
            pathString = `M ${start.x} ${start.y} L ${straightX} ${start.y} L ${straightX} ${end.y} L ${end.x} ${end.y}`;
        } else if (isHorizontallyAligned && (
            (fromDir === 'left' && toDir === 'right') ||
            (fromDir === 'right' && toDir === 'left')
        )) {
            // Use average Y coordinate for perfectly straight horizontal line
            const straightY = (start.y + end.y) / 2;
            pathString = `M ${start.x} ${start.y} L ${start.x} ${straightY} L ${end.x} ${straightY} L ${end.x} ${end.y}`;
        }
        // If connecting opposite sides (horizontal to horizontal or vertical to vertical)
        else if ((fromDir === 'left' || fromDir === 'right') && (toDir === 'left' || toDir === 'right')) {
            // Both horizontal - use midpoint
            const midX = start.x + dx / 2;
            pathString = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
        } else if ((fromDir === 'top' || fromDir === 'bottom') && (toDir === 'top' || toDir === 'bottom')) {
            // Both vertical - use midpoint
            const midY = start.y + dy / 2;
            pathString = `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
        } else {
            // Mixed directions - go out from start direction, then to end
            if (fromDir === 'right' || fromDir === 'left') {
                // Start horizontal, then vertical
                pathString = `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${end.y}`;
            } else {
                // Start vertical, then horizontal
                pathString = `M ${start.x} ${start.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`;
            }
        }

        // Calculate angle for arrow based on the incoming direction (toDir)
        // Arrow should point INTO the shape
        let angle = 0;
        switch (toDir) {
            case 'top':
                angle = 90; // Arrow pointing DOWN into top of shape
                break;
            case 'right':
                angle = 180; // Arrow pointing LEFT into right side of shape
                break;
            case 'bottom':
                angle = -90; // Arrow pointing UP into bottom of shape
                break;
            case 'left':
                angle = 0; // Arrow pointing RIGHT into left side of shape
                break;
        }

        return { pathString, endAngle: angle };
    }

    /**
     * Get direction from normalized point coordinates
     */
    getDirectionFromPoint(point) {
        if (!point) return 'right';

        if (point.y === 0) return 'top';
        if (point.y === 1) return 'bottom';
        if (point.x === 0) return 'left';
        if (point.x === 1) return 'right';

        return 'right';
    }

    /**
     * Create curved (Bezier) path
     */
    createCurvedPath(start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        // Control points for smooth curve
        const cp1x = start.x + dx * 0.5;
        const cp1y = start.y;
        const cp2x = start.x + dx * 0.5;
        const cp2y = end.y;

        const pathString = `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;

        // Calculate angle at end (tangent to curve)
        const angle = Math.atan2(end.y - cp2y, end.x - cp2x) * 180 / Math.PI;

        return { pathString, endAngle: angle };
    }

    /**
     * Create arrow head
     */
    createArrowHead(point, angle) {
        console.log('Creating arrow at', point, 'with angle', angle);

        const arrowPoints = [
            { x: 0, y: 0 },
            { x: -this.arrowSize, y: -this.arrowSize / 2 },
            { x: -this.arrowSize, y: this.arrowSize / 2 }
        ];

        const arrow = new fabric.Polygon(arrowPoints, {
            left: point.x,
            top: point.y,
            fill: this.strokeColor,
            stroke: this.strokeColor,
            strokeWidth: 1,
            angle: angle,
            selectable: false,
            evented: false,
            objectCaching: false,
            originX: 'center',
            originY: 'center',
            connectorId: this.id,
            isConnectorArrow: true
        });

        return arrow;
    }

    /**
     * Update connector (when shapes move)
     */
    update() {
        // Recalculate best connection points based on current positions
        this.updateConnectionPoints();

        const pathData = this.calculatePath();

        // Update path
        this.path.set({ path: fabric.util.parsePath(pathData.pathString) });
        this.path.setCoords();

        // Update arrow
        this.arrow.set({
            left: pathData.endPoint.x,
            top: pathData.endPoint.y,
            angle: pathData.endAngle
        });
        this.arrow.setCoords();
    }

    /**
     * Update connection points based on current shape positions
     */
    updateConnectionPoints() {
        // Only update if connection type is FIXED
        if (this.connectionType !== CONNECTION_TYPE.FIXED) {
            return;
        }

        const fromBounds = this.fromShape.getBoundingRect(true);
        const toBounds = this.toShape.getBoundingRect(true);

        const fromCenter = {
            x: fromBounds.left + fromBounds.width / 2,
            y: fromBounds.top + fromBounds.height / 2
        };

        const toCenter = {
            x: toBounds.left + toBounds.width / 2,
            y: toBounds.top + toBounds.height / 2
        };

        // Calculate best FROM connection point
        const fromDir = this.calculateBestDirection(fromCenter, toCenter);
        this.fromPoint = this.directionToPoint(fromDir);

        // Calculate best TO connection point
        const toDir = this.calculateBestDirection(toCenter, fromCenter);
        this.toPoint = this.directionToPoint(toDir);
    }

    /**
     * Calculate best direction from one center to another
     */
    calculateBestDirection(fromCenter, toCenter) {
        const dx = toCenter.x - fromCenter.x;
        const dy = toCenter.y - fromCenter.y;

        // Determine which direction based on angle
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'bottom' : 'top';
        }
    }

    /**
     * Convert direction to normalized point
     */
    directionToPoint(direction) {
        const pointMap = {
            'top': { x: 0.5, y: 0 },
            'right': { x: 1, y: 0.5 },
            'bottom': { x: 0.5, y: 1 },
            'left': { x: 0, y: 0.5 }
        };
        return pointMap[direction] || pointMap['right'];
    }

    /**
     * Bind to shape events
     */
    bindEvents() {
        const updateHandler = () => this.update();

        // Store handlers
        this.fromShape._connectorUpdateHandlers = this.fromShape._connectorUpdateHandlers || [];
        this.toShape._connectorUpdateHandlers = this.toShape._connectorUpdateHandlers || [];

        this.fromShape._connectorUpdateHandlers.push(updateHandler);
        this.toShape._connectorUpdateHandlers.push(updateHandler);

        // Bind events
        this.fromShape.on('moving', updateHandler);
        this.fromShape.on('scaling', updateHandler);
        this.fromShape.on('rotating', updateHandler);
        this.fromShape.on('modified', updateHandler);

        this.toShape.on('moving', updateHandler);
        this.toShape.on('scaling', updateHandler);
        this.toShape.on('rotating', updateHandler);
        this.toShape.on('modified', updateHandler);
    }

    /**
     * Remove connector
     */
    remove() {
        canvas.remove(this.path);
        canvas.remove(this.arrow);

        // Cleanup waypoint circles
        this.waypointCircles.forEach(circle => canvas.remove(circle));

        // Unbind events
        const events = ['moving', 'scaling', 'rotating', 'modified'];
        events.forEach(event => {
            this.fromShape.off(event);
            this.toShape.off(event);
        });
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            id: this.id,
            fromShapeId: this.fromShape.id,
            toShapeId: this.toShape.id,
            connectionType: this.connectionType,
            routingStyle: this.routingStyle,
            fromPoint: this.fromPoint,
            toPoint: this.toPoint,
            waypoints: this.waypoints,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            arrowSize: this.arrowSize
        };
    }
}

/**
 * Connector Manager
 */
class ConnectorManager {
    constructor() {
        this.connectors = new Map();
        this.isConnectorMode = false;
        this.connectionHandles = [];
    }

    /**
     * Get fixed connection point from direction (top/right/bottom/left)
     */
    getFixedPointFromDirection(direction, shape, otherShape) {
        // Map of directions to normalized coordinates (0-1)
        const pointMap = {
            'top': { x: 0.5, y: 0 },      // Center-top
            'right': { x: 1, y: 0.5 },    // Center-right
            'bottom': { x: 0.5, y: 1 },   // Center-bottom
            'left': { x: 0, y: 0.5 }      // Center-left
        };

        // If auto, determine best direction based on which side is nearest
        if (direction === 'auto') {
            const shapeBounds = shape.getBoundingRect(true);
            const otherBounds = otherShape.getBoundingRect(true);

            // Get all 4 connection points on this shape
            const connectionPoints = {
                top: {
                    x: shapeBounds.left + shapeBounds.width * 0.5,
                    y: shapeBounds.top
                },
                right: {
                    x: shapeBounds.left + shapeBounds.width,
                    y: shapeBounds.top + shapeBounds.height * 0.5
                },
                bottom: {
                    x: shapeBounds.left + shapeBounds.width * 0.5,
                    y: shapeBounds.top + shapeBounds.height
                },
                left: {
                    x: shapeBounds.left,
                    y: shapeBounds.top + shapeBounds.height * 0.5
                }
            };

            // Get center of other shape
            const otherCenter = {
                x: otherBounds.left + otherBounds.width / 2,
                y: otherBounds.top + otherBounds.height / 2
            };

            // Find which connection point is closest to other shape's center
            let minDistance = Infinity;
            let bestDirection = 'right';

            for (let dir in connectionPoints) {
                const point = connectionPoints[dir];
                const distance = Math.sqrt(
                    Math.pow(point.x - otherCenter.x, 2) +
                    Math.pow(point.y - otherCenter.y, 2)
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    bestDirection = dir;
                }
            }

            direction = bestDirection;
            console.log('Auto-selected direction for', shape.id, ':', direction);
        }

        return pointMap[direction] || pointMap['right'];
    }

    /**
     * Create connector
     */
    createConnector(fromShape, toShape, options = {}) {
        if (!fromShape || !toShape || fromShape === toShape) {
            return null;
        }

        // Ensure we have fixed connection points defined
        if (!options.fromPoint) {
            options.fromPoint = this.getFixedPointFromDirection(options.fromDirection || 'auto', fromShape, toShape);
        }
        if (!options.toPoint) {
            options.toPoint = this.getFixedPointFromDirection(options.toDirection || 'auto', toShape, fromShape);
        }

        const connector = new Connector(fromShape, toShape, options);
        this.connectors.set(connector.id, connector);

        // Store references on shapes
        fromShape._outgoingConnectors = fromShape._outgoingConnectors || [];
        toShape._incomingConnectors = toShape._incomingConnectors || [];
        fromShape._outgoingConnectors.push(connector);
        toShape._incomingConnectors.push(connector);

        canvas.requestRenderAll();
        return connector;
    }

    /**
     * Remove connector
     */
    removeConnector(connectorId) {
        const connector = this.connectors.get(connectorId);
        if (!connector) return;

        // Remove from shapes
        if (connector.fromShape._outgoingConnectors) {
            connector.fromShape._outgoingConnectors =
                connector.fromShape._outgoingConnectors.filter(c => c.id !== connectorId);
        }

        if (connector.toShape._incomingConnectors) {
            connector.toShape._incomingConnectors =
                connector.toShape._incomingConnectors.filter(c => c.id !== connectorId);
        }

        connector.remove();
        this.connectors.delete(connectorId);
        canvas.requestRenderAll();
    }

    /**
     * Remove all connectors for a shape
     */
    removeConnectorsForShape(shape) {
        const toRemove = [];

        this.connectors.forEach(connector => {
            if (connector.fromShape === shape || connector.toShape === shape) {
                toRemove.push(connector.id);
            }
        });

        toRemove.forEach(id => this.removeConnector(id));
    }

    /**
     * Show connection handles on shape (like diagrams.net)
     */
    showConnectionHandles(shape) {
        this.hideConnectionHandles();

        const bounds = shape.getBoundingRect(true);
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;

        // Create directional arrows (like diagrams.net)
        const offset = 15; // Distance from shape edge

        const handles = [
            // Top arrow
            {
                x: centerX,
                y: bounds.top - offset,
                icon: '↑',
                direction: 'top'
            },
            // Right arrow
            {
                x: bounds.left + bounds.width + offset,
                y: centerY,
                icon: '→',
                direction: 'right'
            },
            // Bottom arrow
            {
                x: centerX,
                y: bounds.top + bounds.height + offset,
                icon: '↓',
                direction: 'bottom'
            },
            // Left arrow
            {
                x: bounds.left - offset,
                y: centerY,
                icon: '←',
                direction: 'left'
            }
        ];

        handles.forEach(handleData => {
            const handle = new fabric.Text(handleData.icon, {
                left: handleData.x,
                top: handleData.y,
                fontSize: 20,
                fill: '#3498db',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: 5,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: true,
                hasControls: false,
                hasBorders: false,
                hoverCursor: 'pointer',
                isConnectionHandle: true,
                parentShape: shape,
                direction: handleData.direction
            });

            // Drag to create connector
            handle.on('mousedown', (e) => {
                this.startConnectorDrag(shape, handle, e);
            });

            canvas.add(handle);
            this.connectionHandles.push(handle);
        });

        canvas.requestRenderAll();
    }

    /**
     * Hide connection handles
     */
    hideConnectionHandles() {
        this.connectionHandles.forEach(handle => canvas.remove(handle));
        this.connectionHandles = [];
        canvas.requestRenderAll();
    }

    /**
     * Snap shapes to alignment if within tolerance
     */
    snapShapesToAlign(fromShape, toShape, fromDirection, toDirection) {
        const alignmentTolerance = 30; // pixels

        const fromBounds = fromShape.getBoundingRect(true);
        const toBounds = toShape.getBoundingRect(true);

        // Get connection point positions
        const fromPoint = {
            x: fromBounds.left + fromBounds.width * (fromDirection === 'left' ? 0 : fromDirection === 'right' ? 1 : 0.5),
            y: fromBounds.top + fromBounds.height * (fromDirection === 'top' ? 0 : fromDirection === 'bottom' ? 1 : 0.5)
        };

        const toPoint = {
            x: toBounds.left + toBounds.width * (toDirection === 'left' ? 0 : toDirection === 'right' ? 1 : 0.5),
            y: toBounds.top + toBounds.height * (toDirection === 'top' ? 0 : toDirection === 'bottom' ? 1 : 0.5)
        };

        // Check if connecting vertically (top-bottom or bottom-top)
        if ((fromDirection === 'top' || fromDirection === 'bottom') &&
            (toDirection === 'top' || toDirection === 'bottom')) {

            const dx = Math.abs(fromPoint.x - toPoint.x);

            if (dx < alignmentTolerance) {
                // Snap toShape horizontally to align with fromShape
                const offsetX = fromPoint.x - toPoint.x;
                toShape.set({
                    left: toShape.left + offsetX
                });
                toShape.setCoords();
                console.log('Snapped shapes vertically aligned');
            }
        }
        // Check if connecting horizontally (left-right or right-left)
        else if ((fromDirection === 'left' || fromDirection === 'right') &&
                 (toDirection === 'left' || toDirection === 'right')) {

            const dy = Math.abs(fromPoint.y - toPoint.y);

            if (dy < alignmentTolerance) {
                // Snap toShape vertically to align with fromShape
                const offsetY = fromPoint.y - toPoint.y;
                toShape.set({
                    top: toShape.top + offsetY
                });
                toShape.setCoords();
                console.log('Snapped shapes horizontally aligned');
            }
        }

        canvas.requestRenderAll();
    }

    /**
     * Find nearest connection point to mouse pointer
     */
    findNearestConnectionPoint(pointer, shape) {
        const bounds = shape.getBoundingRect(true);

        const connectionPoints = {
            top: {
                x: bounds.left + bounds.width / 2,
                y: bounds.top
            },
            right: {
                x: bounds.left + bounds.width,
                y: bounds.top + bounds.height / 2
            },
            bottom: {
                x: bounds.left + bounds.width / 2,
                y: bounds.top + bounds.height
            },
            left: {
                x: bounds.left,
                y: bounds.top + bounds.height / 2
            }
        };

        let minDistance = Infinity;
        let nearestDirection = 'top';

        for (let dir in connectionPoints) {
            const point = connectionPoints[dir];
            const distance = Math.sqrt(
                Math.pow(pointer.x - point.x, 2) +
                Math.pow(pointer.y - point.y, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestDirection = dir;
            }
        }

        return nearestDirection;
    }

    /**
     * Start connector drag
     */
    startConnectorDrag(fromShape, handle, event) {
        console.log('Starting connector drag from', fromShape.id);

        // Prevent shape selection during connector drag
        event.e.preventDefault();
        event.e.stopPropagation();
        canvas.selection = false;
        canvas.discardActiveObject();

        // Create temporary line to show during drag
        const startPos = handle.getCenterPoint();

        const tempLine = new fabric.Line([startPos.x, startPos.y, startPos.x, startPos.y], {
            stroke: '#3498db',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            isTempConnector: true
        });

        canvas.add(tempLine);

        // Track mouse movement
        const moveHandler = (e) => {
            const pointer = canvas.getPointer(e.e);
            tempLine.set({ x2: pointer.x, y2: pointer.y });

            // Show connection handles on shape being hovered over
            const target = canvas.findTarget(e.e, false);
            if (target && target.id && target !== fromShape && !target.isConnectionHandle) {
                this.showConnectionHandles(target);
            }

            canvas.requestRenderAll();
        };

        const upHandler = (e) => {
            canvas.remove(tempLine);
            canvas.off('mouse:move', moveHandler);
            canvas.off('mouse:up', upHandler);

            // Re-enable selection
            canvas.selection = true;

            // Check what was released on
            const pointer = canvas.getPointer(e.e);
            const target = canvas.findTarget(e.e, false);

            let toDirection = 'auto';
            let toShape = null;

            // Check if released on a connection handle
            if (target && target.isConnectionHandle) {
                toShape = target.parentShape;
                toDirection = target.direction;
                console.log('Released on connection handle:', toDirection);
            }
            // Check if released on a shape directly
            else if (target && target.id && target !== fromShape) {
                toShape = target;
                // Find nearest connection handle
                toDirection = this.findNearestConnectionPoint(pointer, toShape);
                console.log('Released on shape, nearest point:', toDirection);
            }

            if (toShape) {
                console.log('Creating connector:', {
                    from: fromShape.id,
                    to: toShape.id,
                    fromDirection: handle.direction,
                    toDirection: toDirection
                });

                // Auto-snap shapes to alignment if within tolerance
                this.snapShapesToAlign(fromShape, toShape, handle.direction, toDirection);

                // Create connector with explicit directions
                const connector = this.createConnector(fromShape, toShape, {
                    fromDirection: handle.direction,
                    toDirection: toDirection
                });

                console.log('Connector created:', connector);
            } else {
                console.log('No valid target found');
            }

            this.hideConnectionHandles();
            canvas.requestRenderAll();
        };

        canvas.on('mouse:move', moveHandler);
        canvas.on('mouse:up', upHandler);
    }

    /**
     * Update all connectors
     */
    updateAll() {
        this.connectors.forEach(connector => connector.update());
        canvas.requestRenderAll();
    }

    /**
     * Clear all
     */
    clearAll() {
        this.connectors.forEach(connector => connector.remove());
        this.connectors.clear();
        canvas.requestRenderAll();
    }

    /**
     * Serialize
     */
    toJSON() {
        const data = [];
        this.connectors.forEach(connector => data.push(connector.toJSON()));
        return data;
    }

    /**
     * Load from JSON
     */
    fromJSON(data, shapes) {
        this.clearAll();

        const shapeMap = new Map();
        shapes.forEach(shape => {
            if (shape.id) shapeMap.set(shape.id, shape);
        });

        data.forEach(connectorData => {
            const fromShape = shapeMap.get(connectorData.fromShapeId);
            const toShape = shapeMap.get(connectorData.toShapeId);

            if (fromShape && toShape) {
                this.createConnector(fromShape, toShape, {
                    connectionType: connectorData.connectionType,
                    routingStyle: connectorData.routingStyle,
                    fromPoint: connectorData.fromPoint,
                    toPoint: connectorData.toPoint,
                    waypoints: connectorData.waypoints,
                    strokeColor: connectorData.strokeColor,
                    strokeWidth: connectorData.strokeWidth,
                    arrowSize: connectorData.arrowSize
                });
            }
        });
    }
}

// Global instance
let connectorManager = null;

function initConnectorSystem() {
    connectorManager = new ConnectorManager();
    return connectorManager;
}

function getConnectorManager() {
    if (!connectorManager) {
        connectorManager = initConnectorSystem();
    }
    return connectorManager;
}
