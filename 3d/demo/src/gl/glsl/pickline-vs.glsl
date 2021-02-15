#version 300 es
precision highp float;
precision highp int;

in vec3 vertex;
in vec4 object;
in vec2 startVert;
in vec2 endVert;

//displacement
uniform sampler2D displacement;
uniform vec3 border_min;
uniform vec3 border_max;

//matrices
uniform mat4 mM;
uniform mat4 mVP;

out vec4 fragcolor;
out float visible;

vec3 DISP = vec3(0, 0, 1);
const float thickness = 10.0;

/**
 * Create rotation matrix from field vector.
 * The returned matrix can rotate vector (1, 0, 0)
 * into the desired setup.
 */
mat4 getRotationMat(vec3 vector)
{
	vec3 unit = vec3(1, 0, 0);
	vec3 f = normalize(vector);
	vec3 cross = cross(f, unit);
	vec3 a = normalize(cross);
	float s = length(cross);
	float c = dot(f, unit);
	float oc = 1.0 - c;
	return mat4(oc * a.x * a.x + c,        oc * a.x * a.y - a.z * s,  oc * a.z * a.x + a.y * s,  0.0,
                oc * a.x * a.y + a.z * s,  oc * a.y * a.y + c,        oc * a.y * a.z - a.x * s,  0.0,
                oc * a.z * a.x - a.y * s,  oc * a.y * a.z + a.x * s,  oc * a.z * a.z + c,        0.0,
                0.0,                       0.0,                       0.0,                       1.0);

}


vec3 displace(vec2 pos) {
    vec2 texcoord = (pos - border_min.xy) / (border_max.xy - border_min.xy);
    return vec3(pos, texture(displacement, texcoord)) + DISP;
}


void main() {
    fragcolor = vec4(object.xyzw);
    
    vec3 spos = displace(startVert);
    vec3 epos = displace(endVert);

    vec3 dir = epos - spos;
    float dist = length(dir);
    mat4 rot = getRotationMat(dir);

    vec3 pos = spos + (rot * vec4(vertex * vec3(dist, thickness, thickness), 1.0)).xyz;

    visible = float(all(greaterThan(pos, border_min)) && all(lessThan(pos, border_max)));

	vec3 shifted = (mM * vec4(pos, 1.0)).xyz;
	gl_Position =  mVP * vec4(shifted, 1.0);
}
