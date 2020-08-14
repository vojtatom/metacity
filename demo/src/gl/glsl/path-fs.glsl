#version 300 es
precision highp float;
precision highp int;

uniform float world_time;
uniform float max_time;

in float path_time;
out vec4 color;

float VISIBLE_LEN = 100.0f;

float floatMod(float a, float b) {
    float higher = float(a > b);
    float mult = floor(a / b);
    return a * (1.0f - higher) + (a - b * mult) * higher;
}

void main()
{
    //time of active segment
    float s_time = (max_time / 10.f);
    //adjusted world time
    float w_time = floatMod(world_time, s_time);
    //adjusted local time
    float l_time = floatMod(path_time, s_time);
    
    float diff = floatMod((w_time - l_time) + s_time, s_time);

    if (diff < 0.0f)
        color = vec4(0.0f);
    else if (diff < 1.0f)
        color = vec4(1.0f);
    else if (diff < 100.0f)
        color = vec4(vec2((VISIBLE_LEN - diff) / VISIBLE_LEN), 0.0, 1.0);
    else
        color = vec4(0.0f);
}