export function calculateCrossSection(type, dims) {
    const { 
        diameter, sideA, width, height, outerDiameter, wallThickness, 
        webThickness, flangeThickness, cornerRadius, outerCornerRadius, 
        filletRadius, flangeTipRadius, legTipRadius 
    } = dims;
    const pi = Math.PI;

    // Helper for corner area calculation (area of a square minus area of inscribed circle)
    const cornerAreaLoss = (r) => (4 - pi) * r**2;
    const filletAreaLoss = (r) => r**2 - (pi * r**2 / 4); // Area of square minus quarter circle

    switch (type) {
        case 'roundProfile': return (pi * diameter ** 2) / 4;
        
        case 'squareProfile': {
             const r = Math.min(cornerRadius, sideA / 2);
             return sideA**2 - cornerAreaLoss(r);
        }
        case 'flatProfile':{
             const r = Math.min(cornerRadius, width / 2, height / 2);
             return width * height - cornerAreaLoss(r);
        }
        case 'pipe': {
            const r_outer = outerDiameter / 2;
            const r_inner = r_outer - wallThickness;
            return r_inner > 0 ? pi * (r_outer**2 - r_inner**2) : 0;
        }
        case 'tube': {
            const t = wallThickness;
            const r_out = Math.min(outerCornerRadius, width / 2, height / 2);
            const r_in = Math.max(0, r_out - t);
            
            const outerArea = width * height - cornerAreaLoss(r_out);
            
            const innerWidth = width - 2 * t;
            const innerHeight = height - 2 * t;
            if (innerWidth <= 0 || innerHeight <= 0) return outerArea;
            
            const innerArea = innerWidth * innerHeight - cornerAreaLoss(r_in);
            return outerArea - innerArea;
        }
        case 'iBeam': {
             // Two flanges + web
            const area = (2 * width * flangeThickness) + ((height - 2 * flangeThickness) * webThickness);
            // Subtract the "missing" area due to fillets
            return area - (4 * filletAreaLoss(filletRadius));
        }
        case 'uChannel': {
            // Web area + 2 flange areas
             const area = (height * webThickness) + (2 * (width - webThickness) * flangeThickness);
             // Subtract missing area from 2 inner fillets, 2 outer flange tips
             return area - (2 * filletAreaLoss(filletRadius)) - (2 * filletAreaLoss(flangeTipRadius));
        }
        case 'angleProfile': {
             const t = wallThickness;
             // Area of two rectangles minus the overlapping square
             const area = (height * t) + (width * t) - t**2;
             // Subtract missing area from inner fillet, add area for outer fillet
             return area - filletAreaLoss(filletRadius) + filletAreaLoss(legTipRadius);
        }
        default: return 0;
    }
}

export function calculateSurfaceAreaPerMeter(type, dims) {
    const { 
        diameter, sideA, width, height, outerDiameter, wallThickness, 
        webThickness, flangeThickness, cornerRadius, outerCornerRadius,
        filletRadius, flangeTipRadius, legTipRadius
    } = dims;
    
    if (Object.values(dims).some(d => d < 0)) return 0;
    
    let perimeterMm = 0;
    const pi = Math.PI;

    // Helper for perimeter of a rounded corner (quarter circle) vs sharp corner
    const cornerPerimeterChange = (r) => (pi * r / 2) - (2 * r);
    
    switch (type) {
        case 'roundProfile': 
            perimeterMm = pi * diameter; 
            break;
        case 'pipe': {
            const innerDiameter = outerDiameter - 2 * wallThickness;
            perimeterMm = pi * outerDiameter + (innerDiameter > 0 ? pi * innerDiameter : 0);
            break;
        }
        case 'squareProfile': {
            const r = Math.min(cornerRadius, sideA / 2);
            perimeterMm = 4 * sideA + 4 * cornerPerimeterChange(r);
            break;
        }
         case 'flatProfile': {
            const r = Math.min(cornerRadius, width / 2, height / 2);
            perimeterMm = 2 * (width + height) + 4 * cornerPerimeterChange(r);
            break;
        }
        case 'tube': {
            const t = wallThickness;
            const r_out = Math.min(outerCornerRadius, width / 2, height / 2);
            let outerPerimeter = 2 * (width + height) + 4 * cornerPerimeterChange(r_out);
            
            const innerWidth = width - 2 * t;
            const innerHeight = height - 2 * t;
            if (innerWidth > 0 && innerHeight > 0) {
                 const r_in = Math.max(0, r_out - t);
                 let innerPerimeter = 2 * (innerWidth + innerHeight) + 4 * cornerPerimeterChange(r_in);
                 perimeterMm = outerPerimeter + innerPerimeter;
            } else {
                perimeterMm = outerPerimeter;
            }
            break;
        }
        case 'iBeam': 
            perimeterMm = 4 * width + 2 * height - 2 * webThickness; 
            break; // Approximation is close enough for surface area
        case 'uChannel': 
            perimeterMm = 2 * height + 2 * width + 2 * (width - webThickness);
            break; // Approximation
        case 'angleProfile': 
            perimeterMm = 2 * (height + width); 
            break; // Approximation
    }
    return perimeterMm / 1000;
}