import { IntersectionQuerySolver } from './IntersectionQuerySolver'
import { PointQuerySolver } from './PointQuerySolver'
import { IntersectionQuery, PointQuery, Query } from './Query'

export class Queries {
  public static DefaultPointQuerySolver: PointQuerySolver = new PointQuerySolver()
  public static DefaultIntersectionQuerySolver: IntersectionQuerySolver =
    new IntersectionQuerySolver()
  public static isPointQuery(query: Query): query is PointQuery {
    return query.operation === 'Project' || query.operation === 'Unproject'
  }
  public static isIntersectionQuery(query: Query): query is IntersectionQuery {
    return query.operation === 'Occlusion' || query.operation === 'Pick'
  }
}
