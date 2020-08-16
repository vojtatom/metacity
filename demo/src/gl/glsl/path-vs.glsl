#version 300 es
precision highp float;
precision highp int;

in vec2 vertex;
in float time;

//displacement
uniform sampler2D displacement;
uniform vec3 border_min;
uniform vec3 border_max;
uniform float shift;
uniform float scale;

//matrices
uniform mat4 mM;
uniform mat4 mVP;

//animation stuff
out float path_time;

//const displacement above surface
vec3 DISP = vec3(0, 0, 1);

vec3 displace(vec2 pos) {
    vec2 texcoord = (pos - border_min.xy) / (border_max.xy - border_min.xy);
    return vec3(pos, texture(displacement, texcoord)) + DISP;
}

void main() {
    vec3 pos = displace(vertex);
    
    //visible = float(all(greaterThan(pos, border_min)) && all(lessThan(pos, border_max)));
    path_time = time;

	vec3 shifted = (mM * vec4(pos, 1.0)).xyz;
	gl_Position =  mVP * vec4(shifted, 1.0);
}
