export function chaikin(points: number[], iterations = 2): number[] {
  let newPoints = points
  for (let k = 0; k < iterations; k++) {
    if (newPoints.length < 4) return newPoints
    const smoothed: number[] = []

    // Keep first point (start)
    smoothed.push(newPoints[0], newPoints[1])

    for (let i = 0; i < newPoints.length - 2; i += 2) {
      const x1 = newPoints[i]
      const y1 = newPoints[i + 1]
      const x2 = newPoints[i + 2]
      const y2 = newPoints[i + 3]

      const Qx = 0.75 * x1 + 0.25 * x2
      const Qy = 0.75 * y1 + 0.25 * y2
      const Rx = 0.25 * x1 + 0.75 * x2
      const Ry = 0.25 * y1 + 0.75 * y2

      smoothed.push(Qx, Qy, Rx, Ry)
    }

    // Keep last point (end)
    smoothed.push(newPoints[newPoints.length - 2], newPoints[newPoints.length - 1])

    newPoints = smoothed
  }
  return newPoints
}
