use serde::{Deserialize, Serialize};
use std::f64::consts::PI;
/// taken from https://bivector.net/tools.html?p=3&q=0&r=0
// Written by a generator written by enki.
use std::fmt;
use std::ops::{Add, BitAnd, BitOr, BitXor, Index, IndexMut, Mul, Not, Sub};
use wasm_bindgen::prelude::*;

const basis: &'static [&'static str] = &["1", "e1", "e2", "e3", "e12", "e13", "e23", "e123"];
const basis_count: usize = basis.len();

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq, Debug, Serialize, Deserialize)]
pub struct R300 {
    mvec: [f64; basis_count],
}

impl R300 {
    pub const fn zero() -> Self {
        Self {
            mvec: [0.0; basis_count],
        }
    }

    pub const fn new(f: f64, idx: usize) -> Self {
        let mut ret = Self::zero();
        ret.mvec[idx] = f;
        ret
    }
}

#[wasm_bindgen]
impl R300 {

    pub fn vector(e1_val: f64, e2_val: f64, e3_val: f64) -> Self {
        let mut ret = Self::zero();
        ret.mvec[1] = e1_val;
        ret.mvec[2] = e2_val;
        ret.mvec[3] = e3_val;
        ret
    }

    pub fn bivector(e12_val: f64, e13_val: f64, e23_val: f64) -> Self {
        let mut ret = Self::zero();
        ret.mvec[4] = e12_val;
        ret.mvec[5] = e13_val;
        ret.mvec[6] = e23_val;
        ret
    }

    pub fn display(&self) -> String {
        let mut parts = Vec::new();
        
        for (i, prefix) in basis.iter().enumerate() {
            parts.push(format!("{}: {}", prefix, self.mvec[i]));
        }
        format!("R300({})", parts.join(", "))

    }

    #[wasm_bindgen(js_name = toJson)]
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap()
    }
}

// basis vectors are available as global constants.
const e1: R300 = R300::new(1.0, 1);
const e2: R300 = R300::new(1.0, 2);
const e3: R300 = R300::new(1.0, 3);
const e12: R300 = R300::new(1.0, 4);
const e13: R300 = R300::new(1.0, 5);
const e23: R300 = R300::new(1.0, 6);
const e123: R300 = R300::new(1.0, 7);

impl Index<usize> for R300 {
    type Output = f64;

    fn index<'a>(&'a self, index: usize) -> &'a Self::Output {
        &self.mvec[index]
    }
}

impl IndexMut<usize> for R300 {
    fn index_mut<'a>(&'a mut self, index: usize) -> &'a mut Self::Output {
        &mut self.mvec[index]
    }
}

impl fmt::Display for R300 {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let mut n = 0;
        let ret = self
            .mvec
            .iter()
            .enumerate()
            .filter_map(|(i, &coeff)| {
                if coeff > 0.00001 || coeff < -0.00001 {
                    n = 1;
                    Some(format!(
                        "{}{}",
                        format!("{:.*}", 7, coeff)
                            .trim_end_matches('0')
                            .trim_end_matches('.'),
                        if i > 0 { basis[i] } else { "" }
                    ))
                } else {
                    None
                }
            })
            .collect::<Vec<String>>()
            .join(" + ");
        if n == 0 {
            write!(f, "0")
        } else {
            write!(f, "{}", ret)
        }
    }
}

