
export const circleRadius = 97;
export const handLengths = {
    h: 55,
    m: 80,
    s: 89
};

/*
    See mathematics here:
       x = horizontal left to right
       y = vertical top to bottom

       angle = clockwise (degrees), starting from horizontal to the right (from x to y axis)

       See https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Positions
*/

/**
 * @param {number} hours 0..12
 * @returns {number} the angle (radian) correspondign to the hours
 */
export const angleFromHours = hours => hours * (Math.PI * 2 / 12) - Math.PI / 2;
/**
 * @param {number} minutes 0..59
 * @returns {number} the angle (radian) correspondign to the minutes
 */
export const angleFromMinutes = minutes => minutes * (Math.PI * 2 / 60) - Math.PI / 2;

/**
 * @param {Date} time to draw
 * @returns {number} the angle (radian) correspondign to the seconds
 */
export const angleMSFromTime = (time) => (angleFromMinutes(time.getMinutes()) + (time.getSeconds() * Math.PI * 2 / 60 / 60));

/**
 * @param {number} r polar radius
 * @param {number} theta polar angle (radian)
 * @returns {number} X axis
 */
export const polar2cartesianX = (r, theta) => r * Math.cos(theta);

/**
 * @param {number} r polar radius
 * @param {number} theta polar angle (radian)
 * @returns {number} Y axis
 */
export const polar2cartesianY = (r, theta) => r * Math.sin(theta);

/**
 *
 * @param {number} r is the radius
 * @param {number} theta is the angle (radian)
 * @returns {object} the coordonates
 * @property {number} x coordonate
 * @property {number} y coordonate
 */
export const polar2cartesian = (r, theta) => ({ x: polar2cartesianX(r, theta), y: polar2cartesianY(r, theta) });

// Thanks to https://jsfiddle.net/upsidown/e6dx9oza/
/**
 * @param {number} radius polar radius
 * @param {number} startAngle (radian)
 * @param {number} endAngle (radian)
 * @returns {string} the SVG description of the arc
 */
export function describeArc(radius, startAngle, endAngle) {
    const start = polar2cartesian(radius, endAngle);
    const end = polar2cartesian(radius, startAngle);

    // Normalize endAngle
    while (endAngle < startAngle) {
        endAngle += Math.PI * 2;
    }
    // If more than half a tour, take the large arc
    var largeArc = (endAngle > startAngle + Math.PI) ? 1 : 0;

    // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
    //  A rx ry x-axis-rotation large-arc-flag sweep-flag x y
    //   rx, ry          = radius of clock
    //   x-axis-rotation = 0
    //   large-arc-flag  = calculated
    //   sweep-flag      = fix
    //   x, y            = @ end
    const str = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} L 0 0 Z`;
    return str;
}

