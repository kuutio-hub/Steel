export function calculateCrossSection(type, dims) {
    const { diameter, sideA, width, height, outerDiameter, wallThickness, webThickness, flangeThickness } = dims;
    const pi = Math.PI;
    switch (type) {
        case 'roundProfile': return (pi * diameter ** 2) / 4;
        case 'squareProfile': return sideA ** 2;
        case 'flatProfile': return width * height;
        case 'pipe': {
            const d = outerDiameter - 2 * wallThickness; return d > 0 ? (pi / 4) * (outerDiameter**2 - d**2) : 0;
        }
        case 'tube': {
            const w = width - 2 * wallThickness; const h = height - 2 * wallThickness; return (w > 0 && h > 0) ? (width * height) - (w * h) : 0;
        }
        case 'iBeam': return (width * flangeThickness * 2) + ((height - 2 * flangeThickness) * webThickness);
        case 'uChannel': return (height * webThickness) + (2 * (width - webThickness) * flangeThickness);
        case 'angleProfile': return (height * wallThickness) + ((width - wallThickness) * wallThickness);
        default: return 0;
    }
}

export function calculateSurfaceAreaPerMeter(type, dims) {
    const { diameter, sideA, width, height, outerDiameter } = dims;
    if (Object.values(dims).some(d => d <= 0)) return 0;
    let perimeterMm = 0;
    switch (type) {
        case 'roundProfile': case 'pipe': perimeterMm = Math.PI * (outerDiameter || diameter); break;
        case 'squareProfile': perimeterMm = 4 * sideA; break;
        case 'flatProfile': case 'tube': perimeterMm = 2 * (width + height); break;
        case 'iBeam': perimeterMm = 4 * width + 2 * height - 2 * dims.webThickness; break;
        case 'uChannel': perimeterMm = 2 * (height + width - dims.webThickness) + 2*dims.flangeThickness; break;
        case 'angleProfile': perimeterMm = 2 * (height + width); break;
    }
    return perimeterMm / 1000;
}