impl R300 {
    // Reverse
    // Reverse the order of the basis blades.
    pub fn Reverse(self: Self) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = a[0];
        res[1] = a[1];
        res[2] = a[2];
        res[3] = a[3];
        res[4] = -a[4];
        res[5] = -a[5];
        res[6] = -a[6];
        res[7] = -a[7];
        res
    }

    // Dual
    // Poincare duality operator.
    pub fn Dual(self: Self) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = -a[7];
        res[1] = -a[6];
        res[2] = a[5];
        res[3] = -a[4];
        res[4] = a[3];
        res[5] = -a[2];
        res[6] = a[1];
        res[7] = a[0];
        res
    }

    // Conjugate
    // Clifford Conjugation
    pub fn Conjugate(self: Self) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = a[0];
        res[1] = -a[1];
        res[2] = -a[2];
        res[3] = -a[3];
        res[4] = -a[4];
        res[5] = -a[5];
        res[6] = -a[6];
        res[7] = a[7];
        res
    }

    // Involute
    // Main involution
    pub fn Involute(self: Self) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = a[0];
        res[1] = -a[1];
        res[2] = -a[2];
        res[3] = -a[3];
        res[4] = a[4];
        res[5] = a[5];
        res[6] = a[6];
        res[7] = -a[7];
        res
    }
    pub fn bracket(self, blade: u8) -> R300 {
        R300::new(self[blade as usize], blade as usize)
    }

    // taken from New Foundation for Classical Mechanics - David Hestenes - page 61 (Magnitude)
    pub fn magnitude_squared(self: Self) -> f64 {
        let scalar_part = (self * self.Reverse())[0];

        scalar_part
    }

    pub fn norm(self: Self) -> f64 {
        let scalar_part = (self * self.Conjugate())[0];

        scalar_part.abs().sqrt()
    }

    pub fn inorm(self: Self) -> f64 {
        self.Dual().norm()
    }

    pub fn normalized(self: Self) -> Self {
        self * (1.0 / self.norm())
    }

    pub fn dot(self: Self, b: Self) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = b[0] * a[0] + b[1] * a[1] + b[2] * a[2] + b[3] * a[3]
            - b[4] * a[4]
            - b[5] * a[5]
            - b[6] * a[6]
            - b[7] * a[7];
        res[1] = b[1] * a[0] + b[0] * a[1] - b[4] * a[2] - b[5] * a[3] + b[2] * a[4] + b[3] * a[5]
            - b[7] * a[6]
            - b[6] * a[7];
        res[2] = b[2] * a[0] + b[4] * a[1] + b[0] * a[2] - b[6] * a[3] - b[1] * a[4]
            + b[7] * a[5]
            + b[3] * a[6]
            + b[5] * a[7];
        res[3] = b[3] * a[0] + b[5] * a[1] + b[6] * a[2] + b[0] * a[3]
            - b[7] * a[4]
            - b[1] * a[5]
            - b[2] * a[6]
            - b[4] * a[7];
        res[4] = b[4] * a[0] + b[7] * a[3] + b[0] * a[4] + b[3] * a[7];
        res[5] = b[5] * a[0] - b[7] * a[2] + b[0] * a[5] - b[2] * a[7];
        res[6] = b[6] * a[0] + b[7] * a[1] + b[0] * a[6] + b[1] * a[7];
        res[7] = b[7] * a[0] + b[0] * a[7];
        res
    }

    pub fn wedge(self: Self, b: Self) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = b[0] * a[0];
        res[1] = b[1] * a[0] + b[0] * a[1];
        res[2] = b[2] * a[0] + b[0] * a[2];
        res[3] = b[3] * a[0] + b[0] * a[3];
        res[4] = b[4] * a[0] + b[2] * a[1] - b[1] * a[2] + b[0] * a[4];
        res[5] = b[5] * a[0] + b[3] * a[1] - b[1] * a[3] + b[0] * a[5];
        res[6] = b[6] * a[0] + b[3] * a[2] - b[2] * a[3] + b[0] * a[6];
        res[7] = b[7] * a[0] + b[6] * a[1] - b[5] * a[2] + b[4] * a[3] + b[3] * a[4] - b[2] * a[5]
            + b[1] * a[6]
            + b[0] * a[7];
        res
    }

    pub fn geometric_product(self: Self, b: Self) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = b[0] * a[0] + b[1] * a[1] + b[2] * a[2] + b[3] * a[3]
            - b[4] * a[4]
            - b[5] * a[5]
            - b[6] * a[6]
            - b[7] * a[7];
        res[1] = b[1] * a[0] + b[0] * a[1] - b[4] * a[2] - b[5] * a[3] + b[2] * a[4] + b[3] * a[5]
            - b[7] * a[6]
            - b[6] * a[7];
        res[2] = b[2] * a[0] + b[4] * a[1] + b[0] * a[2] - b[6] * a[3] - b[1] * a[4]
            + b[7] * a[5]
            + b[3] * a[6]
            + b[5] * a[7];
        res[3] = b[3] * a[0] + b[5] * a[1] + b[6] * a[2] + b[0] * a[3]
            - b[7] * a[4]
            - b[1] * a[5]
            - b[2] * a[6]
            - b[4] * a[7];
        res[4] = b[4] * a[0] + b[2] * a[1] - b[1] * a[2] + b[7] * a[3] + b[0] * a[4] - b[6] * a[5]
            + b[5] * a[6]
            + b[3] * a[7];
        res[5] = b[5] * a[0] + b[3] * a[1] - b[7] * a[2] - b[1] * a[3] + b[6] * a[4] + b[0] * a[5]
            - b[4] * a[6]
            - b[2] * a[7];
        res[6] = b[6] * a[0] + b[7] * a[1] + b[3] * a[2] - b[2] * a[3] - b[5] * a[4]
            + b[4] * a[5]
            + b[0] * a[6]
            + b[1] * a[7];
        res[7] = b[7] * a[0] + b[6] * a[1] - b[5] * a[2] + b[4] * a[3] + b[3] * a[4] - b[2] * a[5]
            + b[1] * a[6]
            + b[0] * a[7];
        res
    }

    pub fn add(self: R300, b: R300) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = a[0] + b[0];
        res[1] = a[1] + b[1];
        res[2] = a[2] + b[2];
        res[3] = a[3] + b[3];
        res[4] = a[4] + b[4];
        res[5] = a[5] + b[5];
        res[6] = a[6] + b[6];
        res[7] = a[7] + b[7];
        res
    }

    pub fn sub(self: R300, b: R300) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = a[0] - b[0];
        res[1] = a[1] - b[1];
        res[2] = a[2] - b[2];
        res[3] = a[3] - b[3];
        res[4] = a[4] - b[4];
        res[5] = a[5] - b[5];
        res[6] = a[6] - b[6];
        res[7] = a[7] - b[7];
        res
    }

    pub fn divide(self: R300, b: R300) -> R300 {
        self.geometric_product(b.Reverse() * (1.0 / self.norm() * b.norm()))
    }
}

