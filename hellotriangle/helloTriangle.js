import {WebGLCanvas} from '../../base/helpers/WebGLCanvas.js';
import {WebGLShader} from '../../base/helpers/WebGLShader.js';

/**
 * Et WebGL-program som tegner en enkel trekant.
 * Bruker ikke klasser, kun funksjoner.
 */
export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	const webGLCanvas = new WebGLCanvas('myCanvas', document.body, 960, 640);
	const gl = webGLCanvas.gl;
	let baseShaderInfo = initBaseShaders(gl);
	let buffers = initBuffers(gl);
	draw(gl, baseShaderInfo, buffers);
}

function initBaseShaders(gl) {
	// Leser shaderkode fra HTML-fila: Standard/enkel shader (posisjon og farge):
	let vertexShaderSource = document.getElementById('base-vertex-shader').innerHTML;
	let fragmentShaderSource = document.getElementById('base-fragment-shader').innerHTML;

	// Initialiserer  & kompilerer shader-programmene;
	const glslShader = new WebGLShader(gl, vertexShaderSource, fragmentShaderSource);

	// Samler all shader-info i ET JS-objekt, som returneres.
	return  {
		program: glslShader.shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexPosition'),
			vertexColor: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexColor'),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uModelViewMatrix'),
		},
	};
}


/**
 * Genererer view- og projeksjonsmatrisene.
 * Disse utgjør tilsanmmen det virtuelle kameraet.
 */
function initCamera(gl) {
	// Kameraposisjon:
	let eyeX=0, eyeY=0, eyeZ=10;
	// Kamera ser mot ...
	let lookX=0, lookY=0, lookZ=0;

	// Kameraorientering:
	let upX=0, upY=1, upZ=0;

	let viewMatrix = new Matrix4();
	let projectionMatrix = new Matrix4();

	// VIEW-matrisa:
	viewMatrix.setLookAt(eyeX, eyeY, eyeZ, lookX, lookY, lookZ, upX, upY, upZ);
	// PROJECTION-matrisa (frustum): cuon-utils: Matrix4.prototype.setPerspective = function(fovy, aspect, near, far)
	const fieldOfView = 60; // I grader.
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const near = 0.1;
	const far = 1000.0;
	// PROJEKSJONS-matrisa; Bruker cuon-utils: Matrix4.prototype.setPerspective = function(fovy, aspect, near, far)
	projectionMatrix.setPerspective(fieldOfView, aspect, near, far);

	return {
		viewMatrix: viewMatrix,
		projectionMatrix: projectionMatrix
	};
}

/**
 * Oppretter verteksbuffer for trekanten.
 * Et posisjonsbuffer og et fargebuffer.
 * MERK: Må være likt antall posisjoner og farger.
 */
function initBuffers(gl) {
	// 8 hjørnepunkter i en kube
	const positions = new Float32Array([
		-1, -1, -1,  // 0: Venstre, bak, bunn
		1, -1, -1,  // 1: Høyre, bak, bunn
		1,  1, -1,  // 2: Høyre, bak, topp
		-1,  1, -1,  // 3: Venstre, bak, topp
		-1, -1,  1,  // 4: Venstre, front, bunn
		1, -1,  1,  // 5: Høyre, front, bunn
		1,  1,  1,  // 6: Høyre, front, topp
		-1,  1,  1   // 7: Venstre, front, topp
	]);

	// Farger for hvert hjørnepunkt
	const colors = new Float32Array([
		1, 0, 0, 1,  // Rød
		0, 1, 0, 1,  // Grønn
		0, 0, 1, 1,  // Blå
		1, 1, 0, 1,  // Gul
		1, 0, 1, 1,  // Magenta
		0, 1, 1, 1,  // Cyan
		1, 0.5, 0, 1, // Oransje
		0.5, 0, 0.5, 1  // Lilla
	]);

	// Indekser for å definere hver trekant i kuben
	const indices = new Uint16Array([
		0, 1, 2,   0, 2, 3,   // Bakside
		4, 5, 6,   4, 6, 7,   // Fremside
		3, 2, 6,   3, 6, 7,   // Topp
		0, 1, 5,   0, 5, 4,   // Bunn
		0, 3, 7,   0, 7, 4,   // Venstre
		1, 2, 6,   1, 6, 5    // Høyre
	]);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

	return {
		position: positionBuffer,
		color: colorBuffer,
		indices: indexBuffer,
		vertexCount: indices.length
	};
}





/**
 * Aktiverer position-bufferet.
 * Kalles fra draw()
 */
function connectPositionAttribute(gl, baseShaderInfo, positionBuffer) {
	const numComponents = 3;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(
		baseShaderInfo.attribLocations.vertexPosition,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(baseShaderInfo.attribLocations.vertexPosition);
}

/**
 * Aktiverer color-bufferet.
 * Kalles fra draw()
 */
function connectColorAttribute(gl, baseShaderInfo, colorBuffer) {
	const numComponents = 4;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(
		baseShaderInfo.attribLocations.vertexColor,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(baseShaderInfo.attribLocations.vertexColor);
}

/**
 * Klargjør canvaset.
 * Kalles fra draw()
 */
function clearCanvas(gl) {
	gl.clearColor(0.9, 0.9, 0.9, 1);  // Clear screen farge.
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);           // Enable "depth testing".
	gl.depthFunc(gl.LEQUAL);            // Nære objekter dekker fjerne objekter.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * Tegner!
 *
 */
function draw(gl, baseShaderInfo, buffers) {
	clearCanvas(gl);

	gl.useProgram(baseShaderInfo.program);

	connectPositionAttribute(gl, baseShaderInfo, buffers.position);
	connectColorAttribute(gl, baseShaderInfo, buffers.color);

	let modelMatrix = new Matrix4();
	modelMatrix.setIdentity();

	// Legg til rotasjon: (Eks. roterer 30 grader om hver akse)
	let angle = performance.now() / 1000 * 30;  // 30 grader per sekund
	modelMatrix.rotate(angle, 1, 1, 0);  // Rotasjon rundt x- og y-aksen

	let cameraMatrixes = initCamera(gl);
	let modelviewMatrix = new Matrix4(cameraMatrixes.viewMatrix.multiply(modelMatrix));

	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.projectionMatrix, false, cameraMatrixes.projectionMatrix.elements);


	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
	gl.drawElements(gl.TRIANGLES, buffers.vertexCount, gl.UNSIGNED_SHORT, 0);

	requestAnimationFrame(() => draw(gl, baseShaderInfo, buffers));  // Gjør tegningen kontinuerlig

}
