var Recaptcha = require('express-recaptcha').RecaptchaV3
var recaptcha = new Recaptcha('6LcWKR8iAAAAAHy2WXcpafd1_4PhaGlAgfmSp1Zm', '6LcWKR8iAAAAAGjDw-kVGYVGFUL94ehOdRV-sGMW', { callback: 'cb' });

module.exports.recaptcha = recaptcha;