/* global Blob */

import { GLTFExporter } from "./modified-gltf";
import { saveAs } from 'file-saver'
import { character, getName, process } from './utils'

if (window.location.href.includes('chibify')) {
  // export full scene as JSON (for debugging)
  // you can use this to load it later: https://threejs.org/docs/#api/en/loaders/ObjectLoader
  window.saveJson = () => saveAs(new Blob([JSON.stringify(window.CK.characterData.getJson())], { type: 'application/json;charset=utf-8' }), `${getName()}.json`)

  // export character as OBJ file
  window.saveGLTF = subdivisions => {
    // const group = process(character.threeObj, subdivisions, !!character.characterData.mirroredPose)
    const exporter = new GLTFExporter()
    exporter.parse(character.threeObj, (out) => {
      const stringified = JSON.stringify(out);
      saveAs(new Blob([stringified], { type: 'application/octet-stream;charset=utf-8' }), `${getName()}.gltf`)
    });
  }
} else if (window.location.href.includes('heroforge')) {
  console.error('Currently not supported');
  window.saveJson = () => saveAs(new Blob([JSON.stringify(window.CK.character.data.getJson())], { type: 'application/json;charset=utf-8' }), `${getName()}.json`)

  // export character as OBJ file
  window.saveGLTF = subdivisions => {
    // const group = process(character.threeObj, subdivisions, !!character.characterData.mirroredPose)
    const exporter = new GLTFExporter()
    exporter.parse(window.CK.character, (out) => {
      const stringified = JSON.stringify(out);
      saveAs(new Blob([stringified], { type: 'application/octet-stream;charset=utf-8' }), `${getName()}.gltf`)
    });
  }
}
