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

        // Store the chosen route to keep it stable when shapes move
        this.lockedRoute = options.lockedRoute || null;

        // Text label
        this.text = options.text || '';
        this._textObject = null;

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
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            objectCaching: false,
            perPixelTargetFind: true,
            connectorId: this.id,
            isConnector: true,
            hoverCursor: 'pointer',
            evented: true, // Can receive mouse events
            // Store original colors for hover/selection effects
            _originalStroke: this.strokeColor,
            _originalStrokeWidth: this.strokeWidth
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
     * Check if a line segment intersects with any shapes (except connected ones)
     */
    doesLineIntersectShapes(x1, y1, x2, y2) {
        const allObjects = canvas.getObjects();
        const MARGIN = 10; // Add 10px margin around shapes

        for (let obj of allObjects) {
            // Skip connectors, connection handles, temp connectors, connector arrows, and the shapes we're connected to
            if (obj.isConnector || obj.isConnectionHandle || obj.isTempConnector || obj.isConnectorArrow ||
                obj === this.fromShape || obj === this.toShape) {
                continue;
            }

            // Only check actual shapes (objects with an id property)
            if (!obj.id) {
                continue;
            }

            const bounds = obj.getBoundingRect(true);

            // Expand bounds by margin
            const left = bounds.left - MARGIN;
            const right = bounds.left + bounds.width + MARGIN;
            const top = bounds.top - MARGIN;
            const bottom = bounds.top + bounds.height + MARGIN;

            // Check if line segment intersects with expanded rectangle
            if (this.lineIntersectsRect(x1, y1, x2, y2, left, top, right, bottom)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if line segment intersects with rectangle
     */
    lineIntersectsRect(x1, y1, x2, y2, rectLeft, rectTop, rectRight, rectBottom) {
        // Check if either endpoint is inside rectangle
        if ((x1 >= rectLeft && x1 <= rectRight && y1 >= rectTop && y1 <= rectBottom) ||
            (x2 >= rectLeft && x2 <= rectRight && y2 >= rectTop && y2 <= rectBottom)) {
            return true;
        }

        // Check if line intersects any of the 4 rectangle edges
        return this.lineSegmentsIntersect(x1, y1, x2, y2, rectLeft, rectTop, rectRight, rectTop) ||    // Top edge
               this.lineSegmentsIntersect(x1, y1, x2, y2, rectRight, rectTop, rectRight, rectBottom) || // Right edge
               this.lineSegmentsIntersect(x1, y1, x2, y2, rectLeft, rectBottom, rectRight, rectBottom) || // Bottom edge
               this.lineSegmentsIntersect(x1, y1, x2, y2, rectLeft, rectTop, rectLeft, rectBottom);    // Left edge
    }

    /**
     * Check if two line segments intersect
     */
    lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 0.0001) return false; // Parallel lines

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    /**
     * Route path around obstacles if needed
     */
    routeAroundObstacles(start, end, fromDir, toDir, defaultPath) {
        // Parse the default path to get line segments
        const segments = this.parsePathSegments(defaultPath);

        // Check each segment for collisions
        let hasCollision = false;
        for (let i = 0; i < segments.length - 1; i++) {
            const seg = segments[i];
            const nextSeg = segments[i + 1];
            if (this.doesLineIntersectShapes(seg.x, seg.y, nextSeg.x, nextSeg.y)) {
                hasCollision = true;
                console.log('Collision detected!', {seg, nextSeg});
                break;
            }
        }

        console.log('routeAroundObstacles:', {hasCollision, segments, defaultPath});

        // If no collision, return default path
        if (!hasCollision) {
            return defaultPath;
        }

        // Try alternative routing with extended segments
        const OFFSET = 50; // Offset distance to go around obstacles

        // Try routing around by extending outward from source
        let altPath;
        if (fromDir === 'top' || fromDir === 'bottom') {
            // Vertical start - try going further up/down then around
            const offsetY = fromDir === 'top' ? -OFFSET : OFFSET;
            altPath = `M ${start.x} ${start.y} L ${start.x} ${start.y + offsetY} L ${end.x} ${start.y + offsetY} L ${end.x} ${end.y}`;

            if (!this.pathHasCollisions(altPath)) return altPath;

            // Try the other side
            const altPath2 = `M ${start.x} ${start.y} L ${start.x} ${end.y - offsetY} L ${end.x} ${end.y - offsetY} L ${end.x} ${end.y}`;
            if (!this.pathHasCollisions(altPath2)) return altPath2;
        } else {
            // Horizontal start - try going further left/right then around
            const offsetX = fromDir === 'left' ? -OFFSET : OFFSET;
            altPath = `M ${start.x} ${start.y} L ${start.x + offsetX} ${start.y} L ${start.x + offsetX} ${end.y} L ${end.x} ${end.y}`;

            if (!this.pathHasCollisions(altPath)) return altPath;

            // Try the other side
            const altPath2 = `M ${start.x} ${start.y} L ${end.x - offsetX} ${start.y} L ${end.x - offsetX} ${end.y} L ${end.x} ${end.y}`;
            if (!this.pathHasCollisions(altPath2)) return altPath2;
        }

        // If all alternatives have collisions, return default path (user needs to rearrange shapes)
        return defaultPath;
    }

    /**
     * Parse SVG path string to get line segment coordinates
     */
    parsePathSegments(pathString) {
        const segments = [];
        const commands = pathString.match(/[ML]\s*[\d.-]+\s+[\d.-]+/g);

        if (commands) {
            for (let cmd of commands) {
                const coords = cmd.match(/[\d.-]+/g);
                if (coords && coords.length >= 2) {
                    segments.push({
                        x: parseFloat(coords[0]),
                        y: parseFloat(coords[1])
                    });
                }
            }
        }

        return segments;
    }

    /**
     * Check if entire path has collisions
     */
    pathHasCollisions(pathString) {
        const segments = this.parsePathSegments(pathString);

        for (let i = 0; i < segments.length - 1; i++) {
            const seg = segments[i];
            const nextSeg = segments[i + 1];
            if (this.doesLineIntersectShapes(seg.x, seg.y, nextSeg.x, nextSeg.y)) {
                return true;
            }
        }

        return false;
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

        // Extract base directions (remove -left, -right, -top, -bottom suffixes)
        const fromBaseDir = this.getBaseDirection(fromDir);
        const toBaseDir = this.getBaseDirection(toDir);

        let pathString;

        // Check if shapes are reasonably aligned - use straight line with tolerance
        const alignmentTolerance = 30; // pixels
        const isVerticallyAligned = Math.abs(dx) < alignmentTolerance;
        const isHorizontallyAligned = Math.abs(dy) < alignmentTolerance;

        // If reasonably aligned vertically, straighten to use same X coordinate
        if (isVerticallyAligned && (
            (fromBaseDir === 'top' && toBaseDir === 'bottom') ||
            (fromBaseDir === 'bottom' && toBaseDir === 'top')
        )) {
            // Use average X coordinate for perfectly straight vertical line
            const straightX = (start.x + end.x) / 2;
            pathString = this.routeAroundObstacles(start, end, fromBaseDir, toBaseDir,
                `M ${start.x} ${start.y} L ${straightX} ${start.y} L ${straightX} ${end.y} L ${end.x} ${end.y}`);
        } else if (isHorizontallyAligned && (
            (fromBaseDir === 'left' && toBaseDir === 'right') ||
            (fromBaseDir === 'right' && toBaseDir === 'left')
        )) {
            // Use average Y coordinate for perfectly straight horizontal line
            const straightY = (start.y + end.y) / 2;
            pathString = this.routeAroundObstacles(start, end, fromBaseDir, toBaseDir,
                `M ${start.x} ${start.y} L ${start.x} ${straightY} L ${end.x} ${straightY} L ${end.x} ${end.y}`);
        }
        // If connecting opposite sides (horizontal to horizontal or vertical to vertical)
        else if ((fromBaseDir === 'left' || fromBaseDir === 'right') && (toBaseDir === 'left' || toBaseDir === 'right')) {
            // Both horizontal - use midpoint
            const midX = start.x + dx / 2;
            pathString = this.routeAroundObstacles(start, end, fromBaseDir, toBaseDir,
                `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`);
        } else if ((fromBaseDir === 'top' || fromBaseDir === 'bottom') && (toBaseDir === 'top' || toBaseDir === 'bottom')) {
            // Both vertical - use midpoint
            const midY = start.y + dy / 2;
            pathString = this.routeAroundObstacles(start, end, fromBaseDir, toBaseDir,
                `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`);
        } else {
            // Mixed directions - go out from start direction, then to end
            if (fromBaseDir === 'right' || fromBaseDir === 'left') {
                // Start horizontal, then vertical
                pathString = this.routeAroundObstacles(start, end, fromBaseDir, toBaseDir,
                    `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${end.y}`);
            } else {
                // Start vertical, then horizontal
                pathString = this.routeAroundObstacles(start, end, fromBaseDir, toBaseDir,
                    `M ${start.x} ${start.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`);
            }
        }

        // Calculate angle for arrow based on the incoming direction (toDir)
        // Arrow should point INTO the shape
        let angle = 0;
        switch (toBaseDir) {
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
     * Get base direction from direction name (strips -left, -right, -top, -bottom)
     */
    getBaseDirection(direction) {
        if (direction.startsWith('top')) return 'top';
        if (direction.startsWith('bottom')) return 'bottom';
        if (direction.startsWith('left')) return 'left';
        if (direction.startsWith('right')) return 'right';
        return direction;
    }

    /**
     * Get direction from normalized point coordinates
     * Now handles multiple connection points per side
     */
    getDirectionFromPoint(point) {
        if (!point) return 'right';

        // Top side (y = 0)
        if (point.y === 0) {
            if (point.x === 0.25) return 'top-left';
            if (point.x === 0.75) return 'top-right';
            return 'top';
        }

        // Bottom side (y = 1)
        if (point.y === 1) {
            if (point.x === 0.25) return 'bottom-left';
            if (point.x === 0.75) return 'bottom-right';
            return 'bottom';
        }

        // Left side (x = 0)
        if (point.x === 0) {
            if (point.y === 0.25) return 'left-top';
            if (point.y === 0.75) return 'left-bottom';
            return 'left';
        }

        // Right side (x = 1)
        if (point.x === 1) {
            if (point.y === 0.25) return 'right-top';
            if (point.y === 0.75) return 'right-bottom';
            return 'right';
        }

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
            selectable: true,
            evented: true,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            objectCaching: false,
            originX: 'center',
            originY: 'center',
            connectorId: this.id,
            isConnectorArrow: true,
            hasControls: false,
            hasBorders: false,
            hoverCursor: 'pointer',
            // Store original colors
            _originalFill: this.strokeColor,
            _originalStroke: this.strokeColor
        });

        return arrow;
    }

    /**
     * Update connector (when shapes move)
     */
    update() {
        // DISABLED: Dynamic connection point switching
        // Connection points now stay fixed where user placed them
        // this.updateConnectionPoints();

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

        // Update text position if text exists
        if (this._textObject) {
            const midpoint = this.getPathMidpoint();
            this._textObject.set({
                left: midpoint.x,
                top: midpoint.y
            });
            this._textObject.setCoords();
        }
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
     * Highlight connector (when selected or hovered)
     */
    highlight(isSelection = false) {
        if (isSelection) {
            // Selection highlight - more prominent
            this.path.set({
                stroke: '#3498db',
                strokeWidth: this.strokeWidth + 2
            });
            this.arrow.set({
                fill: '#3498db',
                stroke: '#3498db'
            });
        } else {
            // Hover highlight - subtle
            this.path.set({
                stroke: '#3498db',
                strokeWidth: this.strokeWidth + 1
            });
            this.arrow.set({
                fill: '#3498db',
                stroke: '#3498db'
            });
        }
        canvas.requestRenderAll();
    }

    /**
     * Remove highlight (restore original colors)
     */
    unhighlight() {
        this.path.set({
            stroke: this.path._originalStroke || this.strokeColor,
            strokeWidth: this.path._originalStrokeWidth || this.strokeWidth
        });
        this.arrow.set({
            fill: this.arrow._originalFill || this.strokeColor,
            stroke: this.arrow._originalStroke || this.strokeColor
        });
        canvas.requestRenderAll();
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

        // Add hover effects
        this.path.on('mouseover', () => {
            if (!canvas.getActiveObject() || canvas.getActiveObject() !== this.path) {
                this.highlight(false);
            }
        });

        this.path.on('mouseout', () => {
            if (!canvas.getActiveObject() || canvas.getActiveObject() !== this.path) {
                this.unhighlight();
            }
        });

        this.arrow.on('mouseover', () => {
            if (!canvas.getActiveObject() || (canvas.getActiveObject() !== this.path && canvas.getActiveObject() !== this.arrow)) {
                this.highlight(false);
            }
        });

        this.arrow.on('mouseout', () => {
            if (!canvas.getActiveObject() || (canvas.getActiveObject() !== this.path && canvas.getActiveObject() !== this.arrow)) {
                this.unhighlight();
            }
        });
    }

    /**
     * Remove connector
     */
    remove() {
        canvas.remove(this.path);
        canvas.remove(this.arrow);

        // Cleanup waypoint circles
        this.waypointCircles.forEach(circle => canvas.remove(circle));

        // Remove text object if it exists
        if (this._textObject) {
            canvas.remove(this._textObject);
            this._textObject = null;
        }

        // Unbind events
        const events = ['moving', 'scaling', 'rotating', 'modified'];
        events.forEach(event => {
            this.fromShape.off(event);
            this.toShape.off(event);
        });
    }

    /**
     * Get midpoint of the connector path for text placement
     */
    getPathMidpoint() {
        if (!this.path) {
            return { x: 0, y: 0 };
        }

        // Get the path data
        const pathData = this.path.path;

        if (!pathData || pathData.length === 0) {
            return { x: 0, y: 0 };
        }

        // Calculate total path length and find middle
        let totalLength = 0;
        const segments = [];

        for (let i = 1; i < pathData.length; i++) {
            const prev = pathData[i - 1];
            const curr = pathData[i];

            // Get coordinates (handle both M and L commands)
            const x1 = prev[prev.length - 2];
            const y1 = prev[prev.length - 1];
            const x2 = curr[curr.length - 2];
            const y2 = curr[curr.length - 1];

            const segmentLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            segments.push({
                x1, y1, x2, y2,
                length: segmentLength,
                cumulativeLength: totalLength + segmentLength
            });
            totalLength += segmentLength;
        }

        // Find segment containing the midpoint
        const halfLength = totalLength / 2;
        let midpoint = { x: 0, y: 0 };

        for (const segment of segments) {
            if (segment.cumulativeLength >= halfLength) {
                // Interpolate within this segment
                const segmentStart = segment.cumulativeLength - segment.length;
                const t = (halfLength - segmentStart) / segment.length;

                midpoint = {
                    x: segment.x1 + (segment.x2 - segment.x1) * t,
                    y: segment.y1 + (segment.y2 - segment.y1) * t
                };
                break;
            }
        }

        return midpoint;
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
            arrowSize: this.arrowSize,
            lockedRoute: this.lockedRoute,
            text: this.text || '' // Include text in serialization
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
     * Now supports multiple positions: top-left, top-center, top-right, etc.
     */
    getFixedPointFromDirection(direction, shape, otherShape) {
        // Map of directions to normalized coordinates (0-1)
        // Each side now has 3 connection points
        const pointMap = {
            'top-left': { x: 0.25, y: 0 },
            'top': { x: 0.5, y: 0 },
            'top-right': { x: 0.75, y: 0 },

            'right-top': { x: 1, y: 0.25 },
            'right': { x: 1, y: 0.5 },
            'right-bottom': { x: 1, y: 0.75 },

            'bottom-left': { x: 0.25, y: 1 },
            'bottom': { x: 0.5, y: 1 },
            'bottom-right': { x: 0.75, y: 1 },

            'left-top': { x: 0, y: 0.25 },
            'left': { x: 0, y: 0.5 },
            'left-bottom': { x: 0, y: 0.75 }
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
     * Now shows 3 connection points per side
     */
    showConnectionHandles(shape) {
        this.hideConnectionHandles();

        const bounds = shape.getBoundingRect(true);
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;

        // Create directional arrows (like diagrams.net)
        const offset = 15; // Distance from shape edge

        // For diamonds, adjust handle positions to match actual diamond edges
        let handles;
        if (shape.shapeType === 'diamond') {
            // Diamond has 4 vertices, show handles at actual vertices
            handles = [
                // Top vertex
                {
                    x: centerX,
                    y: bounds.top - offset,
                    icon: '•',
                    direction: 'top'
                },
                // Right vertex
                {
                    x: bounds.left + bounds.width + offset,
                    y: centerY,
                    icon: '•',
                    direction: 'right'
                },
                // Bottom vertex
                {
                    x: centerX,
                    y: bounds.top + bounds.height + offset,
                    icon: '•',
                    direction: 'bottom'
                },
                // Left vertex
                {
                    x: bounds.left - offset,
                    y: centerY,
                    icon: '•',
                    direction: 'left'
                }
            ];
        } else {
            // Regular shapes get 3 connection points per side
            handles = [
                // Top (3 points)
                {
                    x: bounds.left + bounds.width * 0.25,
                    y: bounds.top - offset,
                    icon: '•',
                    direction: 'top-left'
                },
                {
                    x: centerX,
                    y: bounds.top - offset,
                    icon: '•',
                    direction: 'top'
                },
                {
                    x: bounds.left + bounds.width * 0.75,
                    y: bounds.top - offset,
                    icon: '•',
                    direction: 'top-right'
                },

                // Right (3 points)
                {
                    x: bounds.left + bounds.width + offset,
                    y: bounds.top + bounds.height * 0.25,
                    icon: '•',
                    direction: 'right-top'
                },
                {
                    x: bounds.left + bounds.width + offset,
                    y: centerY,
                    icon: '•',
                    direction: 'right'
                },
                {
                    x: bounds.left + bounds.width + offset,
                    y: bounds.top + bounds.height * 0.75,
                    icon: '•',
                    direction: 'right-bottom'
                },

                // Bottom (3 points)
                {
                    x: bounds.left + bounds.width * 0.25,
                    y: bounds.top + bounds.height + offset,
                    icon: '•',
                    direction: 'bottom-left'
                },
                {
                    x: centerX,
                    y: bounds.top + bounds.height + offset,
                    icon: '•',
                    direction: 'bottom'
                },
                {
                    x: bounds.left + bounds.width * 0.75,
                    y: bounds.top + bounds.height + offset,
                    icon: '•',
                    direction: 'bottom-right'
                },

                // Left (3 points)
                {
                    x: bounds.left - offset,
                    y: bounds.top + bounds.height * 0.25,
                    icon: '•',
                    direction: 'left-top'
                },
                {
                    x: bounds.left - offset,
                    y: centerY,
                    icon: '•',
                    direction: 'left'
                },
                {
                    x: bounds.left - offset,
                    y: bounds.top + bounds.height * 0.75,
                    icon: '•',
                    direction: 'left-bottom'
                }
            ];
        }

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
     * Get base direction from direction name (strips -left, -right, -top, -bottom)
     */
    getBaseDirection(direction) {
        if (!direction) return 'right';
        if (direction.startsWith('top')) return 'top';
        if (direction.startsWith('bottom')) return 'bottom';
        if (direction.startsWith('left')) return 'left';
        if (direction.startsWith('right')) return 'right';
        return direction;
    }

    /**
     * Simplified obstacle routing for preview (uses same logic as Connector class)
     */
    routeAroundObstaclesForPreview(start, end, fromDir, toDir, defaultPath, fromShape, toShape) {
        // Parse default path to check for collisions
        const segments = this.parsePathSegmentsSimple(defaultPath);

        // Check each segment for collisions with shapes
        let hasCollision = false;
        for (let i = 0; i < segments.length - 1; i++) {
            const seg = segments[i];
            const nextSeg = segments[i + 1];
            if (this.doesLineIntersectShapesSimple(seg.x, seg.y, nextSeg.x, nextSeg.y, fromShape, toShape)) {
                hasCollision = true;
                break;
            }
        }

        // If no collision, return default path
        if (!hasCollision) {
            return defaultPath;
        }

        // Try alternative routing with extended segments
        const OFFSET = 50;
        let altPath;

        if (fromDir === 'top' || fromDir === 'bottom') {
            // Vertical start - try going further up/down then around
            const offsetY = fromDir === 'top' ? -OFFSET : OFFSET;
            altPath = `M ${start.x} ${start.y} L ${start.x} ${start.y + offsetY} L ${end.x} ${start.y + offsetY} L ${end.x} ${end.y}`;

            if (!this.pathHasCollisionsSimple(altPath, fromShape, toShape)) return altPath;

            // Try the other side
            const altPath2 = `M ${start.x} ${start.y} L ${start.x} ${end.y - offsetY} L ${end.x} ${end.y - offsetY} L ${end.x} ${end.y}`;
            if (!this.pathHasCollisionsSimple(altPath2, fromShape, toShape)) return altPath2;
        } else {
            // Horizontal start - try going further left/right then around
            const offsetX = fromDir === 'left' ? -OFFSET : OFFSET;
            altPath = `M ${start.x} ${start.y} L ${start.x + offsetX} ${start.y} L ${start.x + offsetX} ${end.y} L ${end.x} ${end.y}`;

            if (!this.pathHasCollisionsSimple(altPath, fromShape, toShape)) return altPath;

            // Try the other side
            const altPath2 = `M ${start.x} ${start.y} L ${end.x - offsetX} ${start.y} L ${end.x - offsetX} ${end.y} L ${end.x} ${end.y}`;
            if (!this.pathHasCollisionsSimple(altPath2, fromShape, toShape)) return altPath2;
        }

        // If all alternatives have collisions, return default path
        return defaultPath;
    }

    /**
     * Parse SVG path string to get coordinates (simplified)
     */
    parsePathSegmentsSimple(pathString) {
        const segments = [];
        const commands = pathString.match(/[ML]\s*[\d.-]+\s+[\d.-]+/g);

        if (commands) {
            for (let cmd of commands) {
                const coords = cmd.match(/[\d.-]+/g);
                if (coords && coords.length >= 2) {
                    segments.push({
                        x: parseFloat(coords[0]),
                        y: parseFloat(coords[1])
                    });
                }
            }
        }

        return segments;
    }

    /**
     * Check if line intersects with any shapes (simplified)
     */
    doesLineIntersectShapesSimple(x1, y1, x2, y2, fromShape, toShape) {
        const allObjects = canvas.getObjects();
        const MARGIN = 10;

        for (let obj of allObjects) {
            // Skip connectors, connection handles, and the shapes we're connected to
            if (obj.isConnector || obj.isConnectionHandle || obj.isTempConnector ||
                obj === fromShape || obj === toShape) {
                continue;
            }

            // Only check actual shapes (objects with id)
            if (!obj.id) continue;

            const bounds = obj.getBoundingRect(true);
            const left = bounds.left - MARGIN;
            const right = bounds.left + bounds.width + MARGIN;
            const top = bounds.top - MARGIN;
            const bottom = bounds.top + bounds.height + MARGIN;

            if (this.lineIntersectsRectSimple(x1, y1, x2, y2, left, top, right, bottom)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if line segment intersects with rectangle (simplified)
     */
    lineIntersectsRectSimple(x1, y1, x2, y2, rectLeft, rectTop, rectRight, rectBottom) {
        // Check if either endpoint is inside rectangle
        if ((x1 >= rectLeft && x1 <= rectRight && y1 >= rectTop && y1 <= rectBottom) ||
            (x2 >= rectLeft && x2 <= rectRight && y2 >= rectTop && y2 <= rectBottom)) {
            return true;
        }

        // Check if line intersects any of the 4 rectangle edges
        return this.lineSegmentsIntersectSimple(x1, y1, x2, y2, rectLeft, rectTop, rectRight, rectTop) ||
               this.lineSegmentsIntersectSimple(x1, y1, x2, y2, rectRight, rectTop, rectRight, rectBottom) ||
               this.lineSegmentsIntersectSimple(x1, y1, x2, y2, rectLeft, rectBottom, rectRight, rectBottom) ||
               this.lineSegmentsIntersectSimple(x1, y1, x2, y2, rectLeft, rectTop, rectLeft, rectBottom);
    }

    /**
     * Check if two line segments intersect (simplified)
     */
    lineSegmentsIntersectSimple(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 0.0001) return false;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    /**
     * Check if entire path has collisions (simplified)
     */
    pathHasCollisionsSimple(pathString, fromShape, toShape) {
        const segments = this.parsePathSegmentsSimple(pathString);

        for (let i = 0; i < segments.length - 1; i++) {
            const seg = segments[i];
            const nextSeg = segments[i + 1];
            if (this.doesLineIntersectShapesSimple(seg.x, seg.y, nextSeg.x, nextSeg.y, fromShape, toShape)) {
                return true;
            }
        }

        return false;
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

        // Create temporary PATH to show orthogonal routing during drag
        const startPos = handle.getCenterPoint();

        const tempPath = new fabric.Path('M 0 0 L 0 0', {
            stroke: '#3498db',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            fill: '',
            selectable: false,
            evented: false,
            objectCaching: false,
            isTempConnector: true
        });

        canvas.add(tempPath);

        // Track mouse movement
        const moveHandler = (e) => {
            const pointer = canvas.getPointer(e.e);

            // Check if hovering over a target shape or connection handle
            const target = canvas.findTarget(e.e, false);
            let toShape = null;
            let toDirection = null;
            let end = pointer;

            // If hovering over a connection handle, use that specific point
            if (target && target.isConnectionHandle && target.parentShape !== fromShape) {
                toShape = target.parentShape;
                toDirection = target.direction;
                end = target.getCenterPoint();
            }
            // If hovering over a shape, find nearest connection point
            else if (target && target.id && target !== fromShape && !target.isConnectionHandle) {
                toShape = target;
                toDirection = this.findNearestConnectionPoint(pointer, toShape);
                // Get the actual connection point position
                const toPoint = this.getFixedPointFromDirection(toDirection, toShape, fromShape);
                const toBounds = toShape.getBoundingRect(true);
                end = {
                    x: toBounds.left + toBounds.width * toPoint.x,
                    y: toBounds.top + toBounds.height * toPoint.y
                };
                this.showConnectionHandles(toShape);
            }

            // Calculate orthogonal path for preview
            const start = startPos;

            // Determine directions
            const fromBaseDir = this.getBaseDirection(handle.direction);
            const toBaseDir = toDirection ? this.getBaseDirection(toDirection) : null;

            // Calculate orthogonal path using the same algorithm as the actual connector
            let pathString;
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const alignmentTolerance = 30;

            if (toBaseDir) {
                // We know the target direction - use the real algorithm
                const isVerticallyAligned = Math.abs(dx) < alignmentTolerance;
                const isHorizontallyAligned = Math.abs(dy) < alignmentTolerance;

                if (isVerticallyAligned && (
                    (fromBaseDir === 'top' && toBaseDir === 'bottom') ||
                    (fromBaseDir === 'bottom' && toBaseDir === 'top')
                )) {
                    const straightX = (start.x + end.x) / 2;
                    pathString = `M ${start.x} ${start.y} L ${straightX} ${start.y} L ${straightX} ${end.y} L ${end.x} ${end.y}`;
                } else if (isHorizontallyAligned && (
                    (fromBaseDir === 'left' && toBaseDir === 'right') ||
                    (fromBaseDir === 'right' && toBaseDir === 'left')
                )) {
                    const straightY = (start.y + end.y) / 2;
                    pathString = `M ${start.x} ${start.y} L ${start.x} ${straightY} L ${end.x} ${straightY} L ${end.x} ${end.y}`;
                } else if ((fromBaseDir === 'left' || fromBaseDir === 'right') && (toBaseDir === 'left' || toBaseDir === 'right')) {
                    const midX = start.x + dx / 2;
                    pathString = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
                } else if ((fromBaseDir === 'top' || fromBaseDir === 'bottom') && (toBaseDir === 'top' || toBaseDir === 'bottom')) {
                    const midY = start.y + dy / 2;
                    pathString = `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
                } else {
                    // Mixed directions - same logic as createOrthogonalPath
                    if (fromBaseDir === 'right' || fromBaseDir === 'left') {
                        // Start horizontal, then vertical
                        pathString = `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${end.y}`;
                    } else {
                        // Start vertical, then horizontal
                        pathString = `M ${start.x} ${start.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`;
                    }
                }

                // Apply obstacle routing to ALL paths if we have a target shape
                if (toShape) {
                    pathString = this.routeAroundObstaclesForPreview(start, end, fromBaseDir, toBaseDir, pathString, fromShape, toShape);
                }
            } else {
                // No target - just show simple preview to cursor
                if (fromBaseDir === 'top' || fromBaseDir === 'bottom') {
                    const midY = start.y + dy / 2;
                    pathString = `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
                } else {
                    const midX = start.x + dx / 2;
                    pathString = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
                }
            }

            tempPath.set({
                path: fabric.util.parsePath(pathString)
            });
            tempPath.setCoords();

            canvas.requestRenderAll();
        };

        const upHandler = (e) => {
            canvas.remove(tempPath);
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
