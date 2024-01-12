const validator = require('validator');

module.exports = {
    // Password should be greater than or equal to 8 characters. Cannot have hiphens or quotes.
    isValidPassword: (password) => {
        if (validator.isLength(password, { min: 8 }) && !validator.contains(password, '-' || "'")) {
            return true;
        }
        return false;
    },
}