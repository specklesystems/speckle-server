import { PointQuerySolver } from './PointQuerySolver'
import { PointQuery, Query } from './Query'

export class Queries {
  public static DefaultPointQuerySolver: PointQuerySolver = new PointQuerySolver()
  public static isPointQuery(query: Query): query is PointQuery {
    return (query as PointQuery).point !== undefined
  }
}