impl Not for R300 {
    type Output = R300;

    fn not(self: Self) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = -a[7];
        res[1] = -a[6];
        res[2] = a[5];
        res[3] = -a[4];
        res[4] = a[3];
        res[5] = -a[2];
        res[6] = a[1];
        res[7] = a[0];
        res
    }
}

// Mul
// The geometric product.
impl Mul for R300 {
    type Output = R300;

    fn mul(self: R300, b: R300) -> R300 {
        self.geometric_product(b)
    }
}

// Wedge
// The outer product. (MEET)
impl BitXor for R300 {
    type Output = R300;

    fn bitxor(self: R300, b: R300) -> R300 {
        self.wedge(b)
    }
}

// Dot
// The inner product.
impl BitOr for R300 {
    type Output = R300;

    fn bitor(self: R300, b: R300) -> R300 {
        self.dot(b)
    }
}

// Vee
// The regressive product. (JOIN)
// impl BitAnd for R300 {
//     type Output = R300;

//     fn bitand(self: R300, b: R300) -> R300 {
//         let mut res = R300::zero();
//         let a = self;
//         res[7] = 1 * (a[7] * b[7]);
//         res[6] = 1 * (a[6] * b[7] + a[7] * b[6]);
//         res[5] = -1 * (a[5] * -1 * b[7] + a[7] * b[5] * -1);
//         res[4] = 1 * (a[4] * b[7] + a[7] * b[4]);
//         res[3] = 1 * (a[3] * b[7] + a[5] * -1 * b[6] - a[6] * b[5] * -1 + a[7] * b[3]);
//         res[2] = -1 * (a[2] * -1 * b[7] + a[4] * b[6] - a[6] * b[4] + a[7] * b[2] * -1);
//         res[1] = 1 * (a[1] * b[7] + a[4] * b[5] * -1 - a[5] * -1 * b[4] + a[7] * b[1]);
//         res[0] = 1
//             * (a[0] * b[7] + a[1] * b[6] - a[2] * -1 * b[5] * -1 + a[3] * b[4] + a[4] * b[3]
//                 - a[5] * -1 * b[2] * -1
//                 + a[6] * b[1]
//                 + a[7] * b[0]);
//         res
//     }
// }

// Add
// Multivector addition
impl Add for R300 {
    type Output = R300;

    fn add(self: R300, b: R300) -> R300 {
        self.add(b)
    }
}

// Sub
// Multivector subtraction
impl Sub for R300 {
    type Output = R300;

    fn sub(self: R300, b: R300) -> R300 {
        self.sub(b)
    }
}

// smul
// scalar/multivector multiplication
impl Mul<R300> for f64 {
    type Output = R300;

    fn mul(self: f64, b: R300) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = a * b[0];
        res[1] = a * b[1];
        res[2] = a * b[2];
        res[3] = a * b[3];
        res[4] = a * b[4];
        res[5] = a * b[5];
        res[6] = a * b[6];
        res[7] = a * b[7];
        res
    }
}

// muls
// multivector/scalar multiplication
impl Mul<f64> for R300 {
    type Output = R300;

    fn mul(self: R300, b: f64) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = a[0] * b;
        res[1] = a[1] * b;
        res[2] = a[2] * b;
        res[3] = a[3] * b;
        res[4] = a[4] * b;
        res[5] = a[5] * b;
        res[6] = a[6] * b;
        res[7] = a[7] * b;
        res
    }
}

// sadd
// scalar/multivector addition
impl Add<R300> for f64 {
    type Output = R300;

    fn add(self: f64, b: R300) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = a + b[0];
        res[1] = b[1];
        res[2] = b[2];
        res[3] = b[3];
        res[4] = b[4];
        res[5] = b[5];
        res[6] = b[6];
        res[7] = b[7];
        res
    }
}

// adds
// multivector/scalar addition
impl Add<f64> for R300 {
    type Output = R300;

    fn add(self: R300, b: f64) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = a[0] + b;
        res[1] = a[1];
        res[2] = a[2];
        res[3] = a[3];
        res[4] = a[4];
        res[5] = a[5];
        res[6] = a[6];
        res[7] = a[7];
        res
    }
}

// ssub
// scalar/multivector subtraction
impl Sub<R300> for f64 {
    type Output = R300;

    fn sub(self: f64, b: R300) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = a - b[0];
        res[1] = -b[1];
        res[2] = -b[2];
        res[3] = -b[3];
        res[4] = -b[4];
        res[5] = -b[5];
        res[6] = -b[6];
        res[7] = -b[7];
        res
    }
}

// subs
// multivector/scalar subtraction
impl Sub<f64> for R300 {
    type Output = R300;

    fn sub(self: R300, b: f64) -> R300 {
        let mut res = R300::zero();
        let a = self;
        res[0] = a[0] - b;
        res[1] = a[1];
        res[2] = a[2];
        res[3] = a[3];
        res[4] = a[4];
        res[5] = a[5];
        res[6] = a[6];
        res[7] = a[7];
        res
    }
}
