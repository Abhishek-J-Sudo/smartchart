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
        this.strokeColor = options.strokeColor || '#5A6C7D';  // Modern gray-blue
        this.strokeWidth = options.strokeWidth || 2.5;
        this.arrowSize = options.arrowSize || 12;

        // Waypoints for custom routing
        this.waypoints = options.waypoints || [];

        // Store the chosen route to keep it stable when shapes move
        this.lockedRoute = options.lockedRoute || null;

        // Store manual waypoint adjustments (offsets from automatic path)
        // Format: { segmentIndex: { offsetX: number, offsetY: number } }
        this.waypointAdjustments = options.waypointAdjustments || {};

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

        // Store the original automatic path
        this.originalPathString = pathData.pathString;

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

        // Create waypoint controls for intermediate segments
        this.createWaypointControls();
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
     * IMPORTANT: We check the destination shape too, but exclude the connection point area
     */
    doesLineIntersectShapes(x1, y1, x2, y2) {
        const allObjects = canvas.getObjects();
        const MARGIN = 10; // Add 10px margin around shapes

        for (let obj of allObjects) {
            // Skip connectors, connection handles, temp connectors, connector arrows
            if (obj.isConnector || obj.isConnectionHandle || obj.isTempConnector || obj.isConnectorArrow) {
                continue;
            }

            // Skip the source shape completely
            if (obj === this.fromShape) {
                continue;
            }

            // For the destination shape, we need to check if the line passes through its BODY
            // but allow it to reach the connection point
            const isDestination = obj === this.toShape;

            // Only check actual shapes (objects with an id property)
            if (!obj.id) {
                continue;
            }

            console.log('Checking collision with shape:', obj.shapeType, obj.type, obj.id, isDestination ? '(DESTINATION)' : '');

            // For diamonds (polygons), check against actual polygon shape with margin
            if (obj.shapeType === 'diamond' || obj.type === 'polygon') {
                const intersects = this.lineIntersectsPolygon(x1, y1, x2, y2, obj, MARGIN);
                console.log('  Diamond/Polygon intersection check:', intersects);

                if (intersects) {
                    console.log('  COLLISION DETECTED - line passes through polygon');
                    return true;
                }
            } else {
                // For rectangles and other shapes, use bounding rect
                const bounds = obj.getBoundingRect(true);

                // Expand bounds by margin
                const left = bounds.left - MARGIN;
                const right = bounds.left + bounds.width + MARGIN;
                const top = bounds.top - MARGIN;
                const bottom = bounds.top + bounds.height + MARGIN;

                // Check if line segment intersects with expanded rectangle
                const intersects = this.lineIntersectsRect(x1, y1, x2, y2, left, top, right, bottom);
                console.log('  Rectangle intersection check:', intersects);

                if (intersects) {
                    console.log('  COLLISION DETECTED - line passes through rectangle');
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if line segment intersects with a polygon shape
     */
    lineIntersectsPolygon(x1, y1, x2, y2, polygon, margin = 0) {
        console.log('    lineIntersectsPolygon called:', {x1, y1, x2, y2, polygon: polygon.id, margin});

        // Get the polygon's actual points in canvas coordinates
        const matrix = polygon.calcTransformMatrix();
        const points = polygon.points || [];

        console.log('    Original points:', points);

        const transformedPoints = points.map(point => {
            return fabric.util.transformPoint(
                { x: point.x, y: point.y },
                matrix
            );
        });

        console.log('    Transformed points:', transformedPoints);

        // Create expanded polygon by moving each vertex outward
        const expandedPoints = [];
        const numPoints = transformedPoints.length;

        // Calculate center of polygon to determine outward direction
        let centerX = 0, centerY = 0;
        for (let point of transformedPoints) {
            centerX += point.x;
            centerY += point.y;
        }
        centerX /= numPoints;
        centerY /= numPoints;

        console.log('    Polygon center:', {centerX, centerY});

        for (let i = 0; i < numPoints; i++) {
            const curr = transformedPoints[i];

            // Calculate direction from center to vertex (outward direction)
            const outwardX = curr.x - centerX;
            const outwardY = curr.y - centerY;
            const outwardLen = Math.sqrt(outwardX * outwardX + outwardY * outwardY);

            // Normalize and expand
            const normalizedX = outwardX / outwardLen;
            const normalizedY = outwardY / outwardLen;

            // Expand vertex outward by margin
            expandedPoints.push({
                x: curr.x + normalizedX * margin,
                y: curr.y + normalizedY * margin
            });
        }

        console.log('    Expanded points (with margin):', expandedPoints);

        // Check if line intersects any edge of the expanded polygon
        for (let i = 0; i < expandedPoints.length; i++) {
            const p1 = expandedPoints[i];
            const p2 = expandedPoints[(i + 1) % expandedPoints.length];

            if (this.lineSegmentsIntersect(x1, y1, x2, y2, p1.x, p1.y, p2.x, p2.y)) {
                console.log('    COLLISION FOUND with edge', i);
                return true;
            }
        }

        // Also check if line endpoints are inside the expanded polygon
        const point1Inside = this.pointInPolygon(x1, y1, expandedPoints, 0);
        const point2Inside = this.pointInPolygon(x2, y2, expandedPoints, 0);

        console.log('    Points inside polygon?', {point1Inside, point2Inside});

        if (point1Inside || point2Inside) {
            console.log('    COLLISION FOUND - point inside polygon');
            return true;
        }

        console.log('    No collision found');
        return false;
    }

    /**
     * Check if a point is inside a polygon using ray casting algorithm
     */
    pointInPolygon(x, y, polygonPoints, margin = 0) {
        let inside = false;

        for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
            const xi = polygonPoints[i].x;
            const yi = polygonPoints[i].y;
            const xj = polygonPoints[j].x;
            const yj = polygonPoints[j].y;

            // Expand the check by margin
            const intersect = ((yi > y - margin) !== (yj > y - margin)) &&
                (x - margin < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
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
        console.log('=== routeAroundObstacles START ===');
        console.log('From shape:', this.fromShape.id, 'To shape:', this.toShape.id);

        // Debug: List all objects on canvas
        const allObjects = canvas.getObjects();
        console.log('Total objects on canvas:', allObjects.length);
        const shapes = allObjects.filter(obj => obj.id);
        console.log('Shapes with IDs:', shapes.map(s => ({id: s.id, type: s.type, shapeType: s.shapeType})));

        // Parse the default path to get line segments
        const segments = this.parsePathSegments(defaultPath);
        console.log('Path segments to check:', segments);

        // Check each segment for collisions
        let hasCollision = false;
        for (let i = 0; i < segments.length - 1; i++) {
            const seg = segments[i];
            const nextSeg = segments[i + 1];
            console.log(`Checking segment ${i}: (${seg.x}, ${seg.y}) -> (${nextSeg.x}, ${nextSeg.y})`);
            if (this.doesLineIntersectShapes(seg.x, seg.y, nextSeg.x, nextSeg.y)) {
                hasCollision = true;
                console.log('Collision detected!', {seg, nextSeg});
                break;
            }
        }

        console.log('routeAroundObstacles:', {hasCollision, segments, defaultPath});
        console.log('=== routeAroundObstacles END ===');

        // If no collision, return default path
        if (!hasCollision) {
            return defaultPath;
        }

        // Try alternative routing with extended segments
        const OFFSET = 50; // Offset distance to go around obstacles

        // For same-side connections, use a larger offset to ensure clearance
        const isSameSide = (fromDir === toDir) ||
                          (this.getBaseDirection(fromDir) === this.getBaseDirection(toDir));
        const LARGE_OFFSET = isSameSide ? 100 : 50;

        // Try multiple alternative routes
        const alternatives = [];

        if (fromDir === 'top' || fromDir === 'bottom') {
            // Vertical start (top/bottom) - prioritize going in the connection direction first
            const offsetY = fromDir === 'top' ? -LARGE_OFFSET : LARGE_OFFSET;

            // Alt 1: Extend in start direction (go up/down first) - HIGHEST PRIORITY
            alternatives.push(`M ${start.x} ${start.y} L ${start.x} ${start.y + offsetY} L ${end.x} ${start.y + offsetY} L ${end.x} ${end.y}`);

            // Alt 2: Extend further in start direction (try more distance)
            alternatives.push(`M ${start.x} ${start.y} L ${start.x} ${start.y + offsetY * 1.5} L ${end.x} ${start.y + offsetY * 1.5} L ${end.x} ${end.y}`);

            // Alt 3: Go to end level first
            alternatives.push(`M ${start.x} ${start.y} L ${start.x} ${end.y - offsetY} L ${end.x} ${end.y - offsetY} L ${end.x} ${end.y}`);

            // Alt 4 & 5: Go left/right then down/up - choose order based on relative X position
            // If end is to the right, try RIGHT first; if end is to the left, try LEFT first
            if (end.x > start.x) {
                // End is to the right - try RIGHT first
                alternatives.push(`M ${start.x} ${start.y} L ${start.x + OFFSET} ${start.y} L ${start.x + OFFSET} ${end.y} L ${end.x} ${end.y}`);
                alternatives.push(`M ${start.x} ${start.y} L ${start.x - OFFSET} ${start.y} L ${start.x - OFFSET} ${end.y} L ${end.x} ${end.y}`);
            } else {
                // End is to the left - try LEFT first
                alternatives.push(`M ${start.x} ${start.y} L ${start.x - OFFSET} ${start.y} L ${start.x - OFFSET} ${end.y} L ${end.x} ${end.y}`);
                alternatives.push(`M ${start.x} ${start.y} L ${start.x + OFFSET} ${start.y} L ${start.x + OFFSET} ${end.y} L ${end.x} ${end.y}`);
            }
        } else {
            // Horizontal start (left/right) - prioritize going in the connection direction first
            const offsetX = fromDir === 'left' ? -LARGE_OFFSET : LARGE_OFFSET;

            // Alt 1: Extend in start direction (go left/right first) - HIGHEST PRIORITY
            alternatives.push(`M ${start.x} ${start.y} L ${start.x + offsetX} ${start.y} L ${start.x + offsetX} ${end.y} L ${end.x} ${end.y}`);

            // Alt 2: Extend further in start direction (try more distance)
            alternatives.push(`M ${start.x} ${start.y} L ${start.x + offsetX * 1.5} ${start.y} L ${start.x + offsetX * 1.5} ${end.y} L ${end.x} ${end.y}`);

            // Alt 3: Go to end level first
            alternatives.push(`M ${start.x} ${start.y} L ${end.x - offsetX} ${start.y} L ${end.x - offsetX} ${end.y} L ${end.x} ${end.y}`);

            // Alt 4 & 5: Go up/down then left/right - choose order based on relative Y position
            // If end is below start, try DOWN first; if end is above start, try UP first
            if (end.y > start.y) {
                // End is below - try DOWN first
                alternatives.push(`M ${start.x} ${start.y} L ${start.x} ${start.y + OFFSET} L ${end.x} ${start.y + OFFSET} L ${end.x} ${end.y}`);
                alternatives.push(`M ${start.x} ${start.y} L ${start.x} ${start.y - OFFSET} L ${end.x} ${start.y - OFFSET} L ${end.x} ${end.y}`);
            } else {
                // End is above - try UP first
                alternatives.push(`M ${start.x} ${start.y} L ${start.x} ${start.y - OFFSET} L ${end.x} ${start.y - OFFSET} L ${end.x} ${end.y}`);
                alternatives.push(`M ${start.x} ${start.y} L ${start.x} ${start.y + OFFSET} L ${end.x} ${start.y + OFFSET} L ${end.x} ${end.y}`);
            }
        }

        // Try each alternative
        for (const alt of alternatives) {
            if (!this.pathHasCollisions(alt)) {
                console.log('Found collision-free alternative path');
                return alt;
            }
        }

        // If all alternatives have collisions, return default path (user needs to rearrange shapes)
        console.warn('All alternative paths have collisions, using default path');
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

        // Add stub/buffer distance from connection points
        const STUB_LENGTH = 20; // Minimum distance to extend from connection point before turning

        // Calculate start stub point (extend from connection point in its direction)
        const startStub = { ...start };
        switch (fromBaseDir) {
            case 'top':
                startStub.y = start.y - STUB_LENGTH;
                break;
            case 'bottom':
                startStub.y = start.y + STUB_LENGTH;
                break;
            case 'left':
                startStub.x = start.x - STUB_LENGTH;
                break;
            case 'right':
                startStub.x = start.x + STUB_LENGTH;
                break;
        }

        // Calculate end stub point (extend from connection point in its direction)
        const endStub = { ...end };
        switch (toBaseDir) {
            case 'top':
                endStub.y = end.y - STUB_LENGTH;
                break;
            case 'bottom':
                endStub.y = end.y + STUB_LENGTH;
                break;
            case 'left':
                endStub.x = end.x - STUB_LENGTH;
                break;
            case 'right':
                endStub.x = end.x + STUB_LENGTH;
                break;
        }

        let pathString;

        // Check if shapes are reasonably aligned - use straight line with tolerance
        const alignmentTolerance = 30; // pixels
        const isVerticallyAligned = Math.abs(dx) < alignmentTolerance;
        const isHorizontallyAligned = Math.abs(dy) < alignmentTolerance;

        // Route between the stub points, then add the stubs to the final path
        let middlePath;

        // If reasonably aligned vertically, straighten to use same X coordinate
        if (isVerticallyAligned && (
            (fromBaseDir === 'top' && toBaseDir === 'bottom') ||
            (fromBaseDir === 'bottom' && toBaseDir === 'top')
        )) {
            // Use average X coordinate for perfectly straight vertical line
            const straightX = (start.x + end.x) / 2;
            middlePath = this.routeAroundObstacles(startStub, endStub, fromBaseDir, toBaseDir,
                `M ${startStub.x} ${startStub.y} L ${straightX} ${startStub.y} L ${straightX} ${endStub.y} L ${endStub.x} ${endStub.y}`);
        } else if (isHorizontallyAligned && (
            (fromBaseDir === 'left' && toBaseDir === 'right') ||
            (fromBaseDir === 'right' && toBaseDir === 'left')
        )) {
            // Use average Y coordinate for perfectly straight horizontal line
            const straightY = (start.y + end.y) / 2;
            middlePath = this.routeAroundObstacles(startStub, endStub, fromBaseDir, toBaseDir,
                `M ${startStub.x} ${startStub.y} L ${startStub.x} ${straightY} L ${endStub.x} ${straightY} L ${endStub.x} ${endStub.y}`);
        }
        // If connecting opposite sides (horizontal to horizontal or vertical to vertical)
        else if ((fromBaseDir === 'left' || fromBaseDir === 'right') && (toBaseDir === 'left' || toBaseDir === 'right')) {
            // Both horizontal
            // For same-side connections (right-right or left-left), try simple paths first
            if (fromBaseDir === toBaseDir) {
                // Try multiple simple path options
                const simplePaths = [];

                // Option 1: Stay at start Y level as long as possible
                simplePaths.push(`M ${startStub.x} ${startStub.y} L ${endStub.x} ${startStub.y} L ${endStub.x} ${endStub.y}`);

                // Option 2: Go to end Y level immediately
                simplePaths.push(`M ${startStub.x} ${startStub.y} L ${startStub.x} ${endStub.y} L ${endStub.x} ${endStub.y}`);

                // Try each simple path
                let foundSimplePath = false;
                for (const simplePath of simplePaths) {
                    if (!this.pathHasCollisions(simplePath)) {
                        middlePath = simplePath;
                        foundSimplePath = true;
                        break;
                    }
                }

                if (!foundSimplePath) {
                    // Use midpoint routing if simple paths have collisions
                    const midX = (startStub.x + endStub.x) / 2;
                    middlePath = this.routeAroundObstacles(startStub, endStub, fromBaseDir, toBaseDir,
                        `M ${startStub.x} ${startStub.y} L ${midX} ${startStub.y} L ${midX} ${endStub.y} L ${endStub.x} ${endStub.y}`);
                }
            } else {
                // Opposite sides (left-right or right-left) - use midpoint
                const midX = (startStub.x + endStub.x) / 2;
                middlePath = this.routeAroundObstacles(startStub, endStub, fromBaseDir, toBaseDir,
                    `M ${startStub.x} ${startStub.y} L ${midX} ${startStub.y} L ${midX} ${endStub.y} L ${endStub.x} ${endStub.y}`);
            }
        } else if ((fromBaseDir === 'top' || fromBaseDir === 'bottom') && (toBaseDir === 'top' || toBaseDir === 'bottom')) {
            // Both vertical
            // For same-side connections (top-top or bottom-bottom), try simple paths first
            if (fromBaseDir === toBaseDir) {
                // Try multiple simple path options
                const simplePaths = [];

                // Option 1: Stay at start X level as long as possible
                simplePaths.push(`M ${startStub.x} ${startStub.y} L ${startStub.x} ${endStub.y} L ${endStub.x} ${endStub.y}`);

                // Option 2: Go to end X level immediately
                simplePaths.push(`M ${startStub.x} ${startStub.y} L ${endStub.x} ${startStub.y} L ${endStub.x} ${endStub.y}`);

                // Try each simple path
                let foundSimplePath = false;
                for (const simplePath of simplePaths) {
                    if (!this.pathHasCollisions(simplePath)) {
                        middlePath = simplePath;
                        foundSimplePath = true;
                        break;
                    }
                }

                if (!foundSimplePath) {
                    // Use midpoint routing if simple paths have collisions
                    const midY = (startStub.y + endStub.y) / 2;
                    middlePath = this.routeAroundObstacles(startStub, endStub, fromBaseDir, toBaseDir,
                        `M ${startStub.x} ${startStub.y} L ${startStub.x} ${midY} L ${endStub.x} ${midY} L ${endStub.x} ${endStub.y}`);
                }
            } else {
                // Opposite sides (top-bottom or bottom-top) - use midpoint
                const midY = (startStub.y + endStub.y) / 2;
                middlePath = this.routeAroundObstacles(startStub, endStub, fromBaseDir, toBaseDir,
                    `M ${startStub.x} ${startStub.y} L ${startStub.x} ${midY} L ${endStub.x} ${midY} L ${endStub.x} ${endStub.y}`);
            }
        } else {
            // Mixed directions - go out from start stub, then to end stub
            if (fromBaseDir === 'right' || fromBaseDir === 'left') {
                // Start horizontal, then vertical
                middlePath = this.routeAroundObstacles(startStub, endStub, fromBaseDir, toBaseDir,
                    `M ${startStub.x} ${startStub.y} L ${endStub.x} ${startStub.y} L ${endStub.x} ${endStub.y}`);
            } else {
                // Start vertical, then horizontal
                middlePath = this.routeAroundObstacles(startStub, endStub, fromBaseDir, toBaseDir,
                    `M ${startStub.x} ${startStub.y} L ${startStub.x} ${endStub.y} L ${endStub.x} ${endStub.y}`);
            }
        }

        // Prepend the start stub and append the end stub to the routed middle path
        // Remove the 'M startStub.x startStub.y' from middlePath and add the full path
        const middlePathWithoutMove = middlePath.replace(/^M\s*[\d.-]+\s+[\d.-]+\s*/, '');
        pathString = `M ${start.x} ${start.y} L ${startStub.x} ${startStub.y} ${middlePathWithoutMove} L ${end.x} ${end.y}`;

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
     * Create waypoint controls for intermediate segments
     * Only segments NOT directly connected to shapes get waypoints
     */
    createWaypointControls() {
        // Remove existing waypoint circles
        this.waypointCircles.forEach(circle => canvas.remove(circle));
        this.waypointCircles = [];

        // Parse the path to get all points
        const segments = this.parsePathSegments(this.path.path);

        // Path structure with stubs:
        // [Shape] -> [Stub1] -> [Turn1] -> ... -> [TurnN] -> [Stub2] -> [Shape]
        //
        // Strategy: Add ONE waypoint on the LONGEST segment between stubs
        // - Skip first segment (Shape to Stub1)
        // - Skip last segment (Stub2 to Shape)
        // - Find the longest segment in between and add waypoint there
        // This makes the most sense visually - for ] shapes, it's the long vertical line

        // We need at least 4 points for any connector
        if (segments.length < 4) {
            return;
        }

        // Find the longest segment (excluding first and last stub segments)
        let longestSegmentIndex = -1;
        let longestSegmentLength = 0;

        for (let i = 1; i < segments.length - 2; i++) {
            const seg = segments[i];
            const nextSeg = segments[i + 1];

            // Calculate segment length
            const dx = nextSeg.x - seg.x;
            const dy = nextSeg.y - seg.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length > longestSegmentLength) {
                longestSegmentLength = length;
                longestSegmentIndex = i;
            }
        }

        // If we found a valid segment, add waypoint arrows
        if (longestSegmentIndex >= 0) {
            const seg = segments[longestSegmentIndex];
            const nextSeg = segments[longestSegmentIndex + 1];

            // Calculate midpoint of the longest segment
            const midX = (seg.x + nextSeg.x) / 2;
            const midY = (seg.y + nextSeg.y) / 2;

            // Determine if segment is horizontal or vertical
            const isHorizontal = Math.abs(seg.y - nextSeg.y) < 1;
            const isVertical = Math.abs(seg.x - nextSeg.x) < 1;

            // Create directional arrow controls
            if (isHorizontal) {
                // Horizontal segment - show up/down arrows
                this.createArrowControl(midX, midY - 15, '▲', longestSegmentIndex, 'vertical');
                this.createArrowControl(midX, midY + 15, '▼', longestSegmentIndex, 'vertical');
            } else if (isVertical) {
                // Vertical segment - show left/right arrows
                this.createArrowControl(midX - 15, midY, '◄', longestSegmentIndex, 'horizontal');
                this.createArrowControl(midX + 15, midY, '►', longestSegmentIndex, 'horizontal');
            }
        }
    }

    /**
     * Create an arrow control for waypoint manipulation
     */
    createArrowControl(x, y, arrowSymbol, segmentIndex, direction) {
        const arrow = new fabric.Text(arrowSymbol, {
            left: x,
            top: y,
            fontSize: 16,
            fill: '#3498db',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            originX: 'center',
            originY: 'center',
            selectable: true,
            evented: true,
            hasControls: false,
            hasBorders: false,
            hoverCursor: 'move',
            visible: false, // Hidden by default, show on hover/selection
            isWaypointControl: true,
            connectorId: this.id,
            segmentIndex: segmentIndex,
            waypointDirection: direction
        });

        // Drag handler to update the path
        arrow.on('moving', () => {
            this.updatePathFromWaypoint(arrow);
        });

        canvas.add(arrow);
        this.waypointCircles.push(arrow);
    }

    /**
     * Parse path data array to get segment coordinates
     */
    parsePathSegments(pathData) {
        const segments = [];

        for (let i = 0; i < pathData.length; i++) {
            const cmd = pathData[i];
            if (cmd[0] === 'M' || cmd[0] === 'L') {
                segments.push({
                    x: cmd[1],
                    y: cmd[2]
                });
            }
        }

        return segments;
    }

    /**
     * Update path when a waypoint is dragged
     */
    updatePathFromWaypoint(waypointCircle) {
        // Get the waypoint position
        const waypointPos = waypointCircle.getCenterPoint();
        const segmentIndex = waypointCircle.segmentIndex;

        // Get the ORIGINAL automatic path (without any adjustments)
        const originalSegments = this.parsePathSegmentsFromString(this.originalPathString);

        // Get current displayed segments
        const currentSegments = this.parsePathSegments(this.path.path);

        // Determine if this is a horizontal or vertical segment in the ORIGINAL path
        const origCurrentSeg = originalSegments[segmentIndex];
        const origNextSeg = originalSegments[segmentIndex + 1];

        const isHorizontal = Math.abs(origCurrentSeg.y - origNextSeg.y) < 1;
        const isVertical = Math.abs(origCurrentSeg.x - origNextSeg.x) < 1;

        // Calculate offset from the ORIGINAL path
        if (isHorizontal) {
            // Horizontal segment - can be dragged vertically
            const originalY = origCurrentSeg.y;
            const newY = waypointPos.y;
            this.waypointAdjustments[segmentIndex] = {
                offsetX: 0,
                offsetY: newY - originalY
            };

            // Update current segments
            currentSegments[segmentIndex].y = newY;
            currentSegments[segmentIndex + 1].y = newY;
        } else if (isVertical) {
            // Vertical segment - can be dragged horizontally
            const originalX = origCurrentSeg.x;
            const newX = waypointPos.x;
            this.waypointAdjustments[segmentIndex] = {
                offsetX: newX - originalX,
                offsetY: 0
            };

            // Update current segments
            currentSegments[segmentIndex].x = newX;
            currentSegments[segmentIndex + 1].x = newX;
        }

        // Rebuild the path string from current segments
        let pathString = `M ${currentSegments[0].x} ${currentSegments[0].y}`;
        for (let i = 1; i < currentSegments.length; i++) {
            pathString += ` L ${currentSegments[i].x} ${currentSegments[i].y}`;
        }

        // Update the path - need to properly reinitialize to recalculate bounding box
        const parsedPath = fabric.util.parsePath(pathString);
        this.path.initialize(parsedPath, {
            stroke: this.path.stroke,
            strokeWidth: this.path.strokeWidth,
            fill: this.path.fill,
            selectable: this.path.selectable,
            hasControls: this.path.hasControls,
            hasBorders: this.path.hasBorders,
            lockMovementX: this.path.lockMovementX,
            lockMovementY: this.path.lockMovementY,
            lockRotation: this.path.lockRotation,
            lockScalingX: this.path.lockScalingX,
            lockScalingY: this.path.lockScalingY,
            hoverCursor: this.path.hoverCursor,
            moveCursor: this.path.moveCursor,
            perPixelTargetFind: this.path.perPixelTargetFind,
            targetFindTolerance: this.path.targetFindTolerance,
            connectorId: this.id
        });
        this.path.setCoords();

        // Update arrow position (last segment)
        const endPoint = currentSegments[currentSegments.length - 1];
        const beforeEnd = currentSegments[currentSegments.length - 2];
        const angle = Math.atan2(endPoint.y - beforeEnd.y, endPoint.x - beforeEnd.x) * 180 / Math.PI;

        this.arrow.set({
            left: endPoint.x,
            top: endPoint.y,
            angle: angle
        });
        this.arrow.setCoords();

        // Update waypoint arrow positions to match the new segment position
        const seg = currentSegments[segmentIndex];
        const nextSeg = currentSegments[segmentIndex + 1];
        const midX = (seg.x + nextSeg.x) / 2;
        const midY = (seg.y + nextSeg.y) / 2;

        // Update all waypoint controls (both arrows)
        this.waypointCircles.forEach(control => {
            if (control.segmentIndex === segmentIndex) {
                if (isHorizontal) {
                    // Horizontal segment - update vertical position
                    control.set({
                        left: midX,
                        top: control.text === '▲' ? midY - 15 : midY + 15
                    });
                } else if (isVertical) {
                    // Vertical segment - update horizontal position
                    control.set({
                        left: control.text === '◄' ? midX - 15 : midX + 15,
                        top: midY
                    });
                }
                control.setCoords();
            }
        });

        // Update text position if text exists
        if (this._textObject) {
            const textMidpoint = this.getPathMidpoint();
            this._textObject.set({
                left: textMidpoint.x,
                top: textMidpoint.y
            });
            this._textObject.setCoords();
        }

        canvas.requestRenderAll();
    }

    /**
     * Show waypoint controls (on hover or selection)
     */
    showWaypointControls() {
        this.waypointCircles.forEach(circle => {
            circle.set({ visible: true });
        });
        canvas.requestRenderAll();
    }

    /**
     * Hide waypoint controls
     */
    hideWaypointControls() {
        this.waypointCircles.forEach(circle => {
            circle.set({ visible: false });
        });
        canvas.requestRenderAll();
    }

    /**
     * Update connector (when shapes move)
     */
    update() {
        // DISABLED: Dynamic connection point switching
        // Connection points now stay fixed where user placed them
        // this.updateConnectionPoints();

        const pathData = this.calculatePath();

        // Store the original automatic path for reference
        this.originalPathString = pathData.pathString;

        // Parse the new path
        let pathString = pathData.pathString;

        // Apply any stored waypoint adjustments
        if (Object.keys(this.waypointAdjustments).length > 0) {
            pathString = this.applyWaypointAdjustments(pathString);
        }

        // Update path - need to properly reinitialize to recalculate bounding box
        const parsedPath = fabric.util.parsePath(pathString);
        this.path.initialize(parsedPath, {
            stroke: this.path.stroke,
            strokeWidth: this.path.strokeWidth,
            fill: this.path.fill,
            selectable: this.path.selectable,
            hasControls: this.path.hasControls,
            hasBorders: this.path.hasBorders,
            lockMovementX: this.path.lockMovementX,
            lockMovementY: this.path.lockMovementY,
            lockRotation: this.path.lockRotation,
            lockScalingX: this.path.lockScalingX,
            lockScalingY: this.path.lockScalingY,
            hoverCursor: this.path.hoverCursor,
            moveCursor: this.path.moveCursor,
            perPixelTargetFind: this.path.perPixelTargetFind,
            targetFindTolerance: this.path.targetFindTolerance,
            connectorId: this.id
        });
        this.path.setCoords();

        // Recalculate arrow position from the adjusted path
        const segments = this.parsePathSegments(this.path.path);
        if (segments.length >= 2) {
            const endPoint = segments[segments.length - 1];
            const beforeEnd = segments[segments.length - 2];
            const angle = Math.atan2(endPoint.y - beforeEnd.y, endPoint.x - beforeEnd.x) * 180 / Math.PI;

            this.arrow.set({
                left: endPoint.x,
                top: endPoint.y,
                angle: angle
            });
            this.arrow.setCoords();
        }

        // Recreate waypoint controls for the new path
        this.createWaypointControls();

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
     * Apply stored waypoint adjustments to a path string
     */
    applyWaypointAdjustments(pathString) {
        const segments = this.parsePathSegmentsFromString(pathString);

        // Apply each stored adjustment
        for (const segmentIndex in this.waypointAdjustments) {
            const index = parseInt(segmentIndex);
            const adjustment = this.waypointAdjustments[index];

            // Check if this segment still exists in the new path
            if (index < segments.length - 1) {
                const currentSeg = segments[index];
                const nextSeg = segments[index + 1];

                const isHorizontal = Math.abs(currentSeg.y - nextSeg.y) < 1;
                const isVertical = Math.abs(currentSeg.x - nextSeg.x) < 1;

                // Apply the stored offset
                if (isHorizontal && adjustment.offsetY !== 0) {
                    segments[index].y += adjustment.offsetY;
                    segments[index + 1].y += adjustment.offsetY;
                } else if (isVertical && adjustment.offsetX !== 0) {
                    segments[index].x += adjustment.offsetX;
                    segments[index + 1].x += adjustment.offsetX;
                }
            }
        }

        // Rebuild the path string
        let adjustedPathString = `M ${segments[0].x} ${segments[0].y}`;
        for (let i = 1; i < segments.length; i++) {
            adjustedPathString += ` L ${segments[i].x} ${segments[i].y}`;
        }

        return adjustedPathString;
    }

    /**
     * Parse SVG path string to get segment coordinates (from string format)
     */
    parsePathSegmentsFromString(pathString) {
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
            // Show endpoint handles for touch point swapping
            this.showEndpointHandles();
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
        // Hide endpoint handles when deselected
        this.hideEndpointHandles();
        canvas.requestRenderAll();
    }

    /**
     * Show endpoint handles for swapping touch points
     */
    showEndpointHandles() {
        this.hideEndpointHandles();
        this.endpointHandles = [];

        // Get start and end points
        const startPoint = this.getFixedConnectionPoint(this.fromShape, this.fromPoint);
        const endPoint = this.getFixedConnectionPoint(this.toShape, this.toPoint);

        // Create handle for start point
        const startHandle = new fabric.Circle({
            left: startPoint.x,
            top: startPoint.y,
            radius: 6,
            fill: '#3498db',
            stroke: 'white',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: true,
            hasControls: false,
            hasBorders: false,
            hoverCursor: 'grab',
            isEndpointHandle: true,
            connectorId: this.id,
            isStartPoint: true
        });

        // Create handle for end point
        const endHandle = new fabric.Circle({
            left: endPoint.x,
            top: endPoint.y,
            radius: 6,
            fill: '#3498db',
            stroke: 'white',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: true,
            hasControls: false,
            hasBorders: false,
            hoverCursor: 'grab',
            isEndpointHandle: true,
            connectorId: this.id,
            isStartPoint: false
        });

        // Add drag functionality
        startHandle.on('mousedown', (e) => {
            this.startEndpointDrag(startHandle, this.fromShape, true);
        });

        endHandle.on('mousedown', (e) => {
            this.startEndpointDrag(endHandle, this.toShape, false);
        });

        canvas.add(startHandle);
        canvas.add(endHandle);

        this.endpointHandles = [startHandle, endHandle];
        canvas.requestRenderAll();
    }

    /**
     * Hide endpoint handles
     */
    hideEndpointHandles() {
        if (this.endpointHandles) {
            this.endpointHandles.forEach(handle => canvas.remove(handle));
            this.endpointHandles = [];
            canvas.requestRenderAll();
        }
    }

    /**
     * Start dragging an endpoint to swap touch points
     */
    startEndpointDrag(handle, shape, isStartPoint) {
        const manager = getConnectorManager();

        // Disable canvas selection
        canvas.selection = false;
        canvas.defaultCursor = 'grabbing';
        handle.set('hoverCursor', 'grabbing');

        // Show all available touch points on the shape
        const touchPoints = this.getAllTouchPoints(shape);
        const touchPointHandles = [];

        touchPoints.forEach(point => {
            const bounds = shape.getBoundingRect(true);
            const actualPos = {
                x: bounds.left + bounds.width * point.x,
                y: bounds.top + bounds.height * point.y
            };

            const pointHandle = new fabric.Circle({
                left: actualPos.x,
                top: actualPos.y,
                radius: 8,
                fill: 'rgba(52, 152, 219, 0.3)',
                stroke: '#3498db',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                hasControls: false,
                hasBorders: false,
                isTouchPointPreview: true,
                touchPointData: point
            });

            canvas.add(pointHandle);
            touchPointHandles.push(pointHandle);
        });

        // Track the current nearest touch point
        let nearestTouchPoint = isStartPoint ? this.fromPoint : this.toPoint;

        const moveHandler = (e) => {
            const pointer = canvas.getPointer(e.e);

            // Move the handle
            handle.set({
                left: pointer.x,
                top: pointer.y
            });

            // Find nearest touch point
            let minDist = Infinity;
            let nearest = null;

            touchPoints.forEach(point => {
                const bounds = shape.getBoundingRect(true);
                const actualPos = {
                    x: bounds.left + bounds.width * point.x,
                    y: bounds.top + bounds.height * point.y
                };

                const dist = Math.sqrt(
                    Math.pow(pointer.x - actualPos.x, 2) +
                    Math.pow(pointer.y - actualPos.y, 2)
                );

                if (dist < minDist) {
                    minDist = dist;
                    nearest = point;
                }
            });

            // Highlight the nearest touch point
            if (nearest && minDist < 50) {
                nearestTouchPoint = nearest;

                // Update touch point handle visualization
                touchPointHandles.forEach(th => {
                    if (th.touchPointData === nearest) {
                        th.set({
                            fill: '#3498db',
                            radius: 10
                        });
                    } else {
                        th.set({
                            fill: 'rgba(52, 152, 219, 0.3)',
                            radius: 8
                        });
                    }
                });
            }

            canvas.requestRenderAll();
        };

        const upHandler = (e) => {
            // Clean up
            canvas.off('mouse:move', moveHandler);
            canvas.off('mouse:up', upHandler);
            canvas.selection = true;
            canvas.defaultCursor = 'default';

            // Remove touch point preview handles
            touchPointHandles.forEach(th => canvas.remove(th));

            // Update the connector's touch point
            if (nearestTouchPoint) {
                if (isStartPoint) {
                    this.fromPoint = nearestTouchPoint;
                } else {
                    this.toPoint = nearestTouchPoint;
                }

                // Update the connector visual
                this.update();

                // Update endpoint handles to new positions
                this.showEndpointHandles();
            }

            canvas.requestRenderAll();
        };

        canvas.on('mouse:move', moveHandler);
        canvas.on('mouse:up', upHandler);
    }

    /**
     * Get all available touch points for a shape
     */
    getAllTouchPoints(shape) {
        if (shape.shapeType === 'diamond') {
            return [
                { x: 0.5, y: 0 },    // top
                { x: 1, y: 0.5 },    // right
                { x: 0.5, y: 1 },    // bottom
                { x: 0, y: 0.5 }     // left
            ];
        } else {
            return [
                // Top (3 points)
                { x: 0.25, y: 0 },
                { x: 0.5, y: 0 },
                { x: 0.75, y: 0 },
                // Right (3 points)
                { x: 1, y: 0.25 },
                { x: 1, y: 0.5 },
                { x: 1, y: 0.75 },
                // Bottom (3 points)
                { x: 0.25, y: 1 },
                { x: 0.5, y: 1 },
                { x: 0.75, y: 1 },
                // Left (3 points)
                { x: 0, y: 0.25 },
                { x: 0, y: 0.5 },
                { x: 0, y: 0.75 }
            ];
        }
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
            this.showWaypointControls();
        });

        this.path.on('mouseout', () => {
            if (!canvas.getActiveObject() || canvas.getActiveObject() !== this.path) {
                this.unhighlight();
            }
            // Only hide if not selected
            if (!canvas.getActiveObject() || canvas.getActiveObject().connectorId !== this.id) {
                this.hideWaypointControls();
            }
        });

        this.arrow.on('mouseover', () => {
            if (!canvas.getActiveObject() || (canvas.getActiveObject() !== this.path && canvas.getActiveObject() !== this.arrow)) {
                this.highlight(false);
            }
            this.showWaypointControls();
        });

        this.arrow.on('mouseout', () => {
            if (!canvas.getActiveObject() || (canvas.getActiveObject() !== this.path && canvas.getActiveObject() !== this.arrow)) {
                this.unhighlight();
            }
            // Only hide if not selected
            if (!canvas.getActiveObject() || canvas.getActiveObject().connectorId !== this.id) {
                this.hideWaypointControls();
            }
        });

        // Show waypoints when connector is selected
        this.path.on('selected', () => {
            this.showWaypointControls();
        });

        this.arrow.on('selected', () => {
            this.showWaypointControls();
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

        // Remove endpoint handles
        this.hideEndpointHandles();

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
     * Returns the center of the longest segment (same as waypoint location)
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

        // Parse segments
        const segments = this.parsePathSegments(pathData);

        if (segments.length < 4) {
            // Fallback: return center of entire path if too short
            const firstPoint = segments[0];
            const lastPoint = segments[segments.length - 1];
            return {
                x: (firstPoint.x + lastPoint.x) / 2,
                y: (firstPoint.y + lastPoint.y) / 2
            };
        }

        // Find the longest segment (excluding first and last stub segments)
        // This matches the logic in createWaypointControls()
        let longestSegmentIndex = -1;
        let longestSegmentLength = 0;

        for (let i = 1; i < segments.length - 2; i++) {
            const seg = segments[i];
            const nextSeg = segments[i + 1];

            const dx = nextSeg.x - seg.x;
            const dy = nextSeg.y - seg.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length > longestSegmentLength) {
                longestSegmentLength = length;
                longestSegmentIndex = i;
            }
        }

        // Return the midpoint of the longest segment
        if (longestSegmentIndex >= 0) {
            const seg = segments[longestSegmentIndex];
            const nextSeg = segments[longestSegmentIndex + 1];

            return {
                x: (seg.x + nextSeg.x) / 2,
                y: (seg.y + nextSeg.y) / 2
            };
        }

        // Fallback: return center of entire path
        const firstPoint = segments[0];
        const lastPoint = segments[segments.length - 1];
        return {
            x: (firstPoint.x + lastPoint.x) / 2,
            y: (firstPoint.y + lastPoint.y) / 2
        };
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
            text: this.text || '', // Include text in serialization
            waypointAdjustments: this.waypointAdjustments // Include waypoint adjustments
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
    routeAroundObstaclesForPreview(start, end, fromDir, toDir, defaultPath, fromShape) {
        // Parse default path to check for collisions
        const segments = this.parsePathSegmentsSimple(defaultPath);

        // Check each segment for collisions with shapes
        let hasCollision = false;
        for (let i = 0; i < segments.length - 1; i++) {
            const seg = segments[i];
            const nextSeg = segments[i + 1];
            if (this.doesLineIntersectShapesSimple(seg.x, seg.y, nextSeg.x, nextSeg.y, fromShape)) {
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

            if (!this.pathHasCollisionsSimple(altPath, fromShape)) return altPath;

            // Try the other side
            const altPath2 = `M ${start.x} ${start.y} L ${start.x} ${end.y - offsetY} L ${end.x} ${end.y - offsetY} L ${end.x} ${end.y}`;
            if (!this.pathHasCollisionsSimple(altPath2, fromShape)) return altPath2;
        } else {
            // Horizontal start - try going further left/right then around
            const offsetX = fromDir === 'left' ? -OFFSET : OFFSET;
            altPath = `M ${start.x} ${start.y} L ${start.x + offsetX} ${start.y} L ${start.x + offsetX} ${end.y} L ${end.x} ${end.y}`;

            if (!this.pathHasCollisionsSimple(altPath, fromShape)) return altPath;

            // Try the other side
            const altPath2 = `M ${start.x} ${start.y} L ${end.x - offsetX} ${start.y} L ${end.x - offsetX} ${end.y} L ${end.x} ${end.y}`;
            if (!this.pathHasCollisionsSimple(altPath2, fromShape)) return altPath2;
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
    doesLineIntersectShapesSimple(x1, y1, x2, y2, fromShape) {
        const allObjects = canvas.getObjects();
        const MARGIN = 10;

        for (let obj of allObjects) {
            // Skip connectors, connection handles
            if (obj.isConnector || obj.isConnectionHandle || obj.isTempConnector) {
                continue;
            }

            // Skip the source shape
            if (obj === fromShape) {
                continue;
            }

            // Check the destination shape too (don't skip it!)
            // const isDestination = obj === toShape;

            // Only check actual shapes (objects with id)
            if (!obj.id) continue;

            // For diamonds (polygons), check against actual polygon shape
            if (obj.shapeType === 'diamond' || obj.type === 'polygon') {
                if (this.lineIntersectsPolygonSimple(x1, y1, x2, y2, obj, MARGIN)) {
                    return true;
                }
            } else {
                // For rectangles and other shapes, use bounding rect
                const bounds = obj.getBoundingRect(true);
                const left = bounds.left - MARGIN;
                const right = bounds.left + bounds.width + MARGIN;
                const top = bounds.top - MARGIN;
                const bottom = bounds.top + bounds.height + MARGIN;

                if (this.lineIntersectsRectSimple(x1, y1, x2, y2, left, top, right, bottom)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if line segment intersects with a polygon shape (simplified)
     */
    lineIntersectsPolygonSimple(x1, y1, x2, y2, polygon, margin = 0) {
        // Get the polygon's actual points in canvas coordinates
        const matrix = polygon.calcTransformMatrix();
        const points = polygon.points || [];

        const transformedPoints = points.map(point => {
            return fabric.util.transformPoint(
                { x: point.x, y: point.y },
                matrix
            );
        });

        // Create expanded polygon by moving each vertex outward
        const expandedPoints = [];
        const numPoints = transformedPoints.length;

        // Calculate center of polygon to determine outward direction
        let centerX = 0, centerY = 0;
        for (let point of transformedPoints) {
            centerX += point.x;
            centerY += point.y;
        }
        centerX /= numPoints;
        centerY /= numPoints;

        for (let i = 0; i < numPoints; i++) {
            const curr = transformedPoints[i];

            // Calculate direction from center to vertex (outward direction)
            const outwardX = curr.x - centerX;
            const outwardY = curr.y - centerY;
            const outwardLen = Math.sqrt(outwardX * outwardX + outwardY * outwardY);

            // Normalize and expand
            const normalizedX = outwardX / outwardLen;
            const normalizedY = outwardY / outwardLen;

            // Expand vertex outward by margin
            expandedPoints.push({
                x: curr.x + normalizedX * margin,
                y: curr.y + normalizedY * margin
            });
        }

        // Check if line intersects any edge of the expanded polygon
        for (let i = 0; i < expandedPoints.length; i++) {
            const p1 = expandedPoints[i];
            const p2 = expandedPoints[(i + 1) % expandedPoints.length];

            if (this.lineSegmentsIntersectSimple(x1, y1, x2, y2, p1.x, p1.y, p2.x, p2.y)) {
                return true;
            }
        }

        // Also check if line endpoints are inside the expanded polygon
        if (this.pointInPolygonSimple(x1, y1, expandedPoints, 0) ||
            this.pointInPolygonSimple(x2, y2, expandedPoints, 0)) {
            return true;
        }

        return false;
    }

    /**
     * Check if a point is inside a polygon (simplified)
     */
    pointInPolygonSimple(x, y, polygonPoints, margin = 0) {
        let inside = false;

        for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
            const xi = polygonPoints[i].x;
            const yi = polygonPoints[i].y;
            const xj = polygonPoints[j].x;
            const yj = polygonPoints[j].y;

            const intersect = ((yi > y - margin) !== (yj > y - margin)) &&
                (x - margin < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
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
    pathHasCollisionsSimple(pathString, fromShape) {
        const segments = this.parsePathSegmentsSimple(pathString);

        for (let i = 0; i < segments.length - 1; i++) {
            const seg = segments[i];
            const nextSeg = segments[i + 1];
            if (this.doesLineIntersectShapesSimple(seg.x, seg.y, nextSeg.x, nextSeg.y, fromShape)) {
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

        // Get start position
        const startPos = handle.getCenterPoint();

        // Create overlay canvas for drawing preview (not affected by viewport transform)
        const canvasEl = canvas.getElement();
        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.id = 'connector-preview-overlay';
        overlayCanvas.width = canvasEl.width;
        overlayCanvas.height = canvasEl.height;
        overlayCanvas.style.position = 'absolute';
        overlayCanvas.style.left = canvasEl.offsetLeft + 'px';
        overlayCanvas.style.top = canvasEl.offsetTop + 'px';
        overlayCanvas.style.pointerEvents = 'none';
        overlayCanvas.style.zIndex = '1000';
        canvasEl.parentElement.appendChild(overlayCanvas);

        const overlayCtx = overlayCanvas.getContext('2d');

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
                    pathString = this.routeAroundObstaclesForPreview(start, end, fromBaseDir, toBaseDir, pathString, fromShape);
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

            // Clear overlay canvas
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

            // Draw path on overlay with viewport transform applied
            const vpt = canvas.viewportTransform;
            overlayCtx.save();
            overlayCtx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);

            // Parse path and draw it
            const segments = this.parsePathSegmentsSimple(pathString);
            if (segments.length > 0) {
                overlayCtx.strokeStyle = '#3498db';
                overlayCtx.lineWidth = 2;
                overlayCtx.setLineDash([5, 5]);
                overlayCtx.beginPath();
                overlayCtx.moveTo(segments[0].x, segments[0].y);
                for (let i = 1; i < segments.length; i++) {
                    overlayCtx.lineTo(segments[i].x, segments[i].y);
                }
                overlayCtx.stroke();
            }

            overlayCtx.restore();
        };

        const upHandler = (e) => {
            // Remove overlay canvas
            if (overlayCanvas && overlayCanvas.parentElement) {
                overlayCanvas.parentElement.removeChild(overlayCanvas);
            }

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
                    arrowSize: connectorData.arrowSize,
                    waypointAdjustments: connectorData.waypointAdjustments || {}
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
