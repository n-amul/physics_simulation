uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Normalize normal and light direction
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(lightPosition - vPosition);
  vec3 viewDir = normalize(-vPosition);
  
  // Compute ambient color
  vec3 ambient = ambientColor;

  // Compute diffuse reflection
  float diff = max(dot(lightDir, normal), 0.0);
  vec3 diffuse = diffuseColor * diff * lightColor;

  // Compute specular reflection using Blinn-Phong model
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), shininess);
  vec3 specular = specularColor * spec * lightColor;
  // Combine all components
  vec3 finalColor = ambient + diffuse + specular;
  gl_FragColor = vec4(finalColor, 1.0);
}