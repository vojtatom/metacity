//Missing mat2D and glmatrix

declare interface Vec2Array extends Float32Array {
}

declare interface Vec3Array extends Float32Array {
}

declare interface Vec4Array extends Float32Array {
}

declare interface Mat2Array extends Float32Array {
}

declare interface Mat3Array extends Float32Array {
}


declare interface Mat4Array extends Float32Array {
}

declare interface vec2 {
	add(out:Vec2Array, a: Vec2Array, b: Vec2Array): Vec2Array;
	create(): Vec2Array;
	clone(a: Vec2Array): Vec2Array;
	fromValues(x: number, y: number): Vec2Array;
	copy(out: Vec2Array, a:Vec2Array): Vec2Array;
	set(out: Vec2Array, x: number, y: number): Vec2Array;
	sub(out:Vec2Array, a: Vec2Array, b: Vec2Array): Vec2Array;
	subtract(out:Vec2Array, a: Vec2Array, b: Vec2Array): Vec2Array;
	mul(out:Vec2Array, a: Vec2Array, b: Vec2Array): Vec2Array;
	multiply(out:Vec2Array, a: Vec2Array, b: Vec2Array): Vec2Array;
	div(out:Vec2Array, a: Vec2Array, b: Vec2Array): Vec2Array;
	divide(out:Vec2Array, a: Vec2Array, b: Vec2Array): Vec2Array;
	min(out:Vec2Array, a: Vec2Array, b: Vec2Array): Vec2Array;
	max(out:Vec2Array, a: Vec2Array, b: Vec2Array): Vec2Array;
	scale(out:Vec2Array, a: Vec2Array, b: number): Vec2Array;
	dist(a: Vec2Array, b: Vec2Array): number;
	distance(a: Vec2Array, b: Vec2Array): number;
	sqrDist(a: Vec2Array, b: Vec2Array): number;
	squaredDistance(a: Vec2Array, b: Vec2Array): number;
	len(a: Vec2Array): number;
	length(a: Vec2Array): number;
	sqrLen(a: Vec2Array): number;
	squaredLength(a: Vec2Array): number;
	negate(out: Vec2Array, a: Vec2Array): Vec2Array;
	normalize(out: Vec2Array, a: Vec2Array): Vec2Array;
	dot(a: Vec2Array, b: Vec2Array): number;
	cross(out:Vec2Array, a: Vec2Array, b: Vec2Array): Vec2Array;
	lerp(out:Vec2Array, a: Vec2Array, b: Vec2Array, t: number): Vec2Array;
	transformMat2(out: Vec2Array, a:Vec2Array, m:Mat2Array): Vec2Array;
	str(a: Vec2Array): string;
}
declare var vec2: vec2

declare interface vec3 {
	add(out:Vec3Array, a: Vec3Array, b: Vec3Array): Vec3Array;
	create(): Vec3Array;
	clone(a: Vec3Array): Vec3Array;
	fromValues(x: number, y: number, z: number): Vec3Array;
	copy(out: Vec3Array, a:Vec3Array): Vec3Array;
	set(out: Vec3Array, x: number, y: number, z: number): Vec3Array;
	sub(out:Vec3Array, a: Vec3Array, b: Vec3Array): Vec3Array;
	subtract(out:Vec3Array, a: Vec3Array, b: Vec3Array): Vec3Array;
	mul(out:Vec3Array, a: Vec3Array, b: Vec3Array): Vec3Array;
	multiply(out:Vec3Array, a: Vec3Array, b: Vec3Array): Vec3Array;
	div(out:Vec3Array, a: Vec3Array, b: Vec3Array): Vec3Array;
	divide(out:Vec3Array, a: Vec3Array, b: Vec3Array): Vec3Array;
	min(out:Vec3Array, a: Vec3Array, b: Vec3Array): Vec3Array;
	max(out:Vec3Array, a: Vec3Array, b: Vec3Array): Vec3Array;
	scale(out:Vec3Array, a: Vec3Array, b: number): Vec3Array;
	dist(a: Vec3Array, b: Vec3Array): number;
	distance(a: Vec3Array, b: Vec3Array): number;
	sqrDist(a: Vec3Array, b: Vec3Array): number;
	squaredDistance(a: Vec3Array, b: Vec3Array): number;
	len(a: Vec3Array): number;
	length(a: Vec3Array): number;
	sqrLen(a: Vec3Array): number;
	squaredLength(a: Vec3Array): number;
	negate(out: Vec3Array, a: Vec3Array): Vec3Array;
	normalize(out: Vec3Array, a: Vec3Array): Vec3Array;
	dot(a: Vec3Array, b: Vec3Array): number;
	cross(out:Vec3Array, a: Vec3Array, b: Vec3Array): Vec3Array;
	lerp(out:Vec3Array, a: Vec3Array, b: Vec3Array, t: number): Vec3Array;
	transformMat4(out: Vec3Array, a:Vec3Array, m:Mat4Array): Vec3Array;
	transformQuat(out: Vec3Array, a:Vec3Array, q:Vec4Array): Vec3Array;
	str(a: Vec3Array): string;
}
declare var vec3: vec3

declare interface vec4 {
	add(out:Vec4Array, a: Vec4Array, b: Vec4Array): Vec4Array;
	create(): Vec4Array;
	clone(a: Vec4Array): Vec4Array;
	fromValues(x: number, y: number, z: number, w: number): Vec4Array;
	copy(out: Vec4Array, a:Vec4Array): Vec4Array;
	set(out: Vec4Array, x: number, y: number, z: number, w: number): Vec4Array;
	sub(out:Vec4Array, a: Vec4Array, b: Vec4Array): Vec4Array;
	subtract(out:Vec4Array, a: Vec4Array, b: Vec4Array): Vec4Array;
	mul(out:Vec4Array, a: Vec4Array, b: Vec4Array): Vec4Array;
	multiply(out:Vec4Array, a: Vec4Array, b: Vec4Array): Vec4Array;
	div(out:Vec4Array, a: Vec4Array, b: Vec4Array): Vec4Array;
	divide(out:Vec4Array, a: Vec4Array, b: Vec4Array): Vec4Array;
	min(out:Vec4Array, a: Vec4Array, b: Vec4Array): Vec4Array;
	max(out:Vec4Array, a: Vec4Array, b: Vec4Array): Vec4Array;
	scale(out:Vec4Array, a: Vec4Array, b: number): Vec4Array;
	dist(a: Vec4Array, b: Vec4Array): number;
	distance(a: Vec4Array, b: Vec4Array): number;
	sqrDist(a: Vec4Array, b: Vec4Array): number;
	squaredDistance(a: Vec4Array, b: Vec4Array): number;
	len(a: Vec4Array): number;
	length(a: Vec4Array): number;
	sqrLen(a: Vec4Array): number;
	squaredLength(a: Vec4Array): number;
	negate(out: Vec4Array, a: Vec4Array): Vec4Array;
	normalize(out: Vec4Array, a: Vec4Array): Vec4Array;
	dot(a: Vec4Array, b: Vec4Array): number;
	cross(out:Vec4Array, a: Vec4Array, b: Vec4Array): Vec4Array;
	lerp(out:Vec4Array, a: Vec4Array, b: Vec4Array, t: number): Vec4Array;
	transformMat4(out: Vec4Array, a:Vec4Array, m:Mat4Array): Vec4Array;
	transformQuat(out: Vec4Array, a:Vec4Array, q:Vec4Array): Vec4Array;
	str(a: Vec4Array): string;
}
declare var vec4: vec4


declare interface quat {
	create(): Vec4Array;
	clone(a: Vec4Array): Vec4Array;
	fromValues(x: number, y: number, z: number, w: number): Vec4Array;
	copy(out: Vec4Array, a: Vec4Array): Vec4Array;
	set(out: Vec4Array, x: number, y: number, z: number, w: number): Vec4Array;
	identity(out: Vec4Array): Vec4Array;
	setAxisAngle(out: Vec4Array, axis: Vec3Array, rad: number): Vec4Array;
	add(out: Vec4Array, a: Vec4Array, b: Vec4Array): Vec4Array;
	mul(out: Vec4Array, a: Vec4Array, b: Vec4Array): Vec4Array;
	multiply(out: Vec4Array, a: Vec4Array, b: Vec4Array): Vec4Array;
	scale(out:Vec4Array, a: Vec4Array, b: number): Vec4Array;
	rotateX(out: Vec4Array, a: Vec4Array, rad: number): Vec4Array;
	rotateY(out: Vec4Array, a: Vec4Array, rad: number): Vec4Array;
	rotateZ(out: Vec4Array, a: Vec4Array, rad: number): Vec4Array;
	calculateW(out: Vec4Array, a: Vec4Array): Vec4Array;
	dot(a: Vec4Array, b: Vec4Array): number;
	lerp(out:Vec4Array, a: Vec4Array, b: Vec4Array, t: number): Vec4Array;
	slerp(out:Vec4Array, a: Vec4Array, b: Vec4Array, t: number): Vec4Array;
	invert(out: Vec4Array, a: Vec4Array): Vec4Array;
	conjugate(out: Vec4Array, a: Vec4Array): Vec4Array;
	len(a: Vec4Array): number;
	length(a: Vec4Array): number;
	sqrLen(a: Vec4Array): number;
	squaredLength(a: Vec4Array): number;
	normalize(out: Vec4Array, a: Vec4Array): Vec4Array;
	str(a: Vec4Array): string;
}
declare var quat: quat

