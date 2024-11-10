class Shader {
    constructor(vertexPath, fragmentPath) {
        this.vertexPath = vertexPath;
        this.fragmentPath = fragmentPath;
        this.vertexShader = null;//string
        this.fragmentShader = null;//string
    }
    async loadShaders() {
        this.vertexShader = await this.loadShaderFromFile(this.vertexPath);
        this.fragmentShader = await this.loadShaderFromFile(this.fragmentPath);
    }
    async loadShaderFromFile(filename) {
        const response = await fetch(filename);
        const text = await response.text();
        return text;
    }
}