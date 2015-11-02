var gaussCoef = function (sigma) {
  var sigma_inv_4 = sigma * sigma;
  sigma_inv_4 = 1.0 / (sigma_inv_4 * sigma_inv_4);

  var coef_A = sigma_inv_4 * (sigma * (sigma * (sigma * 1.1442707 + 0.0130625) - 0.7500910) + 0.2546730);
  var coef_W = sigma_inv_4 * (sigma * (sigma * (sigma * 1.3642870 + 0.0088755) - 0.3255340) + 0.3016210);
  var coef_B = sigma_inv_4 * (sigma * (sigma * (sigma * 1.2397166 - 0.0001644) - 0.6363580) - 0.0536068);

  var z0_abs = Math.exp(coef_A);

  var z0_real = z0_abs * Math.cos(coef_W);
  var z0_im = z0_abs * Math.sin(coef_W);
  var z2 = Math.exp(coef_B);

  var z0_abs_2 = z0_abs * z0_abs;

  var res = {
    a0: 0.0,
    a1: 0.0,
    a2: 0.0,
    b0: 0.0
  };
  res.a2 = 1.0 / (z2 * z0_abs_2);
  res.a0 = (z0_abs_2 + 2 * z0_real * z2) * res.a2;
  res.a1 = -(2 * z0_real + z2) * res.a2;

  res.b0 = 1.0 - (res.a0 + res.a1 + res.a2);

  return res;
};


var convolveRGBA = function (src, out, tmp, coeff, width, height) {
  var x, y, r, g, b, a, out_index, y_offset, x_offset;
  var r0, g0, b0, a0, r1, g1, b1, a1, r2, g2, b2, a2;

  var coeff_b0 = coeff.b0;
  var coeff_a0 = coeff.a0;
  var coeff_a1 = coeff.a1;
  var coeff_a2 = coeff.a2;

  // console.time('convolve');
  for (y = 0; y < height; y++) {
    out_index = (y + height * width - 1) * 4;
    y_offset = y * width * 4;

    a0 = a1 = a2 = src[y_offset];
    r0 = r1 = r2 = src[y_offset + 1];
    g0 = g1 = g2 = src[y_offset + 2];
    b0 = b1 = b2 = src[y_offset + 3];

    x_offset = 0;

    for (x = 0; x < width; x++) {
      a = coeff_b0 * src[y_offset + x * 4]     + (coeff_a0 * a0 + coeff_a1 * a1 + coeff_a2 * a2);
      r = coeff_b0 * src[y_offset + x * 4 + 1] + (coeff_a0 * r0 + coeff_a1 * r1 + coeff_a2 * r2);
      g = coeff_b0 * src[y_offset + x * 4 + 2] + (coeff_a0 * g0 + coeff_a1 * g1 + coeff_a2 * g2);
      b = coeff_b0 * src[y_offset + x * 4 + 3] + (coeff_a0 * b0 + coeff_a1 * b1 + coeff_a2 * b2);

      a2 = a1;
      r2 = r1;
      g2 = g1;
      b2 = b1;

      a1 = a0;
      r1 = r0;
      g1 = g0;
      b1 = b0;

      a0 = a;
      r0 = r;
      g0 = g;
      b0 = b;

      tmp[x_offset] = a;
      tmp[x_offset + 1] = r;
      tmp[x_offset + 2] = g;
      tmp[x_offset + 3] = b;
      x_offset += 4;
    }

    a0 = a1 = a2 = a;
    r0 = r1 = r2 = r;
    g0 = g1 = g2 = g;
    b0 = b1 = b2 = b;

    for (x = width - 1; x >= 0; x--) {
      x_offset -= 4;

      a = coeff_b0 * tmp[x_offset]     + (coeff_a0 * a0 + coeff_a1 * a1 + coeff_a2 * a2);
      r = coeff_b0 * tmp[x_offset + 1] + (coeff_a0 * r0 + coeff_a1 * r1 + coeff_a2 * r2);
      g = coeff_b0 * tmp[x_offset + 2] + (coeff_a0 * g0 + coeff_a1 * g1 + coeff_a2 * g2);
      b = coeff_b0 * tmp[x_offset + 3] + (coeff_a0 * b0 + coeff_a1 * b1 + coeff_a2 * b2);

      a2 = a1;
      r2 = r1;
      g2 = g1;
      b2 = b1;

      a1 = a0;
      r1 = r0;
      g1 = g0;
      b1 = b0;

      a0 = a;
      r0 = r;
      g0 = g;
      b0 = b;

      out_index -= height * 4;

      out[out_index]     = a;
      out[out_index + 1] = r;
      out[out_index + 2] = g;
      out[out_index + 3] = b;
    }
  }
  // console.timeEnd('convolve');
};


var blurRGBA = function (src, width, height, radius) {
  var out = new Uint8Array(width * height * 4);
  var tmp = new Float32Array(width * 4);

  var coeff = gaussCoef(radius);

  convolveRGBA(src, out, tmp, coeff, width, height, radius);
  convolveRGBA(out, src, tmp, coeff, height, width, radius);
};

module.exports = blurRGBA;
