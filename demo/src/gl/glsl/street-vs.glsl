#version 300 es
precision highp float;
precision highp int;

in vec2 vertex;

//displacement
uniform sampler2D displacement;
uniform vec3 border_min;
uniform vec3 border_max;


//matrices
uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

uniform float level;

out vec4 fragcolor;
out float visible;

vec3 DISP = vec3(0, 0, 1);
vec2 SHIFT = vec2(1, 1);

vec3 displace(vec2 pos) {
    vec2 texcoord = (pos + SHIFT - border_min.xy) / (border_max.xy - border_min.xy);
    return vec3(pos, texture(displacement, texcoord)) + DISP;
}


void main() {
    fragcolor = vec4(1.0);
    vec3 pos = displace(vertex);
    
    visible = float(all(greaterThan(pos, border_min)) && all(lessThan(pos, border_max)));

    gl_Position =  mProj * mView * mWorld * vec4(pos, 1.0);
}
