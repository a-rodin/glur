var gaussCoef = function (sigma) {
  var sigma_inv_4 = sigma * sigma;
  sigma_inv_4 = 1.0 / (sigma_inv_4 * sigma_inv_4);

  var coef_A = sigma_inv_4 * (sigma * (sigma * (sigma * 1.1442707 + 0.0130625) - 0.7500910) + 0.2546730);
  var coef_W = sigma_inv_4 * (sigma * (sigma * (sigma * 1.3642870 + 0.0088755) - 0.3255340) + 0.3016210);
  var coef_B = sigma_inv_4 * (sigma * (sigma * (sigma * 1.2397166 - 0.0001644) - 0.6363580) - 0.0536068);

  var z0_abs = Math.exp(coef_A);

  var z0_real = z0_abs * Math.cos(coef_W);
  // var z0_im = z0_abs * Math.sin(coef_W);
  var z2 = Math.exp(coef_B);

  var z0_abs_2 = z0_abs * z0_abs;

  var a2 = 1.0 / (z2 * z0_abs_2),
      a0 = (z0_abs_2 + 2 * z0_real * z2) * a2,
      a1 = -(2 * z0_real + z2) * a2,
      b0 = 1.0 - (a0 + a1 + a2);

  return new Float32Array([ b0, a0, a1, a2 ]);
};


function clampTo16(i) { return i < 0 ? 0 : (i > 65535 ? 65535 : i); }

/*eslint-disable no-shadow*/
var iir_tail = new Float32Array(4);


function iir_tail_shift(iir_tail) {
  iir_tail[3] = iir_tail[2];
  iir_tail[2] = iir_tail[1];
  iir_tail[1] = iir_tail[0];
}


var convolveMono16 = function (src, out, tmp, coeff, iir_tail, width, height) {
  var x, y, out_offs, in_offs, line_buf_offs;

  var coeff_b0 = coeff[0];
  var coeff_a0 = coeff[1];
  var coeff_a1 = coeff[2];
  var coeff_a2 = coeff[3];

  /*eslint-disable max-len*/

  for (y = 0; y < height; y++) {
    in_offs = y * width;

    iir_tail[1] = iir_tail[2] = iir_tail[3] = src[in_offs];

    line_buf_offs = 0;

    for (x = 0; x < width; x++) {

      tmp[line_buf_offs] = iir_tail[0] = coeff_b0 * src[in_offs] + (coeff_a0 * iir_tail[1] + coeff_a1 * iir_tail[2] + coeff_a2 * iir_tail[3]);

      in_offs++;
      line_buf_offs++;

      iir_tail_shift(iir_tail);
    }

    line_buf_offs--;

    iir_tail[1] = iir_tail[2] = iir_tail[3] = tmp[line_buf_offs];

    out_offs = y + height * (width - 1);

    for (x = width - 1; x >= 0; x--) {
      iir_tail[0] = coeff_b0 * tmp[line_buf_offs] + (coeff_a0 * iir_tail[1] + coeff_a1 * iir_tail[2] + coeff_a2 * iir_tail[3]);

      out[out_offs] = clampTo16((iir_tail[0] + 0.5) |0);

      iir_tail_shift(iir_tail);

      line_buf_offs--;
      out_offs -= height;
    }
  }
};


var blurMono16 = function (src, width, height, radius) {
  // Quick exit on zero radius
  if (!radius) { return; }

  var out      = new Uint16Array(src.length),
      tmp_line = new Float32Array(width);

  var coeff = gaussCoef(radius);

  convolveMono16(src, out, tmp_line, coeff, iir_tail, width, height, radius);
  convolveMono16(out, src, tmp_line, coeff, iir_tail, height, width, radius);
};

module.exports = blurMono16;
