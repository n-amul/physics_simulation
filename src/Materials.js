import * as THREE from 'three';
import phongVertexShader from '../shader/vertex.glsl';
import phongFragmentShader from '../shader/fragment.glsl';
import simpleVertexShader from '../shader/simple/vertex.glsl';
import simpleFragmentShader from '../shader/simple/fragment.glsl';
 

class Materials {
    constructor() {
        // Store material properties as attributes
        this.lightPosition = new THREE.Vector3(10, 10, 10);
        this.lightColor = new THREE.Color(1, 1, 1);
        this.ambientColor = new THREE.Color(0.1, 0.1, 0.1);
        this.diffuseColor=new THREE.Color(0.5,0.5,0.5);
        this.specularColor = new THREE.Color(1, 1, 1);
        this.shininess = 32.0;
    }
    createBlinnPhongMaterial() {
        return new THREE.ShaderMaterial({
            vertexShader: phongVertexShader,
            fragmentShader: phongFragmentShader,
            uniforms: {
                lightPosition: { value: this.lightPosition },
                lightColor: { value: this.lightColor },
                ambientColor: { value: this.ambientColor },
                specularColor: { value: this.specularColor },
                diffuseColor:{ value:this.diffuseColor },
                shininess: { value: this.shininess }
            }
        });
    }
    createSimpleMaterial(){
        return new THREE.ShaderMaterial({
            vertexShader: simpleVertexShader,
            fragmentShader: simpleFragmentShader
        });
    }
}
export default Materials;