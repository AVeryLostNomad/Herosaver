// this stuff is all basically from original

import { MeshBasicMaterial, Group, Mesh, Matrix4, Vector3, Vector4, Skeleton } from 'three'
import { SubdivisionModifier } from 'three/examples/jsm/modifiers/SubdivisionModifier.js'

export const { character } = window.CK

export const getName = () => character.data.meta.character_name === '' | !character.data.meta.character_name ? 'Hero' : character.data.meta.character_name

// TODO: see this for better smoothing?: https://discourse.threejs.org/t/how-soften-hard-edges/6919
export const subdivide = (geometry, subdivisions) => new SubdivisionModifier(subdivisions).modify(geometry)

const mirror = (geometry) => {
  const tempXYZ = [0, 0, 0]
  if (geometry.index) geometry.copy(geometry.toNonIndexed())

  for (let i = 0; i < geometry.attributes.position.array.length / 9; i++) {
    tempXYZ[0] = geometry.attributes.position.array[i * 9]
    tempXYZ[1] = geometry.attributes.position.array[i * 9 + 1]
    tempXYZ[2] = geometry.attributes.position.array[i * 9 + 2]

    geometry.attributes.position.array[i * 9] = geometry.attributes.position.array[i * 9 + 6]
    geometry.attributes.position.array[i * 9 + 1] = geometry.attributes.position.array[i * 9 + 7]
    geometry.attributes.position.array[i * 9 + 2] = geometry.attributes.position.array[i * 9 + 8]

    geometry.attributes.position.array[i * 9 + 6] = tempXYZ[0]
    geometry.attributes.position.array[i * 9 + 7] = tempXYZ[1]
    geometry.attributes.position.array[i * 9 + 8] = tempXYZ[2]
  }
  return geometry
}

export const process = (object3d, smooth, mirroredPose) => {
  const material = new MeshBasicMaterial()
  const group = new Group()

  var isABone = [];
  object3d.traverseVisible(mesh => {
    console.log(mesh);

    if (mesh.isMesh) {
      const vertex = new Vector3()
      let i
      let l = []
      let nbVertex = 0
      const geometry = mesh.geometry
      let newGeometry

      const mrot = new Matrix4().makeRotationX(90 * Math.PI / 180)

      const msca = new Matrix4().makeScale(10, 10, 10)
      if (geometry.isBufferGeometry) {
        newGeometry = geometry.clone(geometry)
        const vertices = geometry.getAttribute('position')

        // vertices
        if (vertices !== undefined) {
          for (i = 0, l = vertices.count; i < l; i++, nbVertex++) {
            vertex.x = vertices.getX(i)
            vertex.y = vertices.getY(i)
            vertex.z = vertices.getZ(i)

            if (geometry.skinIndexNames === undefined ||
                      geometry.skinIndexNames === 0) {
              vertex.applyMatrix4(mesh.matrixWorld).applyMatrix4(mrot).applyMatrix4(msca)
              newGeometry.attributes.position.setXYZ(i, vertex.x, vertex.y, vertex.z)
            } else {
              const finalVector = new Vector4()
              const morphVector = new Vector4(vertex.x, vertex.y, vertex.z)// Lilly
              if (geometry.morphTargetInfluences !== undefined) {
                const tempMorph = new Vector4()

                for (let mt = 0; mt < geometry.morphAttributes.position.length; mt++) {
                  if (geometry.morphTargetInfluences[mt] === 0) continue
                  if (geometry.morphTargetDictionary.hide === mt) continue

                  const morph = new Vector4(
                    geometry.morphAttributes.position[mt].getX(i),
                    geometry.morphAttributes.position[mt].getY(i),
                    geometry.morphAttributes.position[mt].getZ(i))

                  tempMorph.addScaledVector(morph, geometry.morphTargetInfluences[mt])
                }
                // comment to avoid morph problems
                morphVector.add(tempMorph)
              }

              for (let si = 0; si < geometry.skinIndexNames.length; si++) {
                const skinIndices = geometry.getAttribute([geometry.skinIndexNames[si]])
                const weights = geometry.getAttribute([geometry.skinWeightNames[si]])

                const skinIndex = []
                skinIndex[0] = skinIndices.getX(i)
                skinIndex[1] = skinIndices.getY(i)
                skinIndex[2] = skinIndices.getZ(i)
                skinIndex[3] = skinIndices.getW(i)

                const skinWeight = []
                skinWeight[0] = weights.getX(i)
                skinWeight[1] = weights.getY(i)
                skinWeight[2] = weights.getZ(i)
                skinWeight[3] = weights.getW(i)

                const inverses = []
                inverses[0] = mesh.skeleton.boneInverses[skinIndex[0]]
                inverses[1] = mesh.skeleton.boneInverses[skinIndex[1]]
                inverses[2] = mesh.skeleton.boneInverses[skinIndex[2]]
                inverses[3] = mesh.skeleton.boneInverses[skinIndex[3]]

                const skinMatrices = []
                skinMatrices[0] = mesh.skeleton.bones[skinIndex[0]].matrixWorld
                skinMatrices[1] = mesh.skeleton.bones[skinIndex[1]].matrixWorld
                skinMatrices[2] = mesh.skeleton.bones[skinIndex[2]].matrixWorld
                skinMatrices[3] = mesh.skeleton.bones[skinIndex[3]].matrixWorld

                for (let k = 0; k < 4; k++) {
                  const tempVector = geometry.morphTargetInfluences !== undefined
                    ? new Vector4(morphVector.x, morphVector.y, morphVector.z)
                    : new Vector4(vertex.x, vertex.y, vertex.z)

                  tempVector.multiplyScalar(skinWeight[k])
                  // the inverse takes the vector into local bone space
                  // which is then transformed to the appropriate world space
                  tempVector.applyMatrix4(inverses[k])
                    .applyMatrix4(skinMatrices[k])
                    .applyMatrix4(mrot).applyMatrix4(msca)
                  finalVector.add(tempVector)
                }
              }
              newGeometry.attributes.position.setXYZ(i, finalVector.x, finalVector.y, finalVector.z)
            }
          }
        }
      } else {
        console.warn('Geometry type unsupported', geometry)
      }

      if (mirroredPose === true) {
        newGeometry = mirror(newGeometry)
      }

      if (smooth &&
                mesh.name !== 'baseRim' &&
                mesh.name !== 'base') {
        newGeometry = subdivide(newGeometry, smooth)
      }

      group.add(new Mesh(newGeometry, material))
    } else if (mesh.type === 'Bone') {
      isABone.push(mesh);
    }
  });

  const skeleton = new Skeleton(isABone);
  console.log(skeleton);
  group.bind(skeleton);
  return group
}
