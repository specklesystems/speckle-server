export const Units = {
  Millimeters: 'mm',
  Centimeters: 'cm',
  Meters: 'm',
  Kilometers: 'km',
  Inches: 'in',
  Feet: 'ft',
  Yards: 'yd',
  Miles: 'mi'
}

export function getConversionFactor( from, to = Units.Meters ) {
  from = normaliseName( from )
  to = normaliseName( to )
  switch ( from )
  {
  // METRIC
  case Units.Millimeters:
    switch ( to )
    {
    case Units.Centimeters: return 0.1
    case Units.Meters: return 0.001
    case Units.Kilometers: return 1e-6
    case Units.Inches: return 0.0393701
    case Units.Feet: return 0.00328084
    case Units.Yards: return 0.00109361
    case Units.Miles: return 6.21371e-7
    }
    break
  case Units.Centimeters:
    switch ( to )
    {
    case Units.Millimeters: return 10
    case Units.Meters: return 0.01
    case Units.Kilometers: return 1e-5
    case Units.Inches: return 0.393701
    case Units.Feet: return 0.0328084
    case Units.Yards: return 0.0109361
    case Units.Miles: return 6.21371e-6
    }
    break
  case Units.Meters:
    switch ( to )
    {
    case Units.Millimeters: return 1000
    case Units.Centimeters: return 100
    case Units.Kilometers: return 1000
    case Units.Inches: return 39.3701
    case Units.Feet: return 3.28084
    case Units.Yards: return 1.09361
    case Units.Miles: return 0.000621371
    }
    break
  case Units.Kilometers:
    switch ( to )
    {
    case Units.Millimeters: return 1000000
    case Units.Centimeters: return 100000
    case Units.Meters: return 1000
    case Units.Inches: return 39370.1
    case Units.Feet: return 3280.84
    case Units.Yards: return 1093.61
    case Units.Miles: return 0.621371
    }
    break

    // IMPERIAL
  case Units.Inches:
    switch ( to )
    {
    case Units.Millimeters: return 25.4
    case Units.Centimeters: return 2.54
    case Units.Meters: return 0.0254
    case Units.Kilometers: return 2.54e-5
    case Units.Feet: return 0.0833333
    case Units.Yards: return 0.027777694
    case Units.Miles: return 1.57828e-5
    }
    break
  case Units.Feet:
    switch ( to )
    {
    case Units.Millimeters: return 304.8
    case Units.Centimeters: return 30.48
    case Units.Meters: return 0.3048
    case Units.Kilometers: return 0.0003048
    case Units.Inches: return 12
    case Units.Yards: return 0.333332328
    case Units.Miles: return 0.000189394
    }
    break
  case Units.Miles:
    switch ( to )
    {
    case Units.Millimeters: return 1.609e+6
    case Units.Centimeters: return 160934
    case Units.Meters: return 1609.34
    case Units.Kilometers: return 1.60934
    case Units.Inches: return 63360
    case Units.Feet: return 5280
    case Units.Yards: return 1759.99469184
    }
    break
  }
  return 1
}

export function normaliseName( unit ) {
  if ( !unit ) return Units.Meters
  switch ( unit.toLowerCase() )
  {
  case 'mm':
  case 'mil':
  case 'millimeters':
  case 'millimetres':
    return Units.Millimeters
  case 'cm':
  case 'centimetre':
  case 'centimeter':
  case 'centimetres':
  case 'centimeters':
    return Units.Centimeters
  case 'm':
  case 'meter':
  case 'metre':
  case 'meters':
  case 'metres':
    return Units.Meters
  case 'inches':
  case 'inch':
  case 'in':
    return Units.Inches
  case 'feet':
  case 'foot':
  case 'ft':
    return Units.Feet
  case 'yard':
  case 'yards':
  case 'yd':
    return Units.Yards
  case 'miles':
  case 'mile':
  case 'mi':
    return Units.Miles
  default:
    return Units.Meters
  }
}