declare interface mat2 {
	create(): Mat2Array;
	clone(a: Mat2Array): Mat2Array;
	copy(out: Mat2Array, a: Mat2Array): Mat2Array;
	identity(out: Mat2Array): Mat2Array;
	transpose(out: Mat2Array, a: Mat2Array): Mat2Array;
	invert(out: Mat2Array, a: Mat2Array): Mat2Array;
	adjoint(out: Mat2Array, a: Mat2Array): Mat2Array;
	determinant(a: Mat2Array): number;
	mul(out: Mat2Array, a: Mat2Array, b: Mat2Array): Mat2Array;
	multiply(out: Mat2Array, a: Mat2Array, b: Mat2Array): Mat2Array;
	rotate(out: Mat2Array, a: Mat2Array, rad: number): Mat2Array;
	scale(out: Mat2Array, a: Mat2Array, v: Vec2Array): Mat2Array;
	str(a: Mat2Array): string;
}
declare var mat2: mat2


declare interface mat3 {
	create(): Mat3Array;
	clone(a: Mat3Array): Mat3Array;
	copy(out: Mat3Array, a: Mat3Array): Mat3Array;
	identity(out: Mat3Array): Mat3Array;
	transpose(out: Mat3Array, a: Mat3Array): Mat3Array;
	invert(out: Mat3Array, a: Mat3Array): Mat3Array;
	adjoint(out: Mat3Array, a: Mat3Array): Mat3Array;
	determinant(a: Mat3Array): number;
	mul(out: Mat3Array, a: Mat3Array, b: Mat3Array): Mat3Array;
	multiply(out: Mat3Array, a: Mat3Array, b: Mat3Array): Mat3Array;
	str(a: Mat3Array): string;
}
declare var mat3: mat3

declare interface mat4 {
	create(): Mat4Array;
	clone(a: Mat4Array): Mat4Array;
	copy(out: Mat4Array, a: Mat4Array): Mat4Array;
	identity(out: Mat4Array): Mat4Array;
	transpose(out: Mat4Array, a: Mat4Array): Mat4Array;
	invert(out: Mat4Array, a: Mat4Array): Mat4Array;
	adjoint(out: Mat4Array, a: Mat4Array): Mat4Array;
	determinant(a: Mat4Array): number;
	mul(out: Mat4Array, a: Mat4Array, b: Mat4Array): Mat4Array;
	multiply(out: Mat4Array, a: Mat4Array, b: Mat4Array): Mat4Array;
	str(a: Mat4Array): string;
	translate(out: Mat4Array, a: Mat4Array, v: Vec3Array): Mat4Array;
	scale(out: Mat4Array, a: Mat4Array, v: Vec3Array): Mat4Array;
	rotate(out: Mat4Array, a: Mat4Array, rad: number, axis: Vec3Array): Mat4Array;
	rotateX(out: Mat4Array, a: Mat4Array, rad: number): Mat4Array;
	rotateY(out: Mat4Array, a: Mat4Array, rad: number): Mat4Array;
	rotateZ(out: Mat4Array, a: Mat4Array, rad: number): Mat4Array;
	fromRotation(out: Mat4Array, d: number, v: Vec3Array): Mat4Array;
	fromRotationTranslation(out: Mat4Array, q: Vec4Array, v: Vec3Array): Mat4Array;
	frustum(out: Mat4Array, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4Array;
	perspective(out: Mat4Array, fovy: number, aspect: number, near: number, far: number): Mat4Array;
	ortho(out: Mat4Array, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4Array;
	lookAt(out: Mat4Array, eye: Vec3Array, center: Vec3Array, up: Vec3Array): Mat4Array;
}
declare var mat4: mat4

declare interface glMatrix {
	toRadian(a: number): number;
}

declare interface glMatrix {
	glMatrix: glMatrix;
	mat4: mat4;
	vec3: vec3;
}
declare var glMatrix: glMatrix