#version 300 es
precision highp float;
precision highp int;

in vec2 vertex;
in vec4 object;

//displacement
uniform sampler2D displacement;
uniform vec3 border_min;
uniform vec3 border_max;

uniform vec4 selected;


//matrices
uniform mat4 mM;
uniform mat4 mVP;

uniform float level;

out vec4 fragcolor;
out float visible;

vec3 DISP = vec3(0, 0, 1);

vec3 displace(vec2 pos) {
    vec2 texcoord = (pos - border_min.xy) / (border_max.xy - border_min.xy);
    return vec3(pos, texture(displacement, texcoord)) + DISP;
}


void main() {
    fragcolor = vec4(1.0, 1.0, 1.0, 0.2);
    vec3 pos = displace(vertex);

    int marked = 1;
    for(int i = 0; i < 4; ++i)
        marked *= int(floor(selected[i] * 255.0 + 0.5) == floor(object[i] * 255.0 + 0.5));

    if (bool(marked))
        fragcolor = vec4(2.0, 1.5, 1.0, 1.0);
    
    visible = float(all(greaterThan(pos, border_min)) && all(lessThan(pos, border_max)));

	vec3 shifted = (mM * vec4(pos, 1.0)).xyz;
	gl_Position =  mVP * vec4(shifted, 1.0);
}
