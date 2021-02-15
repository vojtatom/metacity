#version 300 es
precision highp float;
precision highp int;

in vec3 fragcolor;
in vec4 lpos;
out vec4 color;


//shadows
uniform sampler2D shadowmap;
uniform float texSize;
uniform float tolerance;
uniform float useShadows;


float interpolate(vec2 texcoord, float depth) {
  ivec2 low = ivec2(floor(texcoord));
  ivec2 high = ivec2(ceil(texcoord));
  ivec2 lh = ivec2(low.x, high.y);
  ivec2 hl = ivec2(high.x, low.y);
  vec2 factor = texcoord - vec2(low);

  float t_low =  float(texelFetch(shadowmap, low, 0)); 
  float t_high = float(texelFetch(shadowmap, high, 0)); 
  float t_lh =   float(texelFetch(shadowmap, lh, 0)); 
  float t_hl =   float(texelFetch(shadowmap, hl, 0)); 

  float vis_low =  1.f - float(depth > t_low + tolerance);
  float vis_high = 1.f - float(depth > t_high + tolerance);
  float vis_lh =   1.f - float(depth > t_lh + tolerance);
  float vis_hl =   1.f - float(depth > t_hl + tolerance);

  return (vis_low + vis_high + vis_hl + vis_lh) / 4.0;
}


float shadow(void)
{
  vec3 vertex_relative_to_light = lpos.xyz / lpos.w;
  vertex_relative_to_light = vertex_relative_to_light * 0.5 + 0.5;
  
  float shadowing = interpolate(vertex_relative_to_light.xy * texSize, vertex_relative_to_light.z);
  return shadowing * 0.3 + 0.7;
}


void main()
{
  vec3 outcolor = fragcolor;
  
  if (bool(useShadows))
    outcolor *= shadow();

  color = vec4(outcolor + vec3(0.2), 1.0);
}