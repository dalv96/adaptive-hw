"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function qs(selector, scope) {
    return (scope || document).querySelector(selector);
}
exports.qs = qs;
