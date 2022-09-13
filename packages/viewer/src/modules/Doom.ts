import { BoxGeometry, Mesh, MeshStandardMaterial, PlaneGeometry, Scene } from "three"
import SpeckleRenderer from "./SpeckleRenderer"
import { World } from "./World"

export class Doom {
    private doomScene: Scene

    public constructor(renderer: SpeckleRenderer){
        this.doomScene = renderer.getDoomScene()
    }

    public init() {
        const planeGeometry = new PlaneGeometry(250, 250)
        const planeMesh = new Mesh(planeGeometry, new MeshStandardMaterial())
        planeMesh.position.z = -5.5
        planeMesh.receiveShadow = true
        this.doomScene.add(planeMesh)
        World.addPlaneCannonPrimitive(planeMesh)

        const cube = new BoxGeometry(2,2,2)
        const cubeMesh = new Mesh(cube, new MeshStandardMaterial())
        cubeMesh.receiveShadow = true
        this.doomScene.add(cubeMesh)
        World.addBoxCannonPrimitive(cubeMesh)
    }

}