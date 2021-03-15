class ReconnectingWebSocket {
    constructor(url, protocols = []) {
        this.debug = false;
        this.reconnectInterval = 1000;
        this.timeoutInterval = 2000;
        this.forcedClose = false;
        this.timedOut = false;
        this.protocols = [];
        this.onopen = function (event) { };
        this.onclose = function (event) { };
        this.onconnecting = function () { };
        this.onmessage = function (event) { };
        this.onerror = function (event) { };
        this.url = url;
        this.protocols = protocols;
        this.readyState = WebSocket.CONNECTING;
        this.connect(false);
    }
    connect(reconnectAttempt) {
        this.ws = new WebSocket(this.url, this.protocols);
        this.onconnecting();
        this.log('ReconnectingWebSocket', 'attempt-connect', this.url);
        var localWs = this.ws;
        var timeout = setTimeout(() => {
            this.log('ReconnectingWebSocket', 'connection-timeout', this.url);
            this.timedOut = true;
            localWs.close();
            this.timedOut = false;
        }, this.timeoutInterval);
        this.ws.onopen = (event) => {
            clearTimeout(timeout);
            this.log('ReconnectingWebSocket', 'onopen', this.url);
            this.readyState = WebSocket.OPEN;
            reconnectAttempt = false;
            this.onopen(event);
        };
        this.ws.onclose = (event) => {
            clearTimeout(timeout);
            this.ws = null;
            if (this.forcedClose) {
                this.readyState = WebSocket.CLOSED;
                this.onclose(event);
            }
            else {
                this.readyState = WebSocket.CONNECTING;
                this.onconnecting();
                if (!reconnectAttempt && !this.timedOut) {
                    this.log('ReconnectingWebSocket', 'onclose', this.url);
                    this.onclose(event);
                }
                setTimeout(() => {
                    this.connect(true);
                }, this.reconnectInterval);
            }
        };
        this.ws.onmessage = (event) => {
            this.log('ReconnectingWebSocket', 'onmessage', this.url, event.data);
            this.onmessage(event);
        };
        this.ws.onerror = (event) => {
            this.log('ReconnectingWebSocket', 'onerror', this.url, event);
            this.onerror(event);
        };
    }
    send(data) {
        if (this.ws) {
            this.log('ReconnectingWebSocket', 'send', this.url, data);
            return this.ws.send(data);
        }
        else {
            throw 'INVALID_STATE_ERR : Pausing to reconnect websocket';
        }
    }
    close() {
        if (this.ws) {
            this.forcedClose = true;
            this.ws.close();
            return true;
        }
        return false;
    }
    refresh() {
        if (this.ws) {
            this.ws.close();
            return true;
        }
        return false;
    }
    log(...args) {
        if (this.debug || ReconnectingWebSocket.debugAll) {
            console.debug.apply(console, args);
        }
    }
}
ReconnectingWebSocket.debugAll = false;
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (global = global || self, factory(global.glMatrix = {}));
}(this, (function (exports) {
    'use strict';
    var EPSILON = 0.000001;
    var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
    var RANDOM = Math.random;
    function setMatrixArrayType(type) {
        ARRAY_TYPE = type;
    }
    var degree = Math.PI / 180;
    function toRadian(a) {
        return a * degree;
    }
    function equals(a, b) {
        return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
    }
    if (!Math.hypot)
        Math.hypot = function () {
            var y = 0, i = arguments.length;
            while (i--) {
                y += arguments[i] * arguments[i];
            }
            return Math.sqrt(y);
        };
    var common = Object.freeze({
        __proto__: null,
        EPSILON: EPSILON,
        get ARRAY_TYPE() { return ARRAY_TYPE; },
        RANDOM: RANDOM,
        setMatrixArrayType: setMatrixArrayType,
        toRadian: toRadian,
        equals: equals
    });
    function create() {
        var out = new ARRAY_TYPE(4);
        if (ARRAY_TYPE != Float32Array) {
            out[1] = 0;
            out[2] = 0;
        }
        out[0] = 1;
        out[3] = 1;
        return out;
    }
    function clone(a) {
        var out = new ARRAY_TYPE(4);
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        return out;
    }
    function copy(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        return out;
    }
    function identity(out) {
        out[0] = 1;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        return out;
    }
    function fromValues(m00, m01, m10, m11) {
        var out = new ARRAY_TYPE(4);
        out[0] = m00;
        out[1] = m01;
        out[2] = m10;
        out[3] = m11;
        return out;
    }
    function set(out, m00, m01, m10, m11) {
        out[0] = m00;
        out[1] = m01;
        out[2] = m10;
        out[3] = m11;
        return out;
    }
    function transpose(out, a) {
        if (out === a) {
            var a1 = a[1];
            out[1] = a[2];
            out[2] = a1;
        }
        else {
            out[0] = a[0];
            out[1] = a[2];
            out[2] = a[1];
            out[3] = a[3];
        }
        return out;
    }
    function invert(out, a) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
        var det = a0 * a3 - a2 * a1;
        if (!det) {
            return null;
        }
        det = 1.0 / det;
        out[0] = a3 * det;
        out[1] = -a1 * det;
        out[2] = -a2 * det;
        out[3] = a0 * det;
        return out;
    }
    function adjoint(out, a) {
        var a0 = a[0];
        out[0] = a[3];
        out[1] = -a[1];
        out[2] = -a[2];
        out[3] = a0;
        return out;
    }
    function determinant(a) {
        return a[0] * a[3] - a[2] * a[1];
    }
    function multiply(out, a, b) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
        var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = a0 * b0 + a2 * b1;
        out[1] = a1 * b0 + a3 * b1;
        out[2] = a0 * b2 + a2 * b3;
        out[3] = a1 * b2 + a3 * b3;
        return out;
    }
    function rotate(out, a, rad) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
        var s = Math.sin(rad);
        var c = Math.cos(rad);
        out[0] = a0 * c + a2 * s;
        out[1] = a1 * c + a3 * s;
        out[2] = a0 * -s + a2 * c;
        out[3] = a1 * -s + a3 * c;
        return out;
    }
    function scale(out, a, v) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
        var v0 = v[0], v1 = v[1];
        out[0] = a0 * v0;
        out[1] = a1 * v0;
        out[2] = a2 * v1;
        out[3] = a3 * v1;
        return out;
    }
    function fromRotation(out, rad) {
        var s = Math.sin(rad);
        var c = Math.cos(rad);
        out[0] = c;
        out[1] = s;
        out[2] = -s;
        out[3] = c;
        return out;
    }
    function fromScaling(out, v) {
        out[0] = v[0];
        out[1] = 0;
        out[2] = 0;
        out[3] = v[1];
        return out;
    }
    function str(a) {
        return "mat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
    }
    function frob(a) {
        return Math.hypot(a[0], a[1], a[2], a[3]);
    }
    function LDU(L, D, U, a) {
        L[2] = a[2] / a[0];
        U[0] = a[0];
        U[1] = a[1];
        U[3] = a[3] - L[2] * U[1];
        return [L, D, U];
    }
    function add(out, a, b) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        out[3] = a[3] + b[3];
        return out;
    }
    function subtract(out, a, b) {
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        out[3] = a[3] - b[3];
        return out;
    }
    function exactEquals(a, b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
    }
    function equals$1(a, b) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
        var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
    }
    function multiplyScalar(out, a, b) {
        out[0] = a[0] * b;
        out[1] = a[1] * b;
        out[2] = a[2] * b;
        out[3] = a[3] * b;
        return out;
    }
    function multiplyScalarAndAdd(out, a, b, scale) {
        out[0] = a[0] + b[0] * scale;
        out[1] = a[1] + b[1] * scale;
        out[2] = a[2] + b[2] * scale;
        out[3] = a[3] + b[3] * scale;
        return out;
    }
    var mul = multiply;
    var sub = subtract;
    var mat2 = Object.freeze({
        __proto__: null,
        create: create,
        clone: clone,
        copy: copy,
        identity: identity,
        fromValues: fromValues,
        set: set,
        transpose: transpose,
        invert: invert,
        adjoint: adjoint,
        determinant: determinant,
        multiply: multiply,
        rotate: rotate,
        scale: scale,
        fromRotation: fromRotation,
        fromScaling: fromScaling,
        str: str,
        frob: frob,
        LDU: LDU,
        add: add,
        subtract: subtract,
        exactEquals: exactEquals,
        equals: equals$1,
        multiplyScalar: multiplyScalar,
        multiplyScalarAndAdd: multiplyScalarAndAdd,
        mul: mul,
        sub: sub
    });
    function create$1() {
        var out = new ARRAY_TYPE(6);
        if (ARRAY_TYPE != Float32Array) {
            out[1] = 0;
            out[2] = 0;
            out[4] = 0;
            out[5] = 0;
        }
        out[0] = 1;
        out[3] = 1;
        return out;
    }
    function clone$1(a) {
        var out = new ARRAY_TYPE(6);
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        return out;
    }
    function copy$1(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        return out;
    }
    function identity$1(out) {
        out[0] = 1;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        out[4] = 0;
        out[5] = 0;
        return out;
    }
    function fromValues$1(a, b, c, d, tx, ty) {
        var out = new ARRAY_TYPE(6);
        out[0] = a;
        out[1] = b;
        out[2] = c;
        out[3] = d;
        out[4] = tx;
        out[5] = ty;
        return out;
    }
    function set$1(out, a, b, c, d, tx, ty) {
        out[0] = a;
        out[1] = b;
        out[2] = c;
        out[3] = d;
        out[4] = tx;
        out[5] = ty;
        return out;
    }
    function invert$1(out, a) {
        var aa = a[0], ab = a[1], ac = a[2], ad = a[3];
        var atx = a[4], aty = a[5];
        var det = aa * ad - ab * ac;
        if (!det) {
            return null;
        }
        det = 1.0 / det;
        out[0] = ad * det;
        out[1] = -ab * det;
        out[2] = -ac * det;
        out[3] = aa * det;
        out[4] = (ac * aty - ad * atx) * det;
        out[5] = (ab * atx - aa * aty) * det;
        return out;
    }
    function determinant$1(a) {
        return a[0] * a[3] - a[1] * a[2];
    }
    function multiply$1(out, a, b) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
        var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
        out[0] = a0 * b0 + a2 * b1;
        out[1] = a1 * b0 + a3 * b1;
        out[2] = a0 * b2 + a2 * b3;
        out[3] = a1 * b2 + a3 * b3;
        out[4] = a0 * b4 + a2 * b5 + a4;
        out[5] = a1 * b4 + a3 * b5 + a5;
        return out;
    }
    function rotate$1(out, a, rad) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
        var s = Math.sin(rad);
        var c = Math.cos(rad);
        out[0] = a0 * c + a2 * s;
        out[1] = a1 * c + a3 * s;
        out[2] = a0 * -s + a2 * c;
        out[3] = a1 * -s + a3 * c;
        out[4] = a4;
        out[5] = a5;
        return out;
    }
    function scale$1(out, a, v) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
        var v0 = v[0], v1 = v[1];
        out[0] = a0 * v0;
        out[1] = a1 * v0;
        out[2] = a2 * v1;
        out[3] = a3 * v1;
        out[4] = a4;
        out[5] = a5;
        return out;
    }
    function translate(out, a, v) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
        var v0 = v[0], v1 = v[1];
        out[0] = a0;
        out[1] = a1;
        out[2] = a2;
        out[3] = a3;
        out[4] = a0 * v0 + a2 * v1 + a4;
        out[5] = a1 * v0 + a3 * v1 + a5;
        return out;
    }
    function fromRotation$1(out, rad) {
        var s = Math.sin(rad), c = Math.cos(rad);
        out[0] = c;
        out[1] = s;
        out[2] = -s;
        out[3] = c;
        out[4] = 0;
        out[5] = 0;
        return out;
    }
    function fromScaling$1(out, v) {
        out[0] = v[0];
        out[1] = 0;
        out[2] = 0;
        out[3] = v[1];
        out[4] = 0;
        out[5] = 0;
        return out;
    }
    function fromTranslation(out, v) {
        out[0] = 1;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        out[4] = v[0];
        out[5] = v[1];
        return out;
    }
    function str$1(a) {
        return "mat2d(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ")";
    }
    function frob$1(a) {
        return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], 1);
    }
    function add$1(out, a, b) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        out[3] = a[3] + b[3];
        out[4] = a[4] + b[4];
        out[5] = a[5] + b[5];
        return out;
    }
    function subtract$1(out, a, b) {
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        out[3] = a[3] - b[3];
        out[4] = a[4] - b[4];
        out[5] = a[5] - b[5];
        return out;
    }
    function multiplyScalar$1(out, a, b) {
        out[0] = a[0] * b;
        out[1] = a[1] * b;
        out[2] = a[2] * b;
        out[3] = a[3] * b;
        out[4] = a[4] * b;
        out[5] = a[5] * b;
        return out;
    }
    function multiplyScalarAndAdd$1(out, a, b, scale) {
        out[0] = a[0] + b[0] * scale;
        out[1] = a[1] + b[1] * scale;
        out[2] = a[2] + b[2] * scale;
        out[3] = a[3] + b[3] * scale;
        out[4] = a[4] + b[4] * scale;
        out[5] = a[5] + b[5] * scale;
        return out;
    }
    function exactEquals$1(a, b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
    }
    function equals$2(a, b) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
        var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
        return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5));
    }
    var mul$1 = multiply$1;
    var sub$1 = subtract$1;
    var mat2d = Object.freeze({
        __proto__: null,
        create: create$1,
        clone: clone$1,
        copy: copy$1,
        identity: identity$1,
        fromValues: fromValues$1,
        set: set$1,
        invert: invert$1,
        determinant: determinant$1,
        multiply: multiply$1,
        rotate: rotate$1,
        scale: scale$1,
        translate: translate,
        fromRotation: fromRotation$1,
        fromScaling: fromScaling$1,
        fromTranslation: fromTranslation,
        str: str$1,
        frob: frob$1,
        add: add$1,
        subtract: subtract$1,
        multiplyScalar: multiplyScalar$1,
        multiplyScalarAndAdd: multiplyScalarAndAdd$1,
        exactEquals: exactEquals$1,
        equals: equals$2,
        mul: mul$1,
        sub: sub$1
    });
    function create$2() {
        var out = new ARRAY_TYPE(9);
        if (ARRAY_TYPE != Float32Array) {
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[5] = 0;
            out[6] = 0;
            out[7] = 0;
        }
        out[0] = 1;
        out[4] = 1;
        out[8] = 1;
        return out;
    }
    function fromMat4(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[4];
        out[4] = a[5];
        out[5] = a[6];
        out[6] = a[8];
        out[7] = a[9];
        out[8] = a[10];
        return out;
    }
    function clone$2(a) {
        var out = new ARRAY_TYPE(9);
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        out[8] = a[8];
        return out;
    }
    function copy$2(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        out[8] = a[8];
        return out;
    }
    function fromValues$2(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
        var out = new ARRAY_TYPE(9);
        out[0] = m00;
        out[1] = m01;
        out[2] = m02;
        out[3] = m10;
        out[4] = m11;
        out[5] = m12;
        out[6] = m20;
        out[7] = m21;
        out[8] = m22;
        return out;
    }
    function set$2(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
        out[0] = m00;
        out[1] = m01;
        out[2] = m02;
        out[3] = m10;
        out[4] = m11;
        out[5] = m12;
        out[6] = m20;
        out[7] = m21;
        out[8] = m22;
        return out;
    }
    function identity$2(out) {
        out[0] = 1;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 1;
        out[5] = 0;
        out[6] = 0;
        out[7] = 0;
        out[8] = 1;
        return out;
    }
    function transpose$1(out, a) {
        if (out === a) {
            var a01 = a[1], a02 = a[2], a12 = a[5];
            out[1] = a[3];
            out[2] = a[6];
            out[3] = a01;
            out[5] = a[7];
            out[6] = a02;
            out[7] = a12;
        }
        else {
            out[0] = a[0];
            out[1] = a[3];
            out[2] = a[6];
            out[3] = a[1];
            out[4] = a[4];
            out[5] = a[7];
            out[6] = a[2];
            out[7] = a[5];
            out[8] = a[8];
        }
        return out;
    }
    function invert$2(out, a) {
        var a00 = a[0], a01 = a[1], a02 = a[2];
        var a10 = a[3], a11 = a[4], a12 = a[5];
        var a20 = a[6], a21 = a[7], a22 = a[8];
        var b01 = a22 * a11 - a12 * a21;
        var b11 = -a22 * a10 + a12 * a20;
        var b21 = a21 * a10 - a11 * a20;
        var det = a00 * b01 + a01 * b11 + a02 * b21;
        if (!det) {
            return null;
        }
        det = 1.0 / det;
        out[0] = b01 * det;
        out[1] = (-a22 * a01 + a02 * a21) * det;
        out[2] = (a12 * a01 - a02 * a11) * det;
        out[3] = b11 * det;
        out[4] = (a22 * a00 - a02 * a20) * det;
        out[5] = (-a12 * a00 + a02 * a10) * det;
        out[6] = b21 * det;
        out[7] = (-a21 * a00 + a01 * a20) * det;
        out[8] = (a11 * a00 - a01 * a10) * det;
        return out;
    }
    function adjoint$1(out, a) {
        var a00 = a[0], a01 = a[1], a02 = a[2];
        var a10 = a[3], a11 = a[4], a12 = a[5];
        var a20 = a[6], a21 = a[7], a22 = a[8];
        out[0] = a11 * a22 - a12 * a21;
        out[1] = a02 * a21 - a01 * a22;
        out[2] = a01 * a12 - a02 * a11;
        out[3] = a12 * a20 - a10 * a22;
        out[4] = a00 * a22 - a02 * a20;
        out[5] = a02 * a10 - a00 * a12;
        out[6] = a10 * a21 - a11 * a20;
        out[7] = a01 * a20 - a00 * a21;
        out[8] = a00 * a11 - a01 * a10;
        return out;
    }
    function determinant$2(a) {
        var a00 = a[0], a01 = a[1], a02 = a[2];
        var a10 = a[3], a11 = a[4], a12 = a[5];
        var a20 = a[6], a21 = a[7], a22 = a[8];
        return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
    }
    function multiply$2(out, a, b) {
        var a00 = a[0], a01 = a[1], a02 = a[2];
        var a10 = a[3], a11 = a[4], a12 = a[5];
        var a20 = a[6], a21 = a[7], a22 = a[8];
        var b00 = b[0], b01 = b[1], b02 = b[2];
        var b10 = b[3], b11 = b[4], b12 = b[5];
        var b20 = b[6], b21 = b[7], b22 = b[8];
        out[0] = b00 * a00 + b01 * a10 + b02 * a20;
        out[1] = b00 * a01 + b01 * a11 + b02 * a21;
        out[2] = b00 * a02 + b01 * a12 + b02 * a22;
        out[3] = b10 * a00 + b11 * a10 + b12 * a20;
        out[4] = b10 * a01 + b11 * a11 + b12 * a21;
        out[5] = b10 * a02 + b11 * a12 + b12 * a22;
        out[6] = b20 * a00 + b21 * a10 + b22 * a20;
        out[7] = b20 * a01 + b21 * a11 + b22 * a21;
        out[8] = b20 * a02 + b21 * a12 + b22 * a22;
        return out;
    }
    function translate$1(out, a, v) {
        var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], x = v[0], y = v[1];
        out[0] = a00;
        out[1] = a01;
        out[2] = a02;
        out[3] = a10;
        out[4] = a11;
        out[5] = a12;
        out[6] = x * a00 + y * a10 + a20;
        out[7] = x * a01 + y * a11 + a21;
        out[8] = x * a02 + y * a12 + a22;
        return out;
    }
    function rotate$2(out, a, rad) {
        var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], s = Math.sin(rad), c = Math.cos(rad);
        out[0] = c * a00 + s * a10;
        out[1] = c * a01 + s * a11;
        out[2] = c * a02 + s * a12;
        out[3] = c * a10 - s * a00;
        out[4] = c * a11 - s * a01;
        out[5] = c * a12 - s * a02;
        out[6] = a20;
        out[7] = a21;
        out[8] = a22;
        return out;
    }
    function scale$2(out, a, v) {
        var x = v[0], y = v[1];
        out[0] = x * a[0];
        out[1] = x * a[1];
        out[2] = x * a[2];
        out[3] = y * a[3];
        out[4] = y * a[4];
        out[5] = y * a[5];
        out[6] = a[6];
        out[7] = a[7];
        out[8] = a[8];
        return out;
    }
    function fromTranslation$1(out, v) {
        out[0] = 1;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 1;
        out[5] = 0;
        out[6] = v[0];
        out[7] = v[1];
        out[8] = 1;
        return out;
    }
    function fromRotation$2(out, rad) {
        var s = Math.sin(rad), c = Math.cos(rad);
        out[0] = c;
        out[1] = s;
        out[2] = 0;
        out[3] = -s;
        out[4] = c;
        out[5] = 0;
        out[6] = 0;
        out[7] = 0;
        out[8] = 1;
        return out;
    }
    function fromScaling$2(out, v) {
        out[0] = v[0];
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = v[1];
        out[5] = 0;
        out[6] = 0;
        out[7] = 0;
        out[8] = 1;
        return out;
    }
    function fromMat2d(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = 0;
        out[3] = a[2];
        out[4] = a[3];
        out[5] = 0;
        out[6] = a[4];
        out[7] = a[5];
        out[8] = 1;
        return out;
    }
    function fromQuat(out, q) {
        var x = q[0], y = q[1], z = q[2], w = q[3];
        var x2 = x + x;
        var y2 = y + y;
        var z2 = z + z;
        var xx = x * x2;
        var yx = y * x2;
        var yy = y * y2;
        var zx = z * x2;
        var zy = z * y2;
        var zz = z * z2;
        var wx = w * x2;
        var wy = w * y2;
        var wz = w * z2;
        out[0] = 1 - yy - zz;
        out[3] = yx - wz;
        out[6] = zx + wy;
        out[1] = yx + wz;
        out[4] = 1 - xx - zz;
        out[7] = zy - wx;
        out[2] = zx - wy;
        out[5] = zy + wx;
        out[8] = 1 - xx - yy;
        return out;
    }
    function normalFromMat4(out, a) {
        var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        var b00 = a00 * a11 - a01 * a10;
        var b01 = a00 * a12 - a02 * a10;
        var b02 = a00 * a13 - a03 * a10;
        var b03 = a01 * a12 - a02 * a11;
        var b04 = a01 * a13 - a03 * a11;
        var b05 = a02 * a13 - a03 * a12;
        var b06 = a20 * a31 - a21 * a30;
        var b07 = a20 * a32 - a22 * a30;
        var b08 = a20 * a33 - a23 * a30;
        var b09 = a21 * a32 - a22 * a31;
        var b10 = a21 * a33 - a23 * a31;
        var b11 = a22 * a33 - a23 * a32;
        var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        if (!det) {
            return null;
        }
        det = 1.0 / det;
        out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        return out;
    }
    function projection(out, width, height) {
        out[0] = 2 / width;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = -2 / height;
        out[5] = 0;
        out[6] = -1;
        out[7] = 1;
        out[8] = 1;
        return out;
    }
    function str$2(a) {
        return "mat3(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ")";
    }
    function frob$2(a) {
        return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
    }
    function add$2(out, a, b) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        out[3] = a[3] + b[3];
        out[4] = a[4] + b[4];
        out[5] = a[5] + b[5];
        out[6] = a[6] + b[6];
        out[7] = a[7] + b[7];
        out[8] = a[8] + b[8];
        return out;
    }
    function subtract$2(out, a, b) {
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        out[3] = a[3] - b[3];
        out[4] = a[4] - b[4];
        out[5] = a[5] - b[5];
        out[6] = a[6] - b[6];
        out[7] = a[7] - b[7];
        out[8] = a[8] - b[8];
        return out;
    }
    function multiplyScalar$2(out, a, b) {
        out[0] = a[0] * b;
        out[1] = a[1] * b;
        out[2] = a[2] * b;
        out[3] = a[3] * b;
        out[4] = a[4] * b;
        out[5] = a[5] * b;
        out[6] = a[6] * b;
        out[7] = a[7] * b;
        out[8] = a[8] * b;
        return out;
    }
    function multiplyScalarAndAdd$2(out, a, b, scale) {
        out[0] = a[0] + b[0] * scale;
        out[1] = a[1] + b[1] * scale;
        out[2] = a[2] + b[2] * scale;
        out[3] = a[3] + b[3] * scale;
        out[4] = a[4] + b[4] * scale;
        out[5] = a[5] + b[5] * scale;
        out[6] = a[6] + b[6] * scale;
        out[7] = a[7] + b[7] * scale;
        out[8] = a[8] + b[8] * scale;
        return out;
    }
    function exactEquals$2(a, b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8];
    }
    function equals$3(a, b) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7], a8 = a[8];
        var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8];
        return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8));
    }
    var mul$2 = multiply$2;
    var sub$2 = subtract$2;
    var mat3 = Object.freeze({
        __proto__: null,
        create: create$2,
        fromMat4: fromMat4,
        clone: clone$2,
        copy: copy$2,
        fromValues: fromValues$2,
        set: set$2,
        identity: identity$2,
        transpose: transpose$1,
        invert: invert$2,
        adjoint: adjoint$1,
        determinant: determinant$2,
        multiply: multiply$2,
        translate: translate$1,
        rotate: rotate$2,
        scale: scale$2,
        fromTranslation: fromTranslation$1,
        fromRotation: fromRotation$2,
        fromScaling: fromScaling$2,
        fromMat2d: fromMat2d,
        fromQuat: fromQuat,
        normalFromMat4: normalFromMat4,
        projection: projection,
        str: str$2,
        frob: frob$2,
        add: add$2,
        subtract: subtract$2,
        multiplyScalar: multiplyScalar$2,
        multiplyScalarAndAdd: multiplyScalarAndAdd$2,
        exactEquals: exactEquals$2,
        equals: equals$3,
        mul: mul$2,
        sub: sub$2
    });
    function create$3() {
        var out = new ARRAY_TYPE(16);
        if (ARRAY_TYPE != Float32Array) {
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 0;
            out[6] = 0;
            out[7] = 0;
            out[8] = 0;
            out[9] = 0;
            out[11] = 0;
            out[12] = 0;
            out[13] = 0;
            out[14] = 0;
        }
        out[0] = 1;
        out[5] = 1;
        out[10] = 1;
        out[15] = 1;
        return out;
    }
    function clone$3(a) {
        var out = new ARRAY_TYPE(16);
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        out[8] = a[8];
        out[9] = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    }
    function copy$3(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        out[8] = a[8];
        out[9] = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    }
    function fromValues$3(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
        var out = new ARRAY_TYPE(16);
        out[0] = m00;
        out[1] = m01;
        out[2] = m02;
        out[3] = m03;
        out[4] = m10;
        out[5] = m11;
        out[6] = m12;
        out[7] = m13;
        out[8] = m20;
        out[9] = m21;
        out[10] = m22;
        out[11] = m23;
        out[12] = m30;
        out[13] = m31;
        out[14] = m32;
        out[15] = m33;
        return out;
    }
    function set$3(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
        out[0] = m00;
        out[1] = m01;
        out[2] = m02;
        out[3] = m03;
        out[4] = m10;
        out[5] = m11;
        out[6] = m12;
        out[7] = m13;
        out[8] = m20;
        out[9] = m21;
        out[10] = m22;
        out[11] = m23;
        out[12] = m30;
        out[13] = m31;
        out[14] = m32;
        out[15] = m33;
        return out;
    }
    function identity$3(out) {
        out[0] = 1;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = 1;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = 1;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;
        return out;
    }
    function transpose$2(out, a) {
        if (out === a) {
            var a01 = a[1], a02 = a[2], a03 = a[3];
            var a12 = a[6], a13 = a[7];
            var a23 = a[11];
            out[1] = a[4];
            out[2] = a[8];
            out[3] = a[12];
            out[4] = a01;
            out[6] = a[9];
            out[7] = a[13];
            out[8] = a02;
            out[9] = a12;
            out[11] = a[14];
            out[12] = a03;
            out[13] = a13;
            out[14] = a23;
        }
        else {
            out[0] = a[0];
            out[1] = a[4];
            out[2] = a[8];
            out[3] = a[12];
            out[4] = a[1];
            out[5] = a[5];
            out[6] = a[9];
            out[7] = a[13];
            out[8] = a[2];
            out[9] = a[6];
            out[10] = a[10];
            out[11] = a[14];
            out[12] = a[3];
            out[13] = a[7];
            out[14] = a[11];
            out[15] = a[15];
        }
        return out;
    }
    function invert$3(out, a) {
        var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        var b00 = a00 * a11 - a01 * a10;
        var b01 = a00 * a12 - a02 * a10;
        var b02 = a00 * a13 - a03 * a10;
        var b03 = a01 * a12 - a02 * a11;
        var b04 = a01 * a13 - a03 * a11;
        var b05 = a02 * a13 - a03 * a12;
        var b06 = a20 * a31 - a21 * a30;
        var b07 = a20 * a32 - a22 * a30;
        var b08 = a20 * a33 - a23 * a30;
        var b09 = a21 * a32 - a22 * a31;
        var b10 = a21 * a33 - a23 * a31;
        var b11 = a22 * a33 - a23 * a32;
        var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        if (!det) {
            return null;
        }
        det = 1.0 / det;
        out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
        return out;
    }
    function adjoint$2(out, a) {
        var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
        out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
        out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
        out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
        out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
        out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
        out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
        out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
        out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
        out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
        out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
        out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
        out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
        out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
        out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
        out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
        return out;
    }
    function determinant$3(a) {
        var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        var b00 = a00 * a11 - a01 * a10;
        var b01 = a00 * a12 - a02 * a10;
        var b02 = a00 * a13 - a03 * a10;
        var b03 = a01 * a12 - a02 * a11;
        var b04 = a01 * a13 - a03 * a11;
        var b05 = a02 * a13 - a03 * a12;
        var b06 = a20 * a31 - a21 * a30;
        var b07 = a20 * a32 - a22 * a30;
        var b08 = a20 * a33 - a23 * a30;
        var b09 = a21 * a32 - a22 * a31;
        var b10 = a21 * a33 - a23 * a31;
        var b11 = a22 * a33 - a23 * a32;
        return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    }
    function multiply$3(out, a, b) {
        var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = b[4];
        b1 = b[5];
        b2 = b[6];
        b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = b[8];
        b1 = b[9];
        b2 = b[10];
        b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = b[12];
        b1 = b[13];
        b2 = b[14];
        b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        return out;
    }
    function translate$2(out, a, v) {
        var x = v[0], y = v[1], z = v[2];
        var a00, a01, a02, a03;
        var a10, a11, a12, a13;
        var a20, a21, a22, a23;
        if (a === out) {
            out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
            out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
            out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
            out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        }
        else {
            a00 = a[0];
            a01 = a[1];
            a02 = a[2];
            a03 = a[3];
            a10 = a[4];
            a11 = a[5];
            a12 = a[6];
            a13 = a[7];
            a20 = a[8];
            a21 = a[9];
            a22 = a[10];
            a23 = a[11];
            out[0] = a00;
            out[1] = a01;
            out[2] = a02;
            out[3] = a03;
            out[4] = a10;
            out[5] = a11;
            out[6] = a12;
            out[7] = a13;
            out[8] = a20;
            out[9] = a21;
            out[10] = a22;
            out[11] = a23;
            out[12] = a00 * x + a10 * y + a20 * z + a[12];
            out[13] = a01 * x + a11 * y + a21 * z + a[13];
            out[14] = a02 * x + a12 * y + a22 * z + a[14];
            out[15] = a03 * x + a13 * y + a23 * z + a[15];
        }
        return out;
    }
    function scale$3(out, a, v) {
        var x = v[0], y = v[1], z = v[2];
        out[0] = a[0] * x;
        out[1] = a[1] * x;
        out[2] = a[2] * x;
        out[3] = a[3] * x;
        out[4] = a[4] * y;
        out[5] = a[5] * y;
        out[6] = a[6] * y;
        out[7] = a[7] * y;
        out[8] = a[8] * z;
        out[9] = a[9] * z;
        out[10] = a[10] * z;
        out[11] = a[11] * z;
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    }
    function rotate$3(out, a, rad, axis) {
        var x = axis[0], y = axis[1], z = axis[2];
        var len = Math.hypot(x, y, z);
        var s, c, t;
        var a00, a01, a02, a03;
        var a10, a11, a12, a13;
        var a20, a21, a22, a23;
        var b00, b01, b02;
        var b10, b11, b12;
        var b20, b21, b22;
        if (len < EPSILON) {
            return null;
        }
        len = 1 / len;
        x *= len;
        y *= len;
        z *= len;
        s = Math.sin(rad);
        c = Math.cos(rad);
        t = 1 - c;
        a00 = a[0];
        a01 = a[1];
        a02 = a[2];
        a03 = a[3];
        a10 = a[4];
        a11 = a[5];
        a12 = a[6];
        a13 = a[7];
        a20 = a[8];
        a21 = a[9];
        a22 = a[10];
        a23 = a[11];
        b00 = x * x * t + c;
        b01 = y * x * t + z * s;
        b02 = z * x * t - y * s;
        b10 = x * y * t - z * s;
        b11 = y * y * t + c;
        b12 = z * y * t + x * s;
        b20 = x * z * t + y * s;
        b21 = y * z * t - x * s;
        b22 = z * z * t + c;
        out[0] = a00 * b00 + a10 * b01 + a20 * b02;
        out[1] = a01 * b00 + a11 * b01 + a21 * b02;
        out[2] = a02 * b00 + a12 * b01 + a22 * b02;
        out[3] = a03 * b00 + a13 * b01 + a23 * b02;
        out[4] = a00 * b10 + a10 * b11 + a20 * b12;
        out[5] = a01 * b10 + a11 * b11 + a21 * b12;
        out[6] = a02 * b10 + a12 * b11 + a22 * b12;
        out[7] = a03 * b10 + a13 * b11 + a23 * b12;
        out[8] = a00 * b20 + a10 * b21 + a20 * b22;
        out[9] = a01 * b20 + a11 * b21 + a21 * b22;
        out[10] = a02 * b20 + a12 * b21 + a22 * b22;
        out[11] = a03 * b20 + a13 * b21 + a23 * b22;
        if (a !== out) {
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
        }
        return out;
    }
    function rotateX(out, a, rad) {
        var s = Math.sin(rad);
        var c = Math.cos(rad);
        var a10 = a[4];
        var a11 = a[5];
        var a12 = a[6];
        var a13 = a[7];
        var a20 = a[8];
        var a21 = a[9];
        var a22 = a[10];
        var a23 = a[11];
        if (a !== out) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
        }
        out[4] = a10 * c + a20 * s;
        out[5] = a11 * c + a21 * s;
        out[6] = a12 * c + a22 * s;
        out[7] = a13 * c + a23 * s;
        out[8] = a20 * c - a10 * s;
        out[9] = a21 * c - a11 * s;
        out[10] = a22 * c - a12 * s;
        out[11] = a23 * c - a13 * s;
        return out;
    }
    function rotateY(out, a, rad) {
        var s = Math.sin(rad);
        var c = Math.cos(rad);
        var a00 = a[0];
        var a01 = a[1];
        var a02 = a[2];
        var a03 = a[3];
        var a20 = a[8];
        var a21 = a[9];
        var a22 = a[10];
        var a23 = a[11];
        if (a !== out) {
            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];
            out[7] = a[7];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
        }
        out[0] = a00 * c - a20 * s;
        out[1] = a01 * c - a21 * s;
        out[2] = a02 * c - a22 * s;
        out[3] = a03 * c - a23 * s;
        out[8] = a00 * s + a20 * c;
        out[9] = a01 * s + a21 * c;
        out[10] = a02 * s + a22 * c;
        out[11] = a03 * s + a23 * c;
        return out;
    }
    function rotateZ(out, a, rad) {
        var s = Math.sin(rad);
        var c = Math.cos(rad);
        var a00 = a[0];
        var a01 = a[1];
        var a02 = a[2];
        var a03 = a[3];
        var a10 = a[4];
        var a11 = a[5];
        var a12 = a[6];
        var a13 = a[7];
        if (a !== out) {
            out[8] = a[8];
            out[9] = a[9];
            out[10] = a[10];
            out[11] = a[11];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
        }
        out[0] = a00 * c + a10 * s;
        out[1] = a01 * c + a11 * s;
        out[2] = a02 * c + a12 * s;
        out[3] = a03 * c + a13 * s;
        out[4] = a10 * c - a00 * s;
        out[5] = a11 * c - a01 * s;
        out[6] = a12 * c - a02 * s;
        out[7] = a13 * c - a03 * s;
        return out;
    }
    function fromTranslation$2(out, v) {
        out[0] = 1;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = 1;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = 1;
        out[11] = 0;
        out[12] = v[0];
        out[13] = v[1];
        out[14] = v[2];
        out[15] = 1;
        return out;
    }
    function fromScaling$3(out, v) {
        out[0] = v[0];
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = v[1];
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = v[2];
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;
        return out;
    }
    function fromRotation$3(out, rad, axis) {
        var x = axis[0], y = axis[1], z = axis[2];
        var len = Math.hypot(x, y, z);
        var s, c, t;
        if (len < EPSILON) {
            return null;
        }
        len = 1 / len;
        x *= len;
        y *= len;
        z *= len;
        s = Math.sin(rad);
        c = Math.cos(rad);
        t = 1 - c;
        out[0] = x * x * t + c;
        out[1] = y * x * t + z * s;
        out[2] = z * x * t - y * s;
        out[3] = 0;
        out[4] = x * y * t - z * s;
        out[5] = y * y * t + c;
        out[6] = z * y * t + x * s;
        out[7] = 0;
        out[8] = x * z * t + y * s;
        out[9] = y * z * t - x * s;
        out[10] = z * z * t + c;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;
        return out;
    }
    function fromXRotation(out, rad) {
        var s = Math.sin(rad);
        var c = Math.cos(rad);
        out[0] = 1;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = c;
        out[6] = s;
        out[7] = 0;
        out[8] = 0;
        out[9] = -s;
        out[10] = c;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;
        return out;
    }
    function fromYRotation(out, rad) {
        var s = Math.sin(rad);
        var c = Math.cos(rad);
        out[0] = c;
        out[1] = 0;
        out[2] = -s;
        out[3] = 0;
        out[4] = 0;
        out[5] = 1;
        out[6] = 0;
        out[7] = 0;
        out[8] = s;
        out[9] = 0;
        out[10] = c;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;
        return out;
    }
    function fromZRotation(out, rad) {
        var s = Math.sin(rad);
        var c = Math.cos(rad);
        out[0] = c;
        out[1] = s;
        out[2] = 0;
        out[3] = 0;
        out[4] = -s;
        out[5] = c;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = 1;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;
        return out;
    }
    function fromRotationTranslation(out, q, v) {
        var x = q[0], y = q[1], z = q[2], w = q[3];
        var x2 = x + x;
        var y2 = y + y;
        var z2 = z + z;
        var xx = x * x2;
        var xy = x * y2;
        var xz = x * z2;
        var yy = y * y2;
        var yz = y * z2;
        var zz = z * z2;
        var wx = w * x2;
        var wy = w * y2;
        var wz = w * z2;
        out[0] = 1 - (yy + zz);
        out[1] = xy + wz;
        out[2] = xz - wy;
        out[3] = 0;
        out[4] = xy - wz;
        out[5] = 1 - (xx + zz);
        out[6] = yz + wx;
        out[7] = 0;
        out[8] = xz + wy;
        out[9] = yz - wx;
        out[10] = 1 - (xx + yy);
        out[11] = 0;
        out[12] = v[0];
        out[13] = v[1];
        out[14] = v[2];
        out[15] = 1;
        return out;
    }
    function fromQuat2(out, a) {
        var translation = new ARRAY_TYPE(3);
        var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7];
        var magnitude = bx * bx + by * by + bz * bz + bw * bw;
        if (magnitude > 0) {
            translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
            translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
            translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
        }
        else {
            translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
            translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
            translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
        }
        fromRotationTranslation(out, a, translation);
        return out;
    }
    function getTranslation(out, mat) {
        out[0] = mat[12];
        out[1] = mat[13];
        out[2] = mat[14];
        return out;
    }
    function getScaling(out, mat) {
        var m11 = mat[0];
        var m12 = mat[1];
        var m13 = mat[2];
        var m21 = mat[4];
        var m22 = mat[5];
        var m23 = mat[6];
        var m31 = mat[8];
        var m32 = mat[9];
        var m33 = mat[10];
        out[0] = Math.hypot(m11, m12, m13);
        out[1] = Math.hypot(m21, m22, m23);
        out[2] = Math.hypot(m31, m32, m33);
        return out;
    }
    function getRotation(out, mat) {
        var scaling = new ARRAY_TYPE(3);
        getScaling(scaling, mat);
        var is1 = 1 / scaling[0];
        var is2 = 1 / scaling[1];
        var is3 = 1 / scaling[2];
        var sm11 = mat[0] * is1;
        var sm12 = mat[1] * is2;
        var sm13 = mat[2] * is3;
        var sm21 = mat[4] * is1;
        var sm22 = mat[5] * is2;
        var sm23 = mat[6] * is3;
        var sm31 = mat[8] * is1;
        var sm32 = mat[9] * is2;
        var sm33 = mat[10] * is3;
        var trace = sm11 + sm22 + sm33;
        var S = 0;
        if (trace > 0) {
            S = Math.sqrt(trace + 1.0) * 2;
            out[3] = 0.25 * S;
            out[0] = (sm23 - sm32) / S;
            out[1] = (sm31 - sm13) / S;
            out[2] = (sm12 - sm21) / S;
        }
        else if (sm11 > sm22 && sm11 > sm33) {
            S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
            out[3] = (sm23 - sm32) / S;
            out[0] = 0.25 * S;
            out[1] = (sm12 + sm21) / S;
            out[2] = (sm31 + sm13) / S;
        }
        else if (sm22 > sm33) {
            S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
            out[3] = (sm31 - sm13) / S;
            out[0] = (sm12 + sm21) / S;
            out[1] = 0.25 * S;
            out[2] = (sm23 + sm32) / S;
        }
        else {
            S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
            out[3] = (sm12 - sm21) / S;
            out[0] = (sm31 + sm13) / S;
            out[1] = (sm23 + sm32) / S;
            out[2] = 0.25 * S;
        }
        return out;
    }
    function fromRotationTranslationScale(out, q, v, s) {
        var x = q[0], y = q[1], z = q[2], w = q[3];
        var x2 = x + x;
        var y2 = y + y;
        var z2 = z + z;
        var xx = x * x2;
        var xy = x * y2;
        var xz = x * z2;
        var yy = y * y2;
        var yz = y * z2;
        var zz = z * z2;
        var wx = w * x2;
        var wy = w * y2;
        var wz = w * z2;
        var sx = s[0];
        var sy = s[1];
        var sz = s[2];
        out[0] = (1 - (yy + zz)) * sx;
        out[1] = (xy + wz) * sx;
        out[2] = (xz - wy) * sx;
        out[3] = 0;
        out[4] = (xy - wz) * sy;
        out[5] = (1 - (xx + zz)) * sy;
        out[6] = (yz + wx) * sy;
        out[7] = 0;
        out[8] = (xz + wy) * sz;
        out[9] = (yz - wx) * sz;
        out[10] = (1 - (xx + yy)) * sz;
        out[11] = 0;
        out[12] = v[0];
        out[13] = v[1];
        out[14] = v[2];
        out[15] = 1;
        return out;
    }
    function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
        var x = q[0], y = q[1], z = q[2], w = q[3];
        var x2 = x + x;
        var y2 = y + y;
        var z2 = z + z;
        var xx = x * x2;
        var xy = x * y2;
        var xz = x * z2;
        var yy = y * y2;
        var yz = y * z2;
        var zz = z * z2;
        var wx = w * x2;
        var wy = w * y2;
        var wz = w * z2;
        var sx = s[0];
        var sy = s[1];
        var sz = s[2];
        var ox = o[0];
        var oy = o[1];
        var oz = o[2];
        var out0 = (1 - (yy + zz)) * sx;
        var out1 = (xy + wz) * sx;
        var out2 = (xz - wy) * sx;
        var out4 = (xy - wz) * sy;
        var out5 = (1 - (xx + zz)) * sy;
        var out6 = (yz + wx) * sy;
        var out8 = (xz + wy) * sz;
        var out9 = (yz - wx) * sz;
        var out10 = (1 - (xx + yy)) * sz;
        out[0] = out0;
        out[1] = out1;
        out[2] = out2;
        out[3] = 0;
        out[4] = out4;
        out[5] = out5;
        out[6] = out6;
        out[7] = 0;
        out[8] = out8;
        out[9] = out9;
        out[10] = out10;
        out[11] = 0;
        out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
        out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
        out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
        out[15] = 1;
        return out;
    }
    function fromQuat$1(out, q) {
        var x = q[0], y = q[1], z = q[2], w = q[3];
        var x2 = x + x;
        var y2 = y + y;
        var z2 = z + z;
        var xx = x * x2;
        var yx = y * x2;
        var yy = y * y2;
        var zx = z * x2;
        var zy = z * y2;
        var zz = z * z2;
        var wx = w * x2;
        var wy = w * y2;
        var wz = w * z2;
        out[0] = 1 - yy - zz;
        out[1] = yx + wz;
        out[2] = zx - wy;
        out[3] = 0;
        out[4] = yx - wz;
        out[5] = 1 - xx - zz;
        out[6] = zy + wx;
        out[7] = 0;
        out[8] = zx + wy;
        out[9] = zy - wx;
        out[10] = 1 - xx - yy;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;
        return out;
    }
    function frustum(out, left, right, bottom, top, near, far) {
        var rl = 1 / (right - left);
        var tb = 1 / (top - bottom);
        var nf = 1 / (near - far);
        out[0] = near * 2 * rl;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = near * 2 * tb;
        out[6] = 0;
        out[7] = 0;
        out[8] = (right + left) * rl;
        out[9] = (top + bottom) * tb;
        out[10] = (far + near) * nf;
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[14] = far * near * 2 * nf;
        out[15] = 0;
        return out;
    }
    function perspective(out, fovy, aspect, near, far) {
        var f = 1.0 / Math.tan(fovy / 2), nf;
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[15] = 0;
        if (far != null && far !== Infinity) {
            nf = 1 / (near - far);
            out[10] = (far + near) * nf;
            out[14] = 2 * far * near * nf;
        }
        else {
            out[10] = -1;
            out[14] = -2 * near;
        }
        return out;
    }
    function perspectiveFromFieldOfView(out, fov, near, far) {
        var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
        var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
        var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
        var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
        var xScale = 2.0 / (leftTan + rightTan);
        var yScale = 2.0 / (upTan + downTan);
        out[0] = xScale;
        out[1] = 0.0;
        out[2] = 0.0;
        out[3] = 0.0;
        out[4] = 0.0;
        out[5] = yScale;
        out[6] = 0.0;
        out[7] = 0.0;
        out[8] = -((leftTan - rightTan) * xScale * 0.5);
        out[9] = (upTan - downTan) * yScale * 0.5;
        out[10] = far / (near - far);
        out[11] = -1.0;
        out[12] = 0.0;
        out[13] = 0.0;
        out[14] = far * near / (near - far);
        out[15] = 0.0;
        return out;
    }
    function ortho(out, left, right, bottom, top, near, far) {
        var lr = 1 / (left - right);
        var bt = 1 / (bottom - top);
        var nf = 1 / (near - far);
        out[0] = -2 * lr;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = -2 * bt;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = 2 * nf;
        out[11] = 0;
        out[12] = (left + right) * lr;
        out[13] = (top + bottom) * bt;
        out[14] = (far + near) * nf;
        out[15] = 1;
        return out;
    }
    function lookAt(out, eye, center, up) {
        var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
        var eyex = eye[0];
        var eyey = eye[1];
        var eyez = eye[2];
        var upx = up[0];
        var upy = up[1];
        var upz = up[2];
        var centerx = center[0];
        var centery = center[1];
        var centerz = center[2];
        if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
            return identity$3(out);
        }
        z0 = eyex - centerx;
        z1 = eyey - centery;
        z2 = eyez - centerz;
        len = 1 / Math.hypot(z0, z1, z2);
        z0 *= len;
        z1 *= len;
        z2 *= len;
        x0 = upy * z2 - upz * z1;
        x1 = upz * z0 - upx * z2;
        x2 = upx * z1 - upy * z0;
        len = Math.hypot(x0, x1, x2);
        if (!len) {
            x0 = 0;
            x1 = 0;
            x2 = 0;
        }
        else {
            len = 1 / len;
            x0 *= len;
            x1 *= len;
            x2 *= len;
        }
        y0 = z1 * x2 - z2 * x1;
        y1 = z2 * x0 - z0 * x2;
        y2 = z0 * x1 - z1 * x0;
        len = Math.hypot(y0, y1, y2);
        if (!len) {
            y0 = 0;
            y1 = 0;
            y2 = 0;
        }
        else {
            len = 1 / len;
            y0 *= len;
            y1 *= len;
            y2 *= len;
        }
        out[0] = x0;
        out[1] = y0;
        out[2] = z0;
        out[3] = 0;
        out[4] = x1;
        out[5] = y1;
        out[6] = z1;
        out[7] = 0;
        out[8] = x2;
        out[9] = y2;
        out[10] = z2;
        out[11] = 0;
        out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
        out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
        out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
        out[15] = 1;
        return out;
    }
    function targetTo(out, eye, target, up) {
        var eyex = eye[0], eyey = eye[1], eyez = eye[2], upx = up[0], upy = up[1], upz = up[2];
        var z0 = eyex - target[0], z1 = eyey - target[1], z2 = eyez - target[2];
        var len = z0 * z0 + z1 * z1 + z2 * z2;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
            z0 *= len;
            z1 *= len;
            z2 *= len;
        }
        var x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
        len = x0 * x0 + x1 * x1 + x2 * x2;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
            x0 *= len;
            x1 *= len;
            x2 *= len;
        }
        out[0] = x0;
        out[1] = x1;
        out[2] = x2;
        out[3] = 0;
        out[4] = z1 * x2 - z2 * x1;
        out[5] = z2 * x0 - z0 * x2;
        out[6] = z0 * x1 - z1 * x0;
        out[7] = 0;
        out[8] = z0;
        out[9] = z1;
        out[10] = z2;
        out[11] = 0;
        out[12] = eyex;
        out[13] = eyey;
        out[14] = eyez;
        out[15] = 1;
        return out;
    }
    function str$3(a) {
        return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
    }
    function frob$3(a) {
        return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
    }
    function add$3(out, a, b) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        out[3] = a[3] + b[3];
        out[4] = a[4] + b[4];
        out[5] = a[5] + b[5];
        out[6] = a[6] + b[6];
        out[7] = a[7] + b[7];
        out[8] = a[8] + b[8];
        out[9] = a[9] + b[9];
        out[10] = a[10] + b[10];
        out[11] = a[11] + b[11];
        out[12] = a[12] + b[12];
        out[13] = a[13] + b[13];
        out[14] = a[14] + b[14];
        out[15] = a[15] + b[15];
        return out;
    }
    function subtract$3(out, a, b) {
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        out[3] = a[3] - b[3];
        out[4] = a[4] - b[4];
        out[5] = a[5] - b[5];
        out[6] = a[6] - b[6];
        out[7] = a[7] - b[7];
        out[8] = a[8] - b[8];
        out[9] = a[9] - b[9];
        out[10] = a[10] - b[10];
        out[11] = a[11] - b[11];
        out[12] = a[12] - b[12];
        out[13] = a[13] - b[13];
        out[14] = a[14] - b[14];
        out[15] = a[15] - b[15];
        return out;
    }
    function multiplyScalar$3(out, a, b) {
        out[0] = a[0] * b;
        out[1] = a[1] * b;
        out[2] = a[2] * b;
        out[3] = a[3] * b;
        out[4] = a[4] * b;
        out[5] = a[5] * b;
        out[6] = a[6] * b;
        out[7] = a[7] * b;
        out[8] = a[8] * b;
        out[9] = a[9] * b;
        out[10] = a[10] * b;
        out[11] = a[11] * b;
        out[12] = a[12] * b;
        out[13] = a[13] * b;
        out[14] = a[14] * b;
        out[15] = a[15] * b;
        return out;
    }
    function multiplyScalarAndAdd$3(out, a, b, scale) {
        out[0] = a[0] + b[0] * scale;
        out[1] = a[1] + b[1] * scale;
        out[2] = a[2] + b[2] * scale;
        out[3] = a[3] + b[3] * scale;
        out[4] = a[4] + b[4] * scale;
        out[5] = a[5] + b[5] * scale;
        out[6] = a[6] + b[6] * scale;
        out[7] = a[7] + b[7] * scale;
        out[8] = a[8] + b[8] * scale;
        out[9] = a[9] + b[9] * scale;
        out[10] = a[10] + b[10] * scale;
        out[11] = a[11] + b[11] * scale;
        out[12] = a[12] + b[12] * scale;
        out[13] = a[13] + b[13] * scale;
        out[14] = a[14] + b[14] * scale;
        out[15] = a[15] + b[15] * scale;
        return out;
    }
    function exactEquals$3(a, b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
    }
    function equals$4(a, b) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
        var a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7];
        var a8 = a[8], a9 = a[9], a10 = a[10], a11 = a[11];
        var a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
        var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        var b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7];
        var b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11];
        var b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
        return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15));
    }
    var mul$3 = multiply$3;
    var sub$3 = subtract$3;
    var mat4 = Object.freeze({
        __proto__: null,
        create: create$3,
        clone: clone$3,
        copy: copy$3,
        fromValues: fromValues$3,
        set: set$3,
        identity: identity$3,
        transpose: transpose$2,
        invert: invert$3,
        adjoint: adjoint$2,
        determinant: determinant$3,
        multiply: multiply$3,
        translate: translate$2,
        scale: scale$3,
        rotate: rotate$3,
        rotateX: rotateX,
        rotateY: rotateY,
        rotateZ: rotateZ,
        fromTranslation: fromTranslation$2,
        fromScaling: fromScaling$3,
        fromRotation: fromRotation$3,
        fromXRotation: fromXRotation,
        fromYRotation: fromYRotation,
        fromZRotation: fromZRotation,
        fromRotationTranslation: fromRotationTranslation,
        fromQuat2: fromQuat2,
        getTranslation: getTranslation,
        getScaling: getScaling,
        getRotation: getRotation,
        fromRotationTranslationScale: fromRotationTranslationScale,
        fromRotationTranslationScaleOrigin: fromRotationTranslationScaleOrigin,
        fromQuat: fromQuat$1,
        frustum: frustum,
        perspective: perspective,
        perspectiveFromFieldOfView: perspectiveFromFieldOfView,
        ortho: ortho,
        lookAt: lookAt,
        targetTo: targetTo,
        str: str$3,
        frob: frob$3,
        add: add$3,
        subtract: subtract$3,
        multiplyScalar: multiplyScalar$3,
        multiplyScalarAndAdd: multiplyScalarAndAdd$3,
        exactEquals: exactEquals$3,
        equals: equals$4,
        mul: mul$3,
        sub: sub$3
    });
    function create$4() {
        var out = new ARRAY_TYPE(3);
        if (ARRAY_TYPE != Float32Array) {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
        }
        return out;
    }
    function clone$4(a) {
        var out = new ARRAY_TYPE(3);
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        return out;
    }
    function length(a) {
        var x = a[0];
        var y = a[1];
        var z = a[2];
        return Math.hypot(x, y, z);
    }
    function fromValues$4(x, y, z) {
        var out = new ARRAY_TYPE(3);
        out[0] = x;
        out[1] = y;
        out[2] = z;
        return out;
    }
    function copy$4(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        return out;
    }
    function set$4(out, x, y, z) {
        out[0] = x;
        out[1] = y;
        out[2] = z;
        return out;
    }
    function add$4(out, a, b) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        return out;
    }
    function subtract$4(out, a, b) {
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        return out;
    }
    function multiply$4(out, a, b) {
        out[0] = a[0] * b[0];
        out[1] = a[1] * b[1];
        out[2] = a[2] * b[2];
        return out;
    }
    function divide(out, a, b) {
        out[0] = a[0] / b[0];
        out[1] = a[1] / b[1];
        out[2] = a[2] / b[2];
        return out;
    }
    function ceil(out, a) {
        out[0] = Math.ceil(a[0]);
        out[1] = Math.ceil(a[1]);
        out[2] = Math.ceil(a[2]);
        return out;
    }
    function floor(out, a) {
        out[0] = Math.floor(a[0]);
        out[1] = Math.floor(a[1]);
        out[2] = Math.floor(a[2]);
        return out;
    }
    function min(out, a, b) {
        out[0] = Math.min(a[0], b[0]);
        out[1] = Math.min(a[1], b[1]);
        out[2] = Math.min(a[2], b[2]);
        return out;
    }
    function max(out, a, b) {
        out[0] = Math.max(a[0], b[0]);
        out[1] = Math.max(a[1], b[1]);
        out[2] = Math.max(a[2], b[2]);
        return out;
    }
    function round(out, a) {
        out[0] = Math.round(a[0]);
        out[1] = Math.round(a[1]);
        out[2] = Math.round(a[2]);
        return out;
    }
    function scale$4(out, a, b) {
        out[0] = a[0] * b;
        out[1] = a[1] * b;
        out[2] = a[2] * b;
        return out;
    }
    function scaleAndAdd(out, a, b, scale) {
        out[0] = a[0] + b[0] * scale;
        out[1] = a[1] + b[1] * scale;
        out[2] = a[2] + b[2] * scale;
        return out;
    }
    function distance(a, b) {
        var x = b[0] - a[0];
        var y = b[1] - a[1];
        var z = b[2] - a[2];
        return Math.hypot(x, y, z);
    }
    function squaredDistance(a, b) {
        var x = b[0] - a[0];
        var y = b[1] - a[1];
        var z = b[2] - a[2];
        return x * x + y * y + z * z;
    }
    function squaredLength(a) {
        var x = a[0];
        var y = a[1];
        var z = a[2];
        return x * x + y * y + z * z;
    }
    function negate(out, a) {
        out[0] = -a[0];
        out[1] = -a[1];
        out[2] = -a[2];
        return out;
    }
    function inverse(out, a) {
        out[0] = 1.0 / a[0];
        out[1] = 1.0 / a[1];
        out[2] = 1.0 / a[2];
        return out;
    }
    function normalize(out, a) {
        var x = a[0];
        var y = a[1];
        var z = a[2];
        var len = x * x + y * y + z * z;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
        }
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
        return out;
    }
    function dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
    function cross(out, a, b) {
        var ax = a[0], ay = a[1], az = a[2];
        var bx = b[0], by = b[1], bz = b[2];
        out[0] = ay * bz - az * by;
        out[1] = az * bx - ax * bz;
        out[2] = ax * by - ay * bx;
        return out;
    }
    function lerp(out, a, b, t) {
        var ax = a[0];
        var ay = a[1];
        var az = a[2];
        out[0] = ax + t * (b[0] - ax);
        out[1] = ay + t * (b[1] - ay);
        out[2] = az + t * (b[2] - az);
        return out;
    }
    function hermite(out, a, b, c, d, t) {
        var factorTimes2 = t * t;
        var factor1 = factorTimes2 * (2 * t - 3) + 1;
        var factor2 = factorTimes2 * (t - 2) + t;
        var factor3 = factorTimes2 * (t - 1);
        var factor4 = factorTimes2 * (3 - 2 * t);
        out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
        out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
        out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
        return out;
    }
    function bezier(out, a, b, c, d, t) {
        var inverseFactor = 1 - t;
        var inverseFactorTimesTwo = inverseFactor * inverseFactor;
        var factorTimes2 = t * t;
        var factor1 = inverseFactorTimesTwo * inverseFactor;
        var factor2 = 3 * t * inverseFactorTimesTwo;
        var factor3 = 3 * factorTimes2 * inverseFactor;
        var factor4 = factorTimes2 * t;
        out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
        out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
        out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
        return out;
    }
    function random(out, scale) {
        scale = scale || 1.0;
        var r = RANDOM() * 2.0 * Math.PI;
        var z = RANDOM() * 2.0 - 1.0;
        var zScale = Math.sqrt(1.0 - z * z) * scale;
        out[0] = Math.cos(r) * zScale;
        out[1] = Math.sin(r) * zScale;
        out[2] = z * scale;
        return out;
    }
    function transformMat4(out, a, m) {
        var x = a[0], y = a[1], z = a[2];
        var w = m[3] * x + m[7] * y + m[11] * z + m[15];
        w = w || 1.0;
        out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
        out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
        out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
        return out;
    }
    function transformMat3(out, a, m) {
        var x = a[0], y = a[1], z = a[2];
        out[0] = x * m[0] + y * m[3] + z * m[6];
        out[1] = x * m[1] + y * m[4] + z * m[7];
        out[2] = x * m[2] + y * m[5] + z * m[8];
        return out;
    }
    function transformQuat(out, a, q) {
        var qx = q[0], qy = q[1], qz = q[2], qw = q[3];
        var x = a[0], y = a[1], z = a[2];
        var uvx = qy * z - qz * y, uvy = qz * x - qx * z, uvz = qx * y - qy * x;
        var uuvx = qy * uvz - qz * uvy, uuvy = qz * uvx - qx * uvz, uuvz = qx * uvy - qy * uvx;
        var w2 = qw * 2;
        uvx *= w2;
        uvy *= w2;
        uvz *= w2;
        uuvx *= 2;
        uuvy *= 2;
        uuvz *= 2;
        out[0] = x + uvx + uuvx;
        out[1] = y + uvy + uuvy;
        out[2] = z + uvz + uuvz;
        return out;
    }
    function rotateX$1(out, a, b, rad) {
        var p = [], r = [];
        p[0] = a[0] - b[0];
        p[1] = a[1] - b[1];
        p[2] = a[2] - b[2];
        r[0] = p[0];
        r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
        r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);
        out[0] = r[0] + b[0];
        out[1] = r[1] + b[1];
        out[2] = r[2] + b[2];
        return out;
    }
    function rotateY$1(out, a, b, rad) {
        var p = [], r = [];
        p[0] = a[0] - b[0];
        p[1] = a[1] - b[1];
        p[2] = a[2] - b[2];
        r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
        r[1] = p[1];
        r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);
        out[0] = r[0] + b[0];
        out[1] = r[1] + b[1];
        out[2] = r[2] + b[2];
        return out;
    }
    function rotateZ$1(out, a, b, rad) {
        var p = [], r = [];
        p[0] = a[0] - b[0];
        p[1] = a[1] - b[1];
        p[2] = a[2] - b[2];
        r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
        r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
        r[2] = p[2];
        out[0] = r[0] + b[0];
        out[1] = r[1] + b[1];
        out[2] = r[2] + b[2];
        return out;
    }
    function angle(a, b) {
        var ax = a[0], ay = a[1], az = a[2], bx = b[0], by = b[1], bz = b[2], mag1 = Math.sqrt(ax * ax + ay * ay + az * az), mag2 = Math.sqrt(bx * bx + by * by + bz * bz), mag = mag1 * mag2, cosine = mag && dot(a, b) / mag;
        return Math.acos(Math.min(Math.max(cosine, -1), 1));
    }
    function zero(out) {
        out[0] = 0.0;
        out[1] = 0.0;
        out[2] = 0.0;
        return out;
    }
    function str$4(a) {
        return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
    }
    function exactEquals$4(a, b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    }
    function equals$5(a, b) {
        var a0 = a[0], a1 = a[1], a2 = a[2];
        var b0 = b[0], b1 = b[1], b2 = b[2];
        return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
    }
    var sub$4 = subtract$4;
    var mul$4 = multiply$4;
    var div = divide;
    var dist = distance;
    var sqrDist = squaredDistance;
    var len = length;
    var sqrLen = squaredLength;
    var forEach = function () {
        var vec = create$4();
        return function (a, stride, offset, count, fn, arg) {
            var i, l;
            if (!stride) {
                stride = 3;
            }
            if (!offset) {
                offset = 0;
            }
            if (count) {
                l = Math.min(count * stride + offset, a.length);
            }
            else {
                l = a.length;
            }
            for (i = offset; i < l; i += stride) {
                vec[0] = a[i];
                vec[1] = a[i + 1];
                vec[2] = a[i + 2];
                fn(vec, vec, arg);
                a[i] = vec[0];
                a[i + 1] = vec[1];
                a[i + 2] = vec[2];
            }
            return a;
        };
    }();
    var vec3 = Object.freeze({
        __proto__: null,
        create: create$4,
        clone: clone$4,
        length: length,
        fromValues: fromValues$4,
        copy: copy$4,
        set: set$4,
        add: add$4,
        subtract: subtract$4,
        multiply: multiply$4,
        divide: divide,
        ceil: ceil,
        floor: floor,
        min: min,
        max: max,
        round: round,
        scale: scale$4,
        scaleAndAdd: scaleAndAdd,
        distance: distance,
        squaredDistance: squaredDistance,
        squaredLength: squaredLength,
        negate: negate,
        inverse: inverse,
        normalize: normalize,
        dot: dot,
        cross: cross,
        lerp: lerp,
        hermite: hermite,
        bezier: bezier,
        random: random,
        transformMat4: transformMat4,
        transformMat3: transformMat3,
        transformQuat: transformQuat,
        rotateX: rotateX$1,
        rotateY: rotateY$1,
        rotateZ: rotateZ$1,
        angle: angle,
        zero: zero,
        str: str$4,
        exactEquals: exactEquals$4,
        equals: equals$5,
        sub: sub$4,
        mul: mul$4,
        div: div,
        dist: dist,
        sqrDist: sqrDist,
        len: len,
        sqrLen: sqrLen,
        forEach: forEach
    });
    function create$5() {
        var out = new ARRAY_TYPE(4);
        if (ARRAY_TYPE != Float32Array) {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
        }
        return out;
    }
    function clone$5(a) {
        var out = new ARRAY_TYPE(4);
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        return out;
    }
    function fromValues$5(x, y, z, w) {
        var out = new ARRAY_TYPE(4);
        out[0] = x;
        out[1] = y;
        out[2] = z;
        out[3] = w;
        return out;
    }
    function copy$5(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        return out;
    }
    function set$5(out, x, y, z, w) {
        out[0] = x;
        out[1] = y;
        out[2] = z;
        out[3] = w;
        return out;
    }
    function add$5(out, a, b) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        out[3] = a[3] + b[3];
        return out;
    }
    function subtract$5(out, a, b) {
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        out[3] = a[3] - b[3];
        return out;
    }
    function multiply$5(out, a, b) {
        out[0] = a[0] * b[0];
        out[1] = a[1] * b[1];
        out[2] = a[2] * b[2];
        out[3] = a[3] * b[3];
        return out;
    }
    function divide$1(out, a, b) {
        out[0] = a[0] / b[0];
        out[1] = a[1] / b[1];
        out[2] = a[2] / b[2];
        out[3] = a[3] / b[3];
        return out;
    }
    function ceil$1(out, a) {
        out[0] = Math.ceil(a[0]);
        out[1] = Math.ceil(a[1]);
        out[2] = Math.ceil(a[2]);
        out[3] = Math.ceil(a[3]);
        return out;
    }
    function floor$1(out, a) {
        out[0] = Math.floor(a[0]);
        out[1] = Math.floor(a[1]);
        out[2] = Math.floor(a[2]);
        out[3] = Math.floor(a[3]);
        return out;
    }
    function min$1(out, a, b) {
        out[0] = Math.min(a[0], b[0]);
        out[1] = Math.min(a[1], b[1]);
        out[2] = Math.min(a[2], b[2]);
        out[3] = Math.min(a[3], b[3]);
        return out;
    }
    function max$1(out, a, b) {
        out[0] = Math.max(a[0], b[0]);
        out[1] = Math.max(a[1], b[1]);
        out[2] = Math.max(a[2], b[2]);
        out[3] = Math.max(a[3], b[3]);
        return out;
    }
    function round$1(out, a) {
        out[0] = Math.round(a[0]);
        out[1] = Math.round(a[1]);
        out[2] = Math.round(a[2]);
        out[3] = Math.round(a[3]);
        return out;
    }
    function scale$5(out, a, b) {
        out[0] = a[0] * b;
        out[1] = a[1] * b;
        out[2] = a[2] * b;
        out[3] = a[3] * b;
        return out;
    }
    function scaleAndAdd$1(out, a, b, scale) {
        out[0] = a[0] + b[0] * scale;
        out[1] = a[1] + b[1] * scale;
        out[2] = a[2] + b[2] * scale;
        out[3] = a[3] + b[3] * scale;
        return out;
    }
    function distance$1(a, b) {
        var x = b[0] - a[0];
        var y = b[1] - a[1];
        var z = b[2] - a[2];
        var w = b[3] - a[3];
        return Math.hypot(x, y, z, w);
    }
    function squaredDistance$1(a, b) {
        var x = b[0] - a[0];
        var y = b[1] - a[1];
        var z = b[2] - a[2];
        var w = b[3] - a[3];
        return x * x + y * y + z * z + w * w;
    }
    function length$1(a) {
        var x = a[0];
        var y = a[1];
        var z = a[2];
        var w = a[3];
        return Math.hypot(x, y, z, w);
    }
    function squaredLength$1(a) {
        var x = a[0];
        var y = a[1];
        var z = a[2];
        var w = a[3];
        return x * x + y * y + z * z + w * w;
    }
    function negate$1(out, a) {
        out[0] = -a[0];
        out[1] = -a[1];
        out[2] = -a[2];
        out[3] = -a[3];
        return out;
    }
    function inverse$1(out, a) {
        out[0] = 1.0 / a[0];
        out[1] = 1.0 / a[1];
        out[2] = 1.0 / a[2];
        out[3] = 1.0 / a[3];
        return out;
    }
    function normalize$1(out, a) {
        var x = a[0];
        var y = a[1];
        var z = a[2];
        var w = a[3];
        var len = x * x + y * y + z * z + w * w;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
        }
        out[0] = x * len;
        out[1] = y * len;
        out[2] = z * len;
        out[3] = w * len;
        return out;
    }
    function dot$1(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    }
    function cross$1(out, u, v, w) {
        var A = v[0] * w[1] - v[1] * w[0], B = v[0] * w[2] - v[2] * w[0], C = v[0] * w[3] - v[3] * w[0], D = v[1] * w[2] - v[2] * w[1], E = v[1] * w[3] - v[3] * w[1], F = v[2] * w[3] - v[3] * w[2];
        var G = u[0];
        var H = u[1];
        var I = u[2];
        var J = u[3];
        out[0] = H * F - I * E + J * D;
        out[1] = -(G * F) + I * C - J * B;
        out[2] = G * E - H * C + J * A;
        out[3] = -(G * D) + H * B - I * A;
        return out;
    }
    function lerp$1(out, a, b, t) {
        var ax = a[0];
        var ay = a[1];
        var az = a[2];
        var aw = a[3];
        out[0] = ax + t * (b[0] - ax);
        out[1] = ay + t * (b[1] - ay);
        out[2] = az + t * (b[2] - az);
        out[3] = aw + t * (b[3] - aw);
        return out;
    }
    function random$1(out, scale) {
        scale = scale || 1.0;
        var v1, v2, v3, v4;
        var s1, s2;
        do {
            v1 = RANDOM() * 2 - 1;
            v2 = RANDOM() * 2 - 1;
            s1 = v1 * v1 + v2 * v2;
        } while (s1 >= 1);
        do {
            v3 = RANDOM() * 2 - 1;
            v4 = RANDOM() * 2 - 1;
            s2 = v3 * v3 + v4 * v4;
        } while (s2 >= 1);
        var d = Math.sqrt((1 - s1) / s2);
        out[0] = scale * v1;
        out[1] = scale * v2;
        out[2] = scale * v3 * d;
        out[3] = scale * v4 * d;
        return out;
    }
    function transformMat4$1(out, a, m) {
        var x = a[0], y = a[1], z = a[2], w = a[3];
        out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
        out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
        out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
        out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
        return out;
    }
    function transformQuat$1(out, a, q) {
        var x = a[0], y = a[1], z = a[2];
        var qx = q[0], qy = q[1], qz = q[2], qw = q[3];
        var ix = qw * x + qy * z - qz * y;
        var iy = qw * y + qz * x - qx * z;
        var iz = qw * z + qx * y - qy * x;
        var iw = -qx * x - qy * y - qz * z;
        out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        out[3] = a[3];
        return out;
    }
    function zero$1(out) {
        out[0] = 0.0;
        out[1] = 0.0;
        out[2] = 0.0;
        out[3] = 0.0;
        return out;
    }
    function str$5(a) {
        return "vec4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
    }
    function exactEquals$5(a, b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
    }
    function equals$6(a, b) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
        var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
    }
    var sub$5 = subtract$5;
    var mul$5 = multiply$5;
    var div$1 = divide$1;
    var dist$1 = distance$1;
    var sqrDist$1 = squaredDistance$1;
    var len$1 = length$1;
    var sqrLen$1 = squaredLength$1;
    var forEach$1 = function () {
        var vec = create$5();
        return function (a, stride, offset, count, fn, arg) {
            var i, l;
            if (!stride) {
                stride = 4;
            }
            if (!offset) {
                offset = 0;
            }
            if (count) {
                l = Math.min(count * stride + offset, a.length);
            }
            else {
                l = a.length;
            }
            for (i = offset; i < l; i += stride) {
                vec[0] = a[i];
                vec[1] = a[i + 1];
                vec[2] = a[i + 2];
                vec[3] = a[i + 3];
                fn(vec, vec, arg);
                a[i] = vec[0];
                a[i + 1] = vec[1];
                a[i + 2] = vec[2];
                a[i + 3] = vec[3];
            }
            return a;
        };
    }();
    var vec4 = Object.freeze({
        __proto__: null,
        create: create$5,
        clone: clone$5,
        fromValues: fromValues$5,
        copy: copy$5,
        set: set$5,
        add: add$5,
        subtract: subtract$5,
        multiply: multiply$5,
        divide: divide$1,
        ceil: ceil$1,
        floor: floor$1,
        min: min$1,
        max: max$1,
        round: round$1,
        scale: scale$5,
        scaleAndAdd: scaleAndAdd$1,
        distance: distance$1,
        squaredDistance: squaredDistance$1,
        length: length$1,
        squaredLength: squaredLength$1,
        negate: negate$1,
        inverse: inverse$1,
        normalize: normalize$1,
        dot: dot$1,
        cross: cross$1,
        lerp: lerp$1,
        random: random$1,
        transformMat4: transformMat4$1,
        transformQuat: transformQuat$1,
        zero: zero$1,
        str: str$5,
        exactEquals: exactEquals$5,
        equals: equals$6,
        sub: sub$5,
        mul: mul$5,
        div: div$1,
        dist: dist$1,
        sqrDist: sqrDist$1,
        len: len$1,
        sqrLen: sqrLen$1,
        forEach: forEach$1
    });
    function create$6() {
        var out = new ARRAY_TYPE(4);
        if (ARRAY_TYPE != Float32Array) {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
        }
        out[3] = 1;
        return out;
    }
    function identity$4(out) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        return out;
    }
    function setAxisAngle(out, axis, rad) {
        rad = rad * 0.5;
        var s = Math.sin(rad);
        out[0] = s * axis[0];
        out[1] = s * axis[1];
        out[2] = s * axis[2];
        out[3] = Math.cos(rad);
        return out;
    }
    function getAxisAngle(out_axis, q) {
        var rad = Math.acos(q[3]) * 2.0;
        var s = Math.sin(rad / 2.0);
        if (s > EPSILON) {
            out_axis[0] = q[0] / s;
            out_axis[1] = q[1] / s;
            out_axis[2] = q[2] / s;
        }
        else {
            out_axis[0] = 1;
            out_axis[1] = 0;
            out_axis[2] = 0;
        }
        return rad;
    }
    function getAngle(a, b) {
        var dotproduct = dot$2(a, b);
        return Math.acos(2 * dotproduct * dotproduct - 1);
    }
    function multiply$6(out, a, b) {
        var ax = a[0], ay = a[1], az = a[2], aw = a[3];
        var bx = b[0], by = b[1], bz = b[2], bw = b[3];
        out[0] = ax * bw + aw * bx + ay * bz - az * by;
        out[1] = ay * bw + aw * by + az * bx - ax * bz;
        out[2] = az * bw + aw * bz + ax * by - ay * bx;
        out[3] = aw * bw - ax * bx - ay * by - az * bz;
        return out;
    }
    function rotateX$2(out, a, rad) {
        rad *= 0.5;
        var ax = a[0], ay = a[1], az = a[2], aw = a[3];
        var bx = Math.sin(rad), bw = Math.cos(rad);
        out[0] = ax * bw + aw * bx;
        out[1] = ay * bw + az * bx;
        out[2] = az * bw - ay * bx;
        out[3] = aw * bw - ax * bx;
        return out;
    }
    function rotateY$2(out, a, rad) {
        rad *= 0.5;
        var ax = a[0], ay = a[1], az = a[2], aw = a[3];
        var by = Math.sin(rad), bw = Math.cos(rad);
        out[0] = ax * bw - az * by;
        out[1] = ay * bw + aw * by;
        out[2] = az * bw + ax * by;
        out[3] = aw * bw - ay * by;
        return out;
    }
    function rotateZ$2(out, a, rad) {
        rad *= 0.5;
        var ax = a[0], ay = a[1], az = a[2], aw = a[3];
        var bz = Math.sin(rad), bw = Math.cos(rad);
        out[0] = ax * bw + ay * bz;
        out[1] = ay * bw - ax * bz;
        out[2] = az * bw + aw * bz;
        out[3] = aw * bw - az * bz;
        return out;
    }
    function calculateW(out, a) {
        var x = a[0], y = a[1], z = a[2];
        out[0] = x;
        out[1] = y;
        out[2] = z;
        out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
        return out;
    }
    function exp(out, a) {
        var x = a[0], y = a[1], z = a[2], w = a[3];
        var r = Math.sqrt(x * x + y * y + z * z);
        var et = Math.exp(w);
        var s = r > 0 ? et * Math.sin(r) / r : 0;
        out[0] = x * s;
        out[1] = y * s;
        out[2] = z * s;
        out[3] = et * Math.cos(r);
        return out;
    }
    function ln(out, a) {
        var x = a[0], y = a[1], z = a[2], w = a[3];
        var r = Math.sqrt(x * x + y * y + z * z);
        var t = r > 0 ? Math.atan2(r, w) / r : 0;
        out[0] = x * t;
        out[1] = y * t;
        out[2] = z * t;
        out[3] = 0.5 * Math.log(x * x + y * y + z * z + w * w);
        return out;
    }
    function pow(out, a, b) {
        ln(out, a);
        scale$6(out, out, b);
        exp(out, out);
        return out;
    }
    function slerp(out, a, b, t) {
        var ax = a[0], ay = a[1], az = a[2], aw = a[3];
        var bx = b[0], by = b[1], bz = b[2], bw = b[3];
        var omega, cosom, sinom, scale0, scale1;
        cosom = ax * bx + ay * by + az * bz + aw * bw;
        if (cosom < 0.0) {
            cosom = -cosom;
            bx = -bx;
            by = -by;
            bz = -bz;
            bw = -bw;
        }
        if (1.0 - cosom > EPSILON) {
            omega = Math.acos(cosom);
            sinom = Math.sin(omega);
            scale0 = Math.sin((1.0 - t) * omega) / sinom;
            scale1 = Math.sin(t * omega) / sinom;
        }
        else {
            scale0 = 1.0 - t;
            scale1 = t;
        }
        out[0] = scale0 * ax + scale1 * bx;
        out[1] = scale0 * ay + scale1 * by;
        out[2] = scale0 * az + scale1 * bz;
        out[3] = scale0 * aw + scale1 * bw;
        return out;
    }
    function random$2(out) {
        var u1 = RANDOM();
        var u2 = RANDOM();
        var u3 = RANDOM();
        var sqrt1MinusU1 = Math.sqrt(1 - u1);
        var sqrtU1 = Math.sqrt(u1);
        out[0] = sqrt1MinusU1 * Math.sin(2.0 * Math.PI * u2);
        out[1] = sqrt1MinusU1 * Math.cos(2.0 * Math.PI * u2);
        out[2] = sqrtU1 * Math.sin(2.0 * Math.PI * u3);
        out[3] = sqrtU1 * Math.cos(2.0 * Math.PI * u3);
        return out;
    }
    function invert$4(out, a) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
        var dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
        var invDot = dot ? 1.0 / dot : 0;
        out[0] = -a0 * invDot;
        out[1] = -a1 * invDot;
        out[2] = -a2 * invDot;
        out[3] = a3 * invDot;
        return out;
    }
    function conjugate(out, a) {
        out[0] = -a[0];
        out[1] = -a[1];
        out[2] = -a[2];
        out[3] = a[3];
        return out;
    }
    function fromMat3(out, m) {
        var fTrace = m[0] + m[4] + m[8];
        var fRoot;
        if (fTrace > 0.0) {
            fRoot = Math.sqrt(fTrace + 1.0);
            out[3] = 0.5 * fRoot;
            fRoot = 0.5 / fRoot;
            out[0] = (m[5] - m[7]) * fRoot;
            out[1] = (m[6] - m[2]) * fRoot;
            out[2] = (m[1] - m[3]) * fRoot;
        }
        else {
            var i = 0;
            if (m[4] > m[0])
                i = 1;
            if (m[8] > m[i * 3 + i])
                i = 2;
            var j = (i + 1) % 3;
            var k = (i + 2) % 3;
            fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
            out[i] = 0.5 * fRoot;
            fRoot = 0.5 / fRoot;
            out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
            out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
            out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
        }
        return out;
    }
    function fromEuler(out, x, y, z) {
        var halfToRad = 0.5 * Math.PI / 180.0;
        x *= halfToRad;
        y *= halfToRad;
        z *= halfToRad;
        var sx = Math.sin(x);
        var cx = Math.cos(x);
        var sy = Math.sin(y);
        var cy = Math.cos(y);
        var sz = Math.sin(z);
        var cz = Math.cos(z);
        out[0] = sx * cy * cz - cx * sy * sz;
        out[1] = cx * sy * cz + sx * cy * sz;
        out[2] = cx * cy * sz - sx * sy * cz;
        out[3] = cx * cy * cz + sx * sy * sz;
        return out;
    }
    function str$6(a) {
        return "quat(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
    }
    var clone$6 = clone$5;
    var fromValues$6 = fromValues$5;
    var copy$6 = copy$5;
    var set$6 = set$5;
    var add$6 = add$5;
    var mul$6 = multiply$6;
    var scale$6 = scale$5;
    var dot$2 = dot$1;
    var lerp$2 = lerp$1;
    var length$2 = length$1;
    var len$2 = length$2;
    var squaredLength$2 = squaredLength$1;
    var sqrLen$2 = squaredLength$2;
    var normalize$2 = normalize$1;
    var exactEquals$6 = exactEquals$5;
    var equals$7 = equals$6;
    var rotationTo = function () {
        var tmpvec3 = create$4();
        var xUnitVec3 = fromValues$4(1, 0, 0);
        var yUnitVec3 = fromValues$4(0, 1, 0);
        return function (out, a, b) {
            var dot$1 = dot(a, b);
            if (dot$1 < -0.999999) {
                cross(tmpvec3, xUnitVec3, a);
                if (len(tmpvec3) < 0.000001)
                    cross(tmpvec3, yUnitVec3, a);
                normalize(tmpvec3, tmpvec3);
                setAxisAngle(out, tmpvec3, Math.PI);
                return out;
            }
            else if (dot$1 > 0.999999) {
                out[0] = 0;
                out[1] = 0;
                out[2] = 0;
                out[3] = 1;
                return out;
            }
            else {
                cross(tmpvec3, a, b);
                out[0] = tmpvec3[0];
                out[1] = tmpvec3[1];
                out[2] = tmpvec3[2];
                out[3] = 1 + dot$1;
                return normalize$2(out, out);
            }
        };
    }();
    var sqlerp = function () {
        var temp1 = create$6();
        var temp2 = create$6();
        return function (out, a, b, c, d, t) {
            slerp(temp1, a, d, t);
            slerp(temp2, b, c, t);
            slerp(out, temp1, temp2, 2 * t * (1 - t));
            return out;
        };
    }();
    var setAxes = function () {
        var matr = create$2();
        return function (out, view, right, up) {
            matr[0] = right[0];
            matr[3] = right[1];
            matr[6] = right[2];
            matr[1] = up[0];
            matr[4] = up[1];
            matr[7] = up[2];
            matr[2] = -view[0];
            matr[5] = -view[1];
            matr[8] = -view[2];
            return normalize$2(out, fromMat3(out, matr));
        };
    }();
    var quat = Object.freeze({
        __proto__: null,
        create: create$6,
        identity: identity$4,
        setAxisAngle: setAxisAngle,
        getAxisAngle: getAxisAngle,
        getAngle: getAngle,
        multiply: multiply$6,
        rotateX: rotateX$2,
        rotateY: rotateY$2,
        rotateZ: rotateZ$2,
        calculateW: calculateW,
        exp: exp,
        ln: ln,
        pow: pow,
        slerp: slerp,
        random: random$2,
        invert: invert$4,
        conjugate: conjugate,
        fromMat3: fromMat3,
        fromEuler: fromEuler,
        str: str$6,
        clone: clone$6,
        fromValues: fromValues$6,
        copy: copy$6,
        set: set$6,
        add: add$6,
        mul: mul$6,
        scale: scale$6,
        dot: dot$2,
        lerp: lerp$2,
        length: length$2,
        len: len$2,
        squaredLength: squaredLength$2,
        sqrLen: sqrLen$2,
        normalize: normalize$2,
        exactEquals: exactEquals$6,
        equals: equals$7,
        rotationTo: rotationTo,
        sqlerp: sqlerp,
        setAxes: setAxes
    });
    function create$7() {
        var dq = new ARRAY_TYPE(8);
        if (ARRAY_TYPE != Float32Array) {
            dq[0] = 0;
            dq[1] = 0;
            dq[2] = 0;
            dq[4] = 0;
            dq[5] = 0;
            dq[6] = 0;
            dq[7] = 0;
        }
        dq[3] = 1;
        return dq;
    }
    function clone$7(a) {
        var dq = new ARRAY_TYPE(8);
        dq[0] = a[0];
        dq[1] = a[1];
        dq[2] = a[2];
        dq[3] = a[3];
        dq[4] = a[4];
        dq[5] = a[5];
        dq[6] = a[6];
        dq[7] = a[7];
        return dq;
    }
    function fromValues$7(x1, y1, z1, w1, x2, y2, z2, w2) {
        var dq = new ARRAY_TYPE(8);
        dq[0] = x1;
        dq[1] = y1;
        dq[2] = z1;
        dq[3] = w1;
        dq[4] = x2;
        dq[5] = y2;
        dq[6] = z2;
        dq[7] = w2;
        return dq;
    }
    function fromRotationTranslationValues(x1, y1, z1, w1, x2, y2, z2) {
        var dq = new ARRAY_TYPE(8);
        dq[0] = x1;
        dq[1] = y1;
        dq[2] = z1;
        dq[3] = w1;
        var ax = x2 * 0.5, ay = y2 * 0.5, az = z2 * 0.5;
        dq[4] = ax * w1 + ay * z1 - az * y1;
        dq[5] = ay * w1 + az * x1 - ax * z1;
        dq[6] = az * w1 + ax * y1 - ay * x1;
        dq[7] = -ax * x1 - ay * y1 - az * z1;
        return dq;
    }
    function fromRotationTranslation$1(out, q, t) {
        var ax = t[0] * 0.5, ay = t[1] * 0.5, az = t[2] * 0.5, bx = q[0], by = q[1], bz = q[2], bw = q[3];
        out[0] = bx;
        out[1] = by;
        out[2] = bz;
        out[3] = bw;
        out[4] = ax * bw + ay * bz - az * by;
        out[5] = ay * bw + az * bx - ax * bz;
        out[6] = az * bw + ax * by - ay * bx;
        out[7] = -ax * bx - ay * by - az * bz;
        return out;
    }
    function fromTranslation$3(out, t) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        out[4] = t[0] * 0.5;
        out[5] = t[1] * 0.5;
        out[6] = t[2] * 0.5;
        out[7] = 0;
        return out;
    }
    function fromRotation$4(out, q) {
        out[0] = q[0];
        out[1] = q[1];
        out[2] = q[2];
        out[3] = q[3];
        out[4] = 0;
        out[5] = 0;
        out[6] = 0;
        out[7] = 0;
        return out;
    }
    function fromMat4$1(out, a) {
        var outer = create$6();
        getRotation(outer, a);
        var t = new ARRAY_TYPE(3);
        getTranslation(t, a);
        fromRotationTranslation$1(out, outer, t);
        return out;
    }
    function copy$7(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        return out;
    }
    function identity$5(out) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        out[4] = 0;
        out[5] = 0;
        out[6] = 0;
        out[7] = 0;
        return out;
    }
    function set$7(out, x1, y1, z1, w1, x2, y2, z2, w2) {
        out[0] = x1;
        out[1] = y1;
        out[2] = z1;
        out[3] = w1;
        out[4] = x2;
        out[5] = y2;
        out[6] = z2;
        out[7] = w2;
        return out;
    }
    var getReal = copy$6;
    function getDual(out, a) {
        out[0] = a[4];
        out[1] = a[5];
        out[2] = a[6];
        out[3] = a[7];
        return out;
    }
    var setReal = copy$6;
    function setDual(out, q) {
        out[4] = q[0];
        out[5] = q[1];
        out[6] = q[2];
        out[7] = q[3];
        return out;
    }
    function getTranslation$1(out, a) {
        var ax = a[4], ay = a[5], az = a[6], aw = a[7], bx = -a[0], by = -a[1], bz = -a[2], bw = a[3];
        out[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
        out[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
        out[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
        return out;
    }
    function translate$3(out, a, v) {
        var ax1 = a[0], ay1 = a[1], az1 = a[2], aw1 = a[3], bx1 = v[0] * 0.5, by1 = v[1] * 0.5, bz1 = v[2] * 0.5, ax2 = a[4], ay2 = a[5], az2 = a[6], aw2 = a[7];
        out[0] = ax1;
        out[1] = ay1;
        out[2] = az1;
        out[3] = aw1;
        out[4] = aw1 * bx1 + ay1 * bz1 - az1 * by1 + ax2;
        out[5] = aw1 * by1 + az1 * bx1 - ax1 * bz1 + ay2;
        out[6] = aw1 * bz1 + ax1 * by1 - ay1 * bx1 + az2;
        out[7] = -ax1 * bx1 - ay1 * by1 - az1 * bz1 + aw2;
        return out;
    }
    function rotateX$3(out, a, rad) {
        var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7], ax1 = ax * bw + aw * bx + ay * bz - az * by, ay1 = ay * bw + aw * by + az * bx - ax * bz, az1 = az * bw + aw * bz + ax * by - ay * bx, aw1 = aw * bw - ax * bx - ay * by - az * bz;
        rotateX$2(out, a, rad);
        bx = out[0];
        by = out[1];
        bz = out[2];
        bw = out[3];
        out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
        out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
        out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
        out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
        return out;
    }
    function rotateY$3(out, a, rad) {
        var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7], ax1 = ax * bw + aw * bx + ay * bz - az * by, ay1 = ay * bw + aw * by + az * bx - ax * bz, az1 = az * bw + aw * bz + ax * by - ay * bx, aw1 = aw * bw - ax * bx - ay * by - az * bz;
        rotateY$2(out, a, rad);
        bx = out[0];
        by = out[1];
        bz = out[2];
        bw = out[3];
        out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
        out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
        out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
        out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
        return out;
    }
    function rotateZ$3(out, a, rad) {
        var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7], ax1 = ax * bw + aw * bx + ay * bz - az * by, ay1 = ay * bw + aw * by + az * bx - ax * bz, az1 = az * bw + aw * bz + ax * by - ay * bx, aw1 = aw * bw - ax * bx - ay * by - az * bz;
        rotateZ$2(out, a, rad);
        bx = out[0];
        by = out[1];
        bz = out[2];
        bw = out[3];
        out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
        out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
        out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
        out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
        return out;
    }
    function rotateByQuatAppend(out, a, q) {
        var qx = q[0], qy = q[1], qz = q[2], qw = q[3], ax = a[0], ay = a[1], az = a[2], aw = a[3];
        out[0] = ax * qw + aw * qx + ay * qz - az * qy;
        out[1] = ay * qw + aw * qy + az * qx - ax * qz;
        out[2] = az * qw + aw * qz + ax * qy - ay * qx;
        out[3] = aw * qw - ax * qx - ay * qy - az * qz;
        ax = a[4];
        ay = a[5];
        az = a[6];
        aw = a[7];
        out[4] = ax * qw + aw * qx + ay * qz - az * qy;
        out[5] = ay * qw + aw * qy + az * qx - ax * qz;
        out[6] = az * qw + aw * qz + ax * qy - ay * qx;
        out[7] = aw * qw - ax * qx - ay * qy - az * qz;
        return out;
    }
    function rotateByQuatPrepend(out, q, a) {
        var qx = q[0], qy = q[1], qz = q[2], qw = q[3], bx = a[0], by = a[1], bz = a[2], bw = a[3];
        out[0] = qx * bw + qw * bx + qy * bz - qz * by;
        out[1] = qy * bw + qw * by + qz * bx - qx * bz;
        out[2] = qz * bw + qw * bz + qx * by - qy * bx;
        out[3] = qw * bw - qx * bx - qy * by - qz * bz;
        bx = a[4];
        by = a[5];
        bz = a[6];
        bw = a[7];
        out[4] = qx * bw + qw * bx + qy * bz - qz * by;
        out[5] = qy * bw + qw * by + qz * bx - qx * bz;
        out[6] = qz * bw + qw * bz + qx * by - qy * bx;
        out[7] = qw * bw - qx * bx - qy * by - qz * bz;
        return out;
    }
    function rotateAroundAxis(out, a, axis, rad) {
        if (Math.abs(rad) < EPSILON) {
            return copy$7(out, a);
        }
        var axisLength = Math.hypot(axis[0], axis[1], axis[2]);
        rad = rad * 0.5;
        var s = Math.sin(rad);
        var bx = s * axis[0] / axisLength;
        var by = s * axis[1] / axisLength;
        var bz = s * axis[2] / axisLength;
        var bw = Math.cos(rad);
        var ax1 = a[0], ay1 = a[1], az1 = a[2], aw1 = a[3];
        out[0] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
        out[1] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
        out[2] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
        out[3] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
        var ax = a[4], ay = a[5], az = a[6], aw = a[7];
        out[4] = ax * bw + aw * bx + ay * bz - az * by;
        out[5] = ay * bw + aw * by + az * bx - ax * bz;
        out[6] = az * bw + aw * bz + ax * by - ay * bx;
        out[7] = aw * bw - ax * bx - ay * by - az * bz;
        return out;
    }
    function add$7(out, a, b) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        out[3] = a[3] + b[3];
        out[4] = a[4] + b[4];
        out[5] = a[5] + b[5];
        out[6] = a[6] + b[6];
        out[7] = a[7] + b[7];
        return out;
    }
    function multiply$7(out, a, b) {
        var ax0 = a[0], ay0 = a[1], az0 = a[2], aw0 = a[3], bx1 = b[4], by1 = b[5], bz1 = b[6], bw1 = b[7], ax1 = a[4], ay1 = a[5], az1 = a[6], aw1 = a[7], bx0 = b[0], by0 = b[1], bz0 = b[2], bw0 = b[3];
        out[0] = ax0 * bw0 + aw0 * bx0 + ay0 * bz0 - az0 * by0;
        out[1] = ay0 * bw0 + aw0 * by0 + az0 * bx0 - ax0 * bz0;
        out[2] = az0 * bw0 + aw0 * bz0 + ax0 * by0 - ay0 * bx0;
        out[3] = aw0 * bw0 - ax0 * bx0 - ay0 * by0 - az0 * bz0;
        out[4] = ax0 * bw1 + aw0 * bx1 + ay0 * bz1 - az0 * by1 + ax1 * bw0 + aw1 * bx0 + ay1 * bz0 - az1 * by0;
        out[5] = ay0 * bw1 + aw0 * by1 + az0 * bx1 - ax0 * bz1 + ay1 * bw0 + aw1 * by0 + az1 * bx0 - ax1 * bz0;
        out[6] = az0 * bw1 + aw0 * bz1 + ax0 * by1 - ay0 * bx1 + az1 * bw0 + aw1 * bz0 + ax1 * by0 - ay1 * bx0;
        out[7] = aw0 * bw1 - ax0 * bx1 - ay0 * by1 - az0 * bz1 + aw1 * bw0 - ax1 * bx0 - ay1 * by0 - az1 * bz0;
        return out;
    }
    var mul$7 = multiply$7;
    function scale$7(out, a, b) {
        out[0] = a[0] * b;
        out[1] = a[1] * b;
        out[2] = a[2] * b;
        out[3] = a[3] * b;
        out[4] = a[4] * b;
        out[5] = a[5] * b;
        out[6] = a[6] * b;
        out[7] = a[7] * b;
        return out;
    }
    var dot$3 = dot$2;
    function lerp$3(out, a, b, t) {
        var mt = 1 - t;
        if (dot$3(a, b) < 0)
            t = -t;
        out[0] = a[0] * mt + b[0] * t;
        out[1] = a[1] * mt + b[1] * t;
        out[2] = a[2] * mt + b[2] * t;
        out[3] = a[3] * mt + b[3] * t;
        out[4] = a[4] * mt + b[4] * t;
        out[5] = a[5] * mt + b[5] * t;
        out[6] = a[6] * mt + b[6] * t;
        out[7] = a[7] * mt + b[7] * t;
        return out;
    }
    function invert$5(out, a) {
        var sqlen = squaredLength$3(a);
        out[0] = -a[0] / sqlen;
        out[1] = -a[1] / sqlen;
        out[2] = -a[2] / sqlen;
        out[3] = a[3] / sqlen;
        out[4] = -a[4] / sqlen;
        out[5] = -a[5] / sqlen;
        out[6] = -a[6] / sqlen;
        out[7] = a[7] / sqlen;
        return out;
    }
    function conjugate$1(out, a) {
        out[0] = -a[0];
        out[1] = -a[1];
        out[2] = -a[2];
        out[3] = a[3];
        out[4] = -a[4];
        out[5] = -a[5];
        out[6] = -a[6];
        out[7] = a[7];
        return out;
    }
    var length$3 = length$2;
    var len$3 = length$3;
    var squaredLength$3 = squaredLength$2;
    var sqrLen$3 = squaredLength$3;
    function normalize$3(out, a) {
        var magnitude = squaredLength$3(a);
        if (magnitude > 0) {
            magnitude = Math.sqrt(magnitude);
            var a0 = a[0] / magnitude;
            var a1 = a[1] / magnitude;
            var a2 = a[2] / magnitude;
            var a3 = a[3] / magnitude;
            var b0 = a[4];
            var b1 = a[5];
            var b2 = a[6];
            var b3 = a[7];
            var a_dot_b = a0 * b0 + a1 * b1 + a2 * b2 + a3 * b3;
            out[0] = a0;
            out[1] = a1;
            out[2] = a2;
            out[3] = a3;
            out[4] = (b0 - a0 * a_dot_b) / magnitude;
            out[5] = (b1 - a1 * a_dot_b) / magnitude;
            out[6] = (b2 - a2 * a_dot_b) / magnitude;
            out[7] = (b3 - a3 * a_dot_b) / magnitude;
        }
        return out;
    }
    function str$7(a) {
        return "quat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ")";
    }
    function exactEquals$7(a, b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7];
    }
    function equals$8(a, b) {
        var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7];
        var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7];
        return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7));
    }
    var quat2 = Object.freeze({
        __proto__: null,
        create: create$7,
        clone: clone$7,
        fromValues: fromValues$7,
        fromRotationTranslationValues: fromRotationTranslationValues,
        fromRotationTranslation: fromRotationTranslation$1,
        fromTranslation: fromTranslation$3,
        fromRotation: fromRotation$4,
        fromMat4: fromMat4$1,
        copy: copy$7,
        identity: identity$5,
        set: set$7,
        getReal: getReal,
        getDual: getDual,
        setReal: setReal,
        setDual: setDual,
        getTranslation: getTranslation$1,
        translate: translate$3,
        rotateX: rotateX$3,
        rotateY: rotateY$3,
        rotateZ: rotateZ$3,
        rotateByQuatAppend: rotateByQuatAppend,
        rotateByQuatPrepend: rotateByQuatPrepend,
        rotateAroundAxis: rotateAroundAxis,
        add: add$7,
        multiply: multiply$7,
        mul: mul$7,
        scale: scale$7,
        dot: dot$3,
        lerp: lerp$3,
        invert: invert$5,
        conjugate: conjugate$1,
        length: length$3,
        len: len$3,
        squaredLength: squaredLength$3,
        sqrLen: sqrLen$3,
        normalize: normalize$3,
        str: str$7,
        exactEquals: exactEquals$7,
        equals: equals$8
    });
    function create$8() {
        var out = new ARRAY_TYPE(2);
        if (ARRAY_TYPE != Float32Array) {
            out[0] = 0;
            out[1] = 0;
        }
        return out;
    }
    function clone$8(a) {
        var out = new ARRAY_TYPE(2);
        out[0] = a[0];
        out[1] = a[1];
        return out;
    }
    function fromValues$8(x, y) {
        var out = new ARRAY_TYPE(2);
        out[0] = x;
        out[1] = y;
        return out;
    }
    function copy$8(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        return out;
    }
    function set$8(out, x, y) {
        out[0] = x;
        out[1] = y;
        return out;
    }
    function add$8(out, a, b) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        return out;
    }
    function subtract$6(out, a, b) {
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        return out;
    }
    function multiply$8(out, a, b) {
        out[0] = a[0] * b[0];
        out[1] = a[1] * b[1];
        return out;
    }
    function divide$2(out, a, b) {
        out[0] = a[0] / b[0];
        out[1] = a[1] / b[1];
        return out;
    }
    function ceil$2(out, a) {
        out[0] = Math.ceil(a[0]);
        out[1] = Math.ceil(a[1]);
        return out;
    }
    function floor$2(out, a) {
        out[0] = Math.floor(a[0]);
        out[1] = Math.floor(a[1]);
        return out;
    }
    function min$2(out, a, b) {
        out[0] = Math.min(a[0], b[0]);
        out[1] = Math.min(a[1], b[1]);
        return out;
    }
    function max$2(out, a, b) {
        out[0] = Math.max(a[0], b[0]);
        out[1] = Math.max(a[1], b[1]);
        return out;
    }
    function round$2(out, a) {
        out[0] = Math.round(a[0]);
        out[1] = Math.round(a[1]);
        return out;
    }
    function scale$8(out, a, b) {
        out[0] = a[0] * b;
        out[1] = a[1] * b;
        return out;
    }
    function scaleAndAdd$2(out, a, b, scale) {
        out[0] = a[0] + b[0] * scale;
        out[1] = a[1] + b[1] * scale;
        return out;
    }
    function distance$2(a, b) {
        var x = b[0] - a[0], y = b[1] - a[1];
        return Math.hypot(x, y);
    }
    function squaredDistance$2(a, b) {
        var x = b[0] - a[0], y = b[1] - a[1];
        return x * x + y * y;
    }
    function length$4(a) {
        var x = a[0], y = a[1];
        return Math.hypot(x, y);
    }
    function squaredLength$4(a) {
        var x = a[0], y = a[1];
        return x * x + y * y;
    }
    function negate$2(out, a) {
        out[0] = -a[0];
        out[1] = -a[1];
        return out;
    }
    function inverse$2(out, a) {
        out[0] = 1.0 / a[0];
        out[1] = 1.0 / a[1];
        return out;
    }
    function normalize$4(out, a) {
        var x = a[0], y = a[1];
        var len = x * x + y * y;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
        }
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        return out;
    }
    function dot$4(a, b) {
        return a[0] * b[0] + a[1] * b[1];
    }
    function cross$2(out, a, b) {
        var z = a[0] * b[1] - a[1] * b[0];
        out[0] = out[1] = 0;
        out[2] = z;
        return out;
    }
    function lerp$4(out, a, b, t) {
        var ax = a[0], ay = a[1];
        out[0] = ax + t * (b[0] - ax);
        out[1] = ay + t * (b[1] - ay);
        return out;
    }
    function random$3(out, scale) {
        scale = scale || 1.0;
        var r = RANDOM() * 2.0 * Math.PI;
        out[0] = Math.cos(r) * scale;
        out[1] = Math.sin(r) * scale;
        return out;
    }
    function transformMat2(out, a, m) {
        var x = a[0], y = a[1];
        out[0] = m[0] * x + m[2] * y;
        out[1] = m[1] * x + m[3] * y;
        return out;
    }
    function transformMat2d(out, a, m) {
        var x = a[0], y = a[1];
        out[0] = m[0] * x + m[2] * y + m[4];
        out[1] = m[1] * x + m[3] * y + m[5];
        return out;
    }
    function transformMat3$1(out, a, m) {
        var x = a[0], y = a[1];
        out[0] = m[0] * x + m[3] * y + m[6];
        out[1] = m[1] * x + m[4] * y + m[7];
        return out;
    }
    function transformMat4$2(out, a, m) {
        var x = a[0];
        var y = a[1];
        out[0] = m[0] * x + m[4] * y + m[12];
        out[1] = m[1] * x + m[5] * y + m[13];
        return out;
    }
    function rotate$4(out, a, b, rad) {
        var p0 = a[0] - b[0], p1 = a[1] - b[1], sinC = Math.sin(rad), cosC = Math.cos(rad);
        out[0] = p0 * cosC - p1 * sinC + b[0];
        out[1] = p0 * sinC + p1 * cosC + b[1];
        return out;
    }
    function angle$1(a, b) {
        var x1 = a[0], y1 = a[1], x2 = b[0], y2 = b[1], mag = Math.sqrt(x1 * x1 + y1 * y1) * Math.sqrt(x2 * x2 + y2 * y2), cosine = mag && (x1 * x2 + y1 * y2) / mag;
        return Math.acos(Math.min(Math.max(cosine, -1), 1));
    }
    function zero$2(out) {
        out[0] = 0.0;
        out[1] = 0.0;
        return out;
    }
    function str$8(a) {
        return "vec2(" + a[0] + ", " + a[1] + ")";
    }
    function exactEquals$8(a, b) {
        return a[0] === b[0] && a[1] === b[1];
    }
    function equals$9(a, b) {
        var a0 = a[0], a1 = a[1];
        var b0 = b[0], b1 = b[1];
        return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1));
    }
    var len$4 = length$4;
    var sub$6 = subtract$6;
    var mul$8 = multiply$8;
    var div$2 = divide$2;
    var dist$2 = distance$2;
    var sqrDist$2 = squaredDistance$2;
    var sqrLen$4 = squaredLength$4;
    var forEach$2 = function () {
        var vec = create$8();
        return function (a, stride, offset, count, fn, arg) {
            var i, l;
            if (!stride) {
                stride = 2;
            }
            if (!offset) {
                offset = 0;
            }
            if (count) {
                l = Math.min(count * stride + offset, a.length);
            }
            else {
                l = a.length;
            }
            for (i = offset; i < l; i += stride) {
                vec[0] = a[i];
                vec[1] = a[i + 1];
                fn(vec, vec, arg);
                a[i] = vec[0];
                a[i + 1] = vec[1];
            }
            return a;
        };
    }();
    var vec2 = Object.freeze({
        __proto__: null,
        create: create$8,
        clone: clone$8,
        fromValues: fromValues$8,
        copy: copy$8,
        set: set$8,
        add: add$8,
        subtract: subtract$6,
        multiply: multiply$8,
        divide: divide$2,
        ceil: ceil$2,
        floor: floor$2,
        min: min$2,
        max: max$2,
        round: round$2,
        scale: scale$8,
        scaleAndAdd: scaleAndAdd$2,
        distance: distance$2,
        squaredDistance: squaredDistance$2,
        length: length$4,
        squaredLength: squaredLength$4,
        negate: negate$2,
        inverse: inverse$2,
        normalize: normalize$4,
        dot: dot$4,
        cross: cross$2,
        lerp: lerp$4,
        random: random$3,
        transformMat2: transformMat2,
        transformMat2d: transformMat2d,
        transformMat3: transformMat3$1,
        transformMat4: transformMat4$2,
        rotate: rotate$4,
        angle: angle$1,
        zero: zero$2,
        str: str$8,
        exactEquals: exactEquals$8,
        equals: equals$9,
        len: len$4,
        sub: sub$6,
        mul: mul$8,
        div: div$2,
        dist: dist$2,
        sqrDist: sqrDist$2,
        sqrLen: sqrLen$4,
        forEach: forEach$2
    });
    exports.glMatrix = common;
    exports.mat2 = mat2;
    exports.mat2d = mat2d;
    exports.mat3 = mat3;
    exports.mat4 = mat4;
    exports.quat = quat;
    exports.quat2 = quat2;
    exports.vec2 = vec2;
    exports.vec3 = vec3;
    exports.vec4 = vec4;
    Object.defineProperty(exports, '__esModule', { value: true });
})));
class DataManager {
    constructor() {
        this.callbacks = [];
    }
    setupInstance(recieveCallback) {
        this.rc = recieveCallback;
        let socket = new ReconnectingWebSocket('ws://localhost:9003');
        socket.onmessage = (event) => {
            let data = JSON.parse(event.data);
            for (let i = 0, len = this.callbacks.length; i < len; ++i) {
                this.callbacks[i](data);
            }
            this.callbacks.length = 0;
            this.rc(data);
        };
        socket.onerror = (e) => {
            console.error(e);
        };
        this.socket = socket;
    }
    static get instance() {
        if (!DataManager.instanceObject) {
            DataManager.instanceObject = new DataManager();
        }
        return DataManager.instanceObject;
    }
    send(data, callbacks) {
        if (this.socket.readyState === 1) {
            if (Array.isArray(callbacks))
                for (let c of callbacks)
                    this.callbacks.push(callbacks);
            else if (callbacks)
                this.callbacks.push(callbacks);
            console.log('sending', data);
            this.socket.send(JSON.stringify(data));
        }
        else {
            setTimeout(() => {
                this.send(data, callbacks);
            }, 1000);
        }
    }
}
function HTMLElementType() {
    return undefined;
}
function HTMLInputElementType() {
    return undefined;
}
function SVGPathElementType() {
    return undefined;
}
function SVGAElementType() {
    return undefined;
}
function HTMLCanvasElementType() {
    return undefined;
}
const Symbols = {
    cross: '&#10005;',
    erase: '&#8612;',
};
class HTMLContainer {
    constructor() {
        this.elements = {};
    }
}
class HTMLComponent extends HTMLContainer {
    constructor() {
        super();
    }
    initElements() {
        for (let id in this.elements) {
            this.elements[id] = document.getElementById(id);
        }
        for (let id in this.components) {
            let comp = this.components[id];
            if (comp instanceof StaticHTMLComponent)
                comp.initElements();
        }
    }
    compile(parent) {
        let contents = this.render();
        parent.innerHTML += contents;
        this.initElements();
        this.setupComponents();
    }
    setupComponents() {
        for (let id in this.components) {
            let comp = this.components[id];
            if (comp instanceof StaticHTMLComponent)
                comp.setup();
            if (comp instanceof HTMLComponent)
                comp.setupComponents();
        }
    }
    appenToEnd(parent, html) {
        parent.insertAdjacentHTML("beforeend", html);
        return parent.lastElementChild;
    }
    toggleElement(elem) {
        if (elem.hasAttribute("data-active"))
            elem.removeAttribute("data-active");
        else
            elem.setAttribute("data-active", "");
    }
}
class StaticHTMLComponent extends HTMLComponent {
    constructor() {
        super();
    }
}
function nothing(ev) {
    ev.stopPropagation();
}
function nameFromPath(path) {
    return path.split("/").slice(-1)[0].split("\\").slice(-1)[0];
}
class FunctionItemComponent extends HTMLComponent {
    constructor(data) {
        super();
        this.data = data;
        this.label = data.title.toLowerCase() + ' '
            + data.description.join(' ').toLowerCase() + ' '
            + usesTypes(data).join(' ').toLowerCase();
    }
    render() {
        return `
        <div class="function">
            <div class="labels">
                <div class="title">${this.data.title}</div>
                <div class="description">${this.data.description}</div>
            </div>
        </div>  
        `;
    }
}
class FunctionPanelComponent extends StaticHTMLComponent {
    constructor() {
        super();
        this.elements = {
            functionSearchBar: HTMLElementType(),
            functionSearch: HTMLInputElementType(),
            clearFunctionSearch: HTMLElementType(),
            closeFunctionPanel: HTMLElementType(),
            functionReloadAction: HTMLElementType(),
            functionList: HTMLElementType()
        };
        this.functions = [];
    }
    render() {
        return `
        <div id="functionSearchBar">
            <label for="functionSearch">Search</label>
            <input type="text" id="functionSearch" name="functionSearch" placeholder="Node name or description">
            <div id="clearFunctionSearch">${Symbols.erase}</div>
            <div id="closeFunctionPanel">${Symbols.cross}</div>
        </div>
        <div id="functionActions">
            <div class="functionAction" id="functionReloadAction">Reaload Nodes</div>
            <div class="functionAction" id="functionNewScriptAction">New Script</div>
            <div class="functionAction" id="functionOpenFolderAction">Open Script Folder</div>
        </div>
        <div id="functionList"></div>
        `;
    }
    loadFunction(data) {
        let func = new FunctionItemComponent(data);
        let funcHTML = this.appenToEnd(this.elements.functionList, func.render());
        func.elements.function = funcHTML;
        this.functions.push(func);
        return funcHTML;
    }
    clearFunctionList() {
        this.functions = [];
        this.elements.functionList.innerHTML = "";
    }
    setup() {
        this.elements.functionSearch.onkeyup = (ev) => {
            let query = this.elements.functionSearch.value.toLowerCase();
            if (query == '')
                this.functions.map(v => v.elements.function.style.display = 'block');
            else
                this.functions.map(v => v.label.includes(query) ?
                    v.elements.function.style.display = 'block' :
                    v.elements.function.style.display = 'none');
        };
        this.elements.clearFunctionSearch.onclick = () => {
            this.elements.functionSearch.value = '';
            this.functions.map(v => v.elements.function.style.display = 'block');
        };
        this.elements.functionReloadAction.onclick = () => {
            this.clearFunctionList();
            DataManager.instance.send({
                'command': 'loadFunctions'
            });
        };
        this.elements.functionList.onwheel = (ev) => {
            ev.stopPropagation();
        };
        this.elements.closeFunctionPanel.onclick = (ev) => {
            this.toggleElement(NodeEditor.ui.elements.functionPanel);
        };
    }
}
class NodeEditorMenuComponent extends StaticHTMLComponent {
    constructor() {
        super();
        this.elements = {
            functionPanelButton: HTMLElementType(),
        };
    }
    render() {
        return `
        <div id="functionPanelButton">Nodes</div>
        `;
    }
    setup() {
        this.elements.functionPanelButton.onclick = (ev) => {
            this.toggleElement(NodeEditor.ui.elements.functionPanel);
        };
    }
}
class ApplicationMenuComponent extends StaticHTMLComponent {
    constructor() {
        super();
        this.elements = {
            openProjectButton: HTMLElementType(),
            saveProjectButton: HTMLElementType(),
            runProjectButton: HTMLElementType(),
            nodesButton: HTMLElementType(),
            viewerButton: HTMLElementType(),
            messageButton: HTMLElementType(),
        };
    }
    render() {
        return `
        <div id="openProjectButton">Open</div>
        <div id="saveProjectButton">Save</div>
        <div id="runProjectButton" class="delimiter">Run</div>
        <div id="nodesButton">Nodes</div>
        <div id="viewerButton">Viewer</div>
        <div id="messageButton">Messages</div>
        `;
    }
    setup() {
        this.elements.openProjectButton.onclick = (ev) => openProject();
        this.elements.saveProjectButton.onclick = (ev) => saveProject();
        this.elements.runProjectButton.onclick = (ev) => runProject();
        this.elements.nodesButton.onclick = () => {
            Application.ui.openNodeEditor();
        };
        this.elements.viewerButton.onclick = () => {
            Application.ui.openViewer();
        };
        this.elements.runProjectButton.onclick = () => runProject();
        this.elements.messageButton.onclick = () => {
            this.toggleElement(Application.ui.messages.elements.messagePanel);
        };
    }
}
class ConnectorHTMLContainer extends HTMLContainer {
    constructor(connector, node) {
        super();
        this.elements = {
            connector: HTMLElementType()
        };
        this.elements = {
            connector: connector
        };
        this.components = {
            node: node
        };
    }
    get pos() {
        let offTop = this.elements.connector.offsetTop;
        let offLeft = this.elements.connector.offsetLeft;
        let pos = this.components.node.pos;
        return {
            x: pos.x + offLeft + 20 / 2,
            y: pos.y + offTop + 20 / 2
        };
    }
}
class ConnectionHTMLContainer extends HTMLContainer {
    constructor(connection) {
        super();
        this.elements = {
            line: SVGPathElementType(),
            selectLine: SVGPathElementType()
        };
        this.connection = connection;
        this.elements.line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.elements.line.classList.add("connection");
        this.elements.selectLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.elements.selectLine.classList.add("fatline");
        this.elements.selectLine.onmousedown = (ev) => this.onmousedown(ev, connection);
    }
    redraw(inx, iny, outx, outy) {
        let handle = Math.min(Math.max((outy - iny) / 2 - 10, 0), 100);
        let startx = inx;
        let starty = iny;
        let endx = outx;
        let endy = outy;
        let d = 'M' + startx + ' ' + starty;
        d += ' C ' + (startx) + ' ' + (starty + handle) + ', ' + (endx) + ' ' + (endy - handle);
        d += ', ' + endx + ' ' + endy;
        this.elements.line.setAttribute('d', d);
        this.elements.selectLine.setAttribute('d', d);
    }
    remove() {
        this.elements.line.parentElement.removeChild(this.elements.line);
        this.elements.selectLine.parentElement.removeChild(this.elements.selectLine);
    }
    onmousedown(ev, connection) {
        if (connection.in && connection.out) {
            if (ev.button == 0) {
                let posIn = connection.in.connHTML.pos;
                let posOut = connection.out.connHTML.pos;
                let pos = NodeEditor.ui.mousePosition;
                let distIn = (posIn.x - pos.x) * (posIn.x - pos.x) + (posIn.y - pos.y) * (posIn.y - pos.y);
                let distOut = (posOut.x - pos.x) * (posOut.x - pos.x) + (posOut.y - pos.y) * (posOut.y - pos.y);
                connection.deregister();
                let source;
                if (distIn < distOut) {
                    connection.in = null;
                    source = connection.out;
                }
                else {
                    connection.out = null;
                    source = connection.in;
                }
                NodeEditor.instance.stageConnection(connection);
                this.move();
            }
            else if (ev.button == 2) {
                connection.remove();
            }
            ev.preventDefault();
            ev.stopPropagation();
        }
    }
    ;
    move() {
        let inpos, outpos;
        let pos = NodeEditor.ui.mousePosition;
        if (this.connection.in && this.connection.out) {
            inpos = this.connection.in.connHTML.pos;
            outpos = this.connection.out.connHTML.pos;
        }
        else if (this.connection.in) {
            inpos = this.connection.in.connHTML.pos;
            outpos = pos;
            this.redraw(pos.x, pos.y, inpos.x, inpos.y);
        }
        else if (this.connection.out) {
            inpos = pos;
            outpos = this.connection.out.connHTML.pos;
        }
        this.redraw(outpos.x, outpos.y, inpos.x, inpos.y);
    }
}
class ValueComponent {
}
;
function rw(text) {
    return text.replace(/\s/g, "");
}
class StringValueComponent extends ValueComponent {
    static title(value) {
        return `<label for="${rw(value.node.id + value.param)}"><span class="title string">${value.param}</span></label>`;
    }
    static value(value) {
        return `
        <div class="value string">
            <input type="text" id="${rw(value.node.id + value.param)}" name="${rw(value.node.id + value.param)}" value="${value.value}">
        </div>
        `;
    }
    static callback(value) {
        let input = document.getElementById(rw(value.node.id + value.param));
        input.onkeyup = (ev) => { value.value = input.value; };
        input.onmousedown = nothing;
        input.onmousemove = nothing;
    }
}
class NumberValueComponent extends ValueComponent {
    static title(value) {
        return `<label for="${rw(value.node.id + value.param)}"><span class="title number">${value.param}</span></label>`;
    }
    static value(value) {
        return `
        <div class="value number">
            <input type="number" id="${rw(value.node.id + value.param)}" name="${rw(value.node.id + value.param)}" value="${value.value}">
        </div>
        `;
    }
    static callback(value) {
        let input = document.getElementById(rw(value.node.id + value.param));
        input.onkeyup = (ev) => { value.value = input.value; };
        input.onmousedown = nothing;
        input.onmousemove = nothing;
    }
}
class SelectValueComponent extends ValueComponent {
    static title(value) {
        return `<label for="${rw(value.node.id + value.param)}"><span class="title select">${value.param}</span></label>`;
    }
    static value(value) {
        let options = value.optionals;
        return `
        <div class="value select">
            <select type="text" id="${rw(value.node.id + value.param)}" name="${rw(value.node.id + value.param)}" value="${value.value}">
                ${options.map(option => ` <option value="${option}" ${option == value.value ? 'selected' : ''}>${option}</option>`)}
            </select>
        </div>
        `;
    }
    static callback(value) {
        let selection = document.getElementById(rw(value.node.id + value.param));
        selection.onchange = (ev) => { value.value = selection.value; };
        selection.onmousedown = nothing;
        selection.onmousemove = nothing;
    }
}
class FileValueComponent extends ValueComponent {
    static title(value) {
        return `<label for="${rw(value.node.id + value.param)}"><span class="title file">${value.param}</span></label>`;
    }
    static value(value) {
        return `
        <div class="value file">
            <input type="button" id="${rw(value.node.id + value.param)}" name="${rw(value.node.id + value.param)}", value="${nameFromPath(value.value)}">
        </div>
        `;
    }
    static callback(value) {
        let file = document.getElementById(rw(value.node.id + value.param));
        file.onclick = (ev) => {
            let options = {
                defaultPath: value.value
            };
            dialog.showOpenDialog(options).then((result) => {
                let filename = result.filePaths[0];
                if (filename === undefined) {
                    return;
                }
                let name = nameFromPath(result.filePaths[0]);
                file.value = name;
                value.value = filename;
            }).catch((err) => {
                alert(err);
            });
        };
    }
}
class Vec3ValueComponent extends ValueComponent {
    static title(value) {
        return `
        <label for="${rw(value.node.id + value.param)}"><span class="title vec3">${value.param}</span></label>
    `;
    }
    static value(value) {
        return `
        <div class="value vec3">
            <input type="number" id="${rw(value.node.id + value.param + 'x')}" name="${rw(value.node.id + value.param + 'x')}" value="${value.value[0]}">
            <input type="number" id="${rw(value.node.id + value.param + 'y')}" name="${rw(value.node.id + value.param + 'y')}" value="${value.value[1]}">
            <input type="number" id="${rw(value.node.id + value.param + 'z')}" name="${rw(value.node.id + value.param + 'z')}" value="${value.value[2]}">
        </div>
        `;
    }
    static callback(value) {
        let vec3x = document.getElementById(rw(value.node.id + value.param + 'x'));
        let vec3y = document.getElementById(rw(value.node.id + value.param + 'y'));
        let vec3z = document.getElementById(rw(value.node.id + value.param + 'z'));
        let callback = (ev) => {
            value.value = [parseFloat(vec3x.value), parseFloat(vec3y.value), parseFloat(vec3z.value)];
        };
        [vec3x, vec3y, vec3z].map(elem => {
            elem.onkeydown = callback;
            elem.onmousedown = nothing;
            elem.onmousemove = nothing;
        });
    }
}
class BoolValueComponent extends ValueComponent {
    static title(value) {
        return `
        <label for="${rw(value.node.id + value.param)}"><span class="title bool">${value.param}</span></label>
    `;
    }
    static value(value) {
        return `
        <div class="value bool">
            <label for="${rw(value.node.id + value.param)}">
                <input type="checkbox" id="${rw(value.node.id + value.param)}" name="${rw(value.node.id + value.param)}" ${value.value ? 'Checked' : ''}>
                <span class="checkmark"></span>
            </label>
        </div>
        `;
    }
    static callback(value) {
        let checkbox = document.getElementById(rw(value.node.id + value.param));
        checkbox.onchange = (ev) => {
            value.value = checkbox.checked;
        };
        checkbox.onmousedown = nothing;
        checkbox.onmousemove = nothing;
    }
}
const ValueInitializer = {
    string: StringValueComponent,
    number: NumberValueComponent,
    bool: BoolValueComponent,
    file: FileValueComponent,
    vec3: Vec3ValueComponent,
    select: SelectValueComponent
};
class NodeComponent extends HTMLComponent {
    constructor(node) {
        super();
        this.elements = {
            node: HTMLElementType()
        };
        this.pos = {
            x: 0,
            y: 0
        };
        this.node = node;
    }
    render() {
        return `
        <div class="node ${this.node.disabled ? "disabled" : ""}" id="${this.node.id}">
        <div class="title">${this.node.title}</div>
        <div class="contents">
            <div class="connectors">${this.node.inParams.map(param => `<div class="connector in ${param.type}" data-title="${param.parameter} [type ${param.type}]">
                 </div>`).join('')}
            </div>
            <div class="values">
                <div class="values-titles">
                    ${this.node.values.map(value => ValueInitializer[value.type].title(value)).join('')}
                </div>
                <div class="values-values">
                    ${this.node.values.map(value => ValueInitializer[value.type].value(value)).join('')}
                </div>
            </div>
            <div class="connectors">${this.node.outParams.map(param => `<div class="connector out ${param.type}" data-title="${param.parameter} [type ${param.type}]">
                 </div>`).join('')}
            </div>
        </div>   
    </div>   
        `;
    }
    get id() {
        return this.node.id;
    }
    get inputConnectors() {
        return this.elements.node.lastElementChild.firstElementChild.children;
    }
    get outputConnectors() {
        return this.elements.node.lastElementChild.lastElementChild.children;
    }
    init(elem, x, y) {
        this.elements.node = elem;
        this.pos.x = x;
        this.pos.y = y;
        this.node.values.map(value => ValueInitializer[value.type].callback(value));
        console.log(this.node);
        this.setupConnector(this.inputConnectors, this.node.inParams);
        this.setupConnector(this.outputConnectors, this.node.outParams);
        this.elements.node.onmousedown = (ev) => this.mousedown(ev);
        this.applyTransform();
    }
    move(dx, dy) {
        this.pos.x += dx;
        this.pos.y += dy;
        this.applyTransform();
        for (let param of this.node.inParams)
            param.drawConnections();
        for (let param of this.node.outParams)
            param.drawConnections();
    }
    mousedown(ev) {
        if (ev.button == 0) {
            NodeEditor.instance.selectNode(this.elements.node.id);
        }
        else if (ev.button == 2) {
            this.node.remove();
            this.remove();
        }
        ev.preventDefault();
        ev.stopPropagation();
    }
    remove() {
        this.elements.node.parentElement.removeChild(this.elements.node);
    }
    setupConnector(connectorHTML, param) {
        for (let i = 0; i < connectorHTML.length; ++i) {
            param[i].connHTML = new ConnectorHTMLContainer(connectorHTML[i], this);
            connectorHTML[i].onmousedown = (ev) => {
                this.node.addConnection(param[i]);
                ev.preventDefault();
                ev.stopPropagation();
            };
        }
    }
    setNotActive() {
        this.elements.node.classList.add("nonactive");
    }
    setActive() {
        this.elements.node.classList.remove("nonactive");
    }
    applyTransform() {
        this.elements.node.style.transform = 'translate(' + this.pos.x + 'px, ' + this.pos.y + 'px)';
    }
}
class ProgressBarComponent extends HTMLComponent {
    constructor(id) {
        super();
        this.elements = {
            container: HTMLElementType(),
            title: HTMLElementType(),
            bar: HTMLElementType()
        };
        this.id = `progressbar${id}`;
    }
    render() {
        return `
        <div class="progressBar" id="${this.id}">
            <div class="progressBarContainer">
                <div class="progressBarLine" id="messageProgressBar"></div>
            </div>
            <div class="progressBarTitle" id="messageProgressBarTitle">
        </div>
        `;
    }
    init(elem) {
        this.elements.container = elem;
        this.elements.title = elem.lastElementChild;
        this.elements.bar = elem.firstElementChild.firstElementChild;
    }
    update(value, text) {
        this.elements.bar.style.width = `${value}%`;
        this.elements.title.innerHTML = text;
        if (value == 100)
            this.remove();
    }
    remove() {
        this.elements.container.parentElement.removeChild(this.elements.container);
    }
}
class MessageComponent extends HTMLComponent {
    constructor(title, body) {
        super();
        this.elements = {
            message: HTMLElementType(),
        };
        this.title = title;
        this.body = body;
        this.id = `message${MessageComponent.staicId++}`;
    }
    render() {
        return `
            <div class="message" id="${this.id}" data-active>
                <div class="title">
                    ${this.title}
                </div>
                <div class="body">
                    ${this.body}
                </div>
            </div>
        `;
    }
    init(elem, timeout) {
        this.elements.message = elem;
        if (timeout > 0)
            setTimeout(() => { this.close(elem); }, timeout);
        elem.onwheel = (ev) => { ev.stopPropagation(); };
        elem.onclick = (ev) => { this.close(elem); };
    }
    close(elem) {
        elem.removeAttribute("data-active");
    }
}
MessageComponent.staicId = 0;
class MessagePanelComponent extends StaticHTMLComponent {
    constructor() {
        super();
        this.elements = {
            messagePanel: HTMLElementType(),
            closeMessagePanelButton: HTMLElementType(),
            messageList: HTMLElementType()
        };
        this.bars = {};
        this.messageIdx = 0;
        this.lastMessage = null;
    }
    render() {
        return `
            <div id="messagePanelTop">
                <div id="closeMessagePanelButton">${Symbols.cross}</div>
            </div>
            <div id="messageList"></div>
        `;
    }
    setup() {
        this.elements.closeMessagePanelButton.onclick = () => {
            this.toggleElement(this.elements.messagePanel);
        };
    }
    addMessage(title, body, timeout = 0) {
        if (this.lastMessage) {
            this.lastMessage.elements.message.removeAttribute("data-active");
        }
        let message = new MessageComponent(title, body);
        this.lastMessage = message;
        let elem = this.appenToEnd(this.elements.messageList, message.render());
        message.init(elem, timeout);
    }
    updateProgressbar(id, value, text) {
        let progress = this.bars[id];
        console.log(progress, id);
        if (!progress) {
            progress = new ProgressBarComponent(id);
            let elem = this.appenToEnd(this.elements.messageList, progress.render());
            progress.init(elem);
            this.bars[id] = progress;
        }
        progress.update(value, text);
    }
    closeAllMessages() {
        this.elements.messageList.innerHTML = "";
    }
}
class NodeEditorComponent extends StaticHTMLComponent {
    constructor() {
        super();
        this.elements = {
            nodes: HTMLElementType(),
            nodeArea: HTMLElementType(),
            svgArea: SVGAElementType(),
            functionPanel: HTMLElementType(),
            nodeMenu: HTMLElementType()
        };
        this.transform = {
            zoom: 1,
            x: 0,
            y: 0,
        };
        this.mouse = {
            x: 0,
            y: 0
        };
        this.userIsMovingArea = false;
        this.components = {
            functionPanel: new FunctionPanelComponent(),
            nodeMenu: new NodeEditorMenuComponent()
        };
    }
    render() {
        return `
        <div id="nodeArea">
            <svg width="100%" height="100%" id="svgArea"></svg>
        </div>
        <div id="functionPanel">
            ${this.components.functionPanel.render()}
        </div>
        <div id="nodeMenu">
            ${this.components.nodeMenu.render()}
        </div>
        `;
    }
    setup() {
        this.elements.nodes.onmousedown = (ev) => this.mousedown(ev);
        this.elements.nodes.onmousemove = (ev) => this.mousemove(ev);
        this.elements.nodes.onmouseup = (ev) => this.mouseup(ev);
        this.elements.nodes.onwheel = (ev) => this.wheel(ev);
        this.resize();
    }
    loadFunction(data, onmousedown) {
        let funcHTML = this.components.functionPanel.loadFunction(data);
        funcHTML.onmousedown = (ev) => {
            if (ev.button == 0) {
                this.toggleElement(this.elements.functionPanel);
                this.setMouse(ev);
                let pos = this.mousePosition;
                onmousedown(pos.x, pos.y);
                ev.preventDefault();
                ev.stopPropagation();
            }
        };
        funcHTML.onmouseup = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
        };
    }
    addConnection(conn) {
        let connection = new ConnectionHTMLContainer(conn);
        this.elements.svgArea.appendChild(connection.elements.line);
        this.elements.svgArea.appendChild(connection.elements.selectLine);
        return connection;
    }
    addNode(node, x, y) {
        let nodeComp = new NodeComponent(node);
        let nodeHTML = this.appenToEnd(this.elements.nodeArea, nodeComp.render());
        nodeComp.init(nodeHTML, x, y);
        return nodeComp;
    }
    mousedown(ev) {
        if (!NodeEditor.instance.isConnectionStaged()) {
            this.userIsMovingArea = true;
            return;
        }
        NodeEditor.instance.cancelStagedConnection();
        ev.stopPropagation();
        ev.preventDefault();
    }
    mousemove(ev) {
        let dx = ev.clientX - this.mouse.x;
        let dy = ev.clientY - this.mouse.y;
        this.mouse.x = ev.clientX;
        this.mouse.y = ev.clientY;
        if (this.userIsMovingArea) {
            this.transform.x += dx;
            this.transform.y += dy;
            this.applyTransform();
        }
        else {
            dx = dx / this.transform.zoom;
            dy = dy / this.transform.zoom;
            NodeEditor.instance.moveNodes(dx, dy);
        }
    }
    mouseup(ev) {
        NodeEditor.instance.deselectAllNodes();
        this.userIsMovingArea = false;
    }
    wheel(ev) {
        let delta = -ev.deltaY / 1000;
        delta = this.transform.zoom + delta > 0.1 ? delta : 0;
        let old_zoom = this.transform.zoom;
        this.transform.zoom = this.transform.zoom + delta;
        this.transform.x = this.transform.x * (this.transform.zoom / old_zoom);
        this.transform.y = this.transform.y * (this.transform.zoom / old_zoom);
        this.applyTransform();
        ev.preventDefault();
    }
    resize() {
        const area = this.elements.nodes;
        const rect = area.getBoundingClientRect();
        this.center = { x: area.offsetWidth / 2, y: area.offsetHeight / 2 };
        this.start = { x: rect.left, y: rect.top };
    }
    applyTransform() {
        this.elements.nodeArea.style.transform = 'translate(' + this.transform.x + 'px, '
            + this.transform.y + 'px) scale('
            + this.transform.zoom + ')';
    }
    setMouse(ev) {
        this.mouse.x = ev.clientX;
        this.mouse.y = ev.clientY;
    }
    get mousePosition() {
        let offsetX = (this.mouse.x - this.start.x - this.center.x - this.transform.x) / this.transform.zoom;
        let offsetY = (this.mouse.y - this.start.y - this.center.y - this.transform.y) / this.transform.zoom;
        let x = this.center.x + offsetX;
        let y = this.center.y + offsetY;
        return { x: x, y: y };
    }
    resetTransform() {
    }
    clear() {
        while (this.elements.nodeArea.children.length > 1) {
            this.elements.nodeArea.removeChild(this.elements.nodeArea.lastElementChild);
        }
    }
}
class ViewerComponent extends StaticHTMLComponent {
    constructor() {
        super();
        this.elements = {
            viewerCanvas: HTMLCanvasElementType()
        };
    }
    render() {
        return `
            <canvas id="viewerCanvas"></canvas>
        `;
    }
    setup() {
    }
}
class ApplicationComponent extends StaticHTMLComponent {
    constructor() {
        super();
        this.elements = {
            nodes: HTMLElementType(),
            viewer: HTMLElementType(),
            messagePanel: HTMLElementType(),
            applicationMenu: HTMLElementType()
        };
        this.colorScheme = {
            colors: [
                [159, 237, 215],
                [254, 249, 199],
                [252, 225, 129]
            ],
            gray: [237, 234, 229],
            black: [10, 10, 10]
        };
        this.components = {
            nodeEditor: new NodeEditorComponent(),
            messagePanel: new MessagePanelComponent(),
            viewer: new ViewerComponent(),
            applicationMenu: new ApplicationMenuComponent()
        };
    }
    render() {
        return `
        <div id="applicationMenu">
            ${this.components.applicationMenu.render()}
        </div>
        <div id="messagePanel">
            ${this.components.messagePanel.render()}
        </div>
        <div id="nodes">
            ${this.components.nodeEditor.render()}
        </div>
        <div id="viewer">
            ${this.components.viewer.render()}
        </div>
        `;
    }
    setup() {
    }
    createStyleRule(name, i, length) {
        let colorIdx = (i / (length - 1)) * (this.colorScheme.colors.length - 1);
        let colorA = Math.floor(colorIdx);
        let colorB = Math.ceil(colorIdx);
        let t = colorIdx - colorA;
        return `.connector.${name} {
            background: rgb(${this.colorScheme.colors[colorA].map((v, i) => v * (1 - t) + this.colorScheme.colors[colorB][i] * t).join(", ")});
        }`;
    }
    setupStyles(types) {
        let style = document.getElementById("colorScheme");
        if (!style) {
            style = document.createElement('style');
            document.getElementsByTagName('head')[0].appendChild(style);
        }
        style.innerHTML = `
            ${types.map((t, i) => this.createStyleRule(t, i, types.length)).join("\n\n")}
        `;
    }
    openNodeEditor() {
        this.elements.nodes.style.display = 'block';
        this.elements.viewer.style.display = 'none';
    }
    openViewer() {
        this.elements.nodes.style.display = 'none';
        this.elements.viewer.style.display = 'block';
        Viewer.instance.willAppear();
    }
    clear() {
        this.components.nodeEditor.clear();
    }
    get messages() {
        return this.components.messagePanel;
    }
}
class IO {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: null,
            y: null,
            down: false,
            button: 0,
            time: 0
        };
    }
    onKeyDown(key) {
        this.keys[key] = true;
        console.log(key);
    }
    onKeyUp(key) {
        this.keys[key] = false;
    }
    onMouseDown(x, y, button) {
        this.mouse.down = true;
        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.button = button;
        this.mouse.time = Date.now();
    }
    ;
    onMouseUp(x, y) {
        this.mouse.down = false;
        let now = Date.now();
        if (now - this.mouse.time < 200 && this.mouse.button == 0) {
        }
    }
    ;
    onMouseMove(x, y) {
        if (!this.mouse.down) {
            return;
        }
        let delta_x = x - this.mouse.x;
        let delta_y = y - this.mouse.y;
        this.mouse.x = x;
        this.mouse.y = y;
        if (this.mouse.button == 1) {
            Viewer.instance.graphics.scene.camera.rotate(delta_x, delta_y);
        }
        else if (this.mouse.button == 0) {
            Viewer.instance.graphics.scene.camera.move(delta_x, delta_y);
        }
    }
    ;
    wheel(delta) {
        Viewer.instance.graphics.scene.camera.zoom(1, delta);
    }
}
const ZOOM_STEP = 0.0025;
const ROT_STEP = 0.5;
const GLOBAL_SCALE = 0.001;
class Camera {
    constructor() {
        this.position = new Float32Array([0, 0, 0]);
        this.up = new Float32Array([0, 1, 0]);
        this.geometryCenter = new Float32Array([0, 0, 0]);
        this.shift = new Float32Array([0, 0, 0]);
        this.center = new Float32Array([0, 0, 100]);
        this.actualPosition = new Float32Array([0, 0, 0]);
        this.actualUp = new Float32Array([0, 1, 0]);
        this.actualCenter = new Float32Array([, 0, 100]);
        this.viewMatrix = new Float32Array(16);
        this.projectionMatrix = new Float32Array(16);
        this.VPmatrix = new Float32Array(16);
        this.rotateMatrix = new Float32Array(16);
        this.frontVector = new Float32Array(3);
        this.tmp = new Float32Array(3);
        this.tmp2 = new Float32Array(3);
        this.worldMatrix = glMatrix.mat4.create();
        this.screenX = 0;
        this.screenY = 0;
        this.scale = 100;
        this.speed = 0.05;
        this.aspect = 0;
        this.sceneChanged = false;
        this.farplane = 1000000;
        this.positionMomentum = 1;
        this.centerMomentum = 1;
        this.rotMomentum = 1;
        this.scaleMomentum = 1;
    }
    get view() {
        glMatrix.mat4.lookAt(this.viewMatrix, this.actualPosition, this.actualCenter, this.actualUp);
        return this.viewMatrix;
    }
    get projection() {
        return glMatrix.mat4.perspective(this.projectionMatrix, glMatrix.glMatrix.toRadian(45), this.aspect, 0.01, this.farplane);
    }
    get world() {
        return this.worldMatrix;
    }
    get vp() {
        glMatrix.mat4.copy(this.VPmatrix, this.projection);
        glMatrix.mat4.mul(this.VPmatrix, this.VPmatrix, this.view);
        return this.VPmatrix;
    }
    get front() {
        glMatrix.vec3.sub(this.frontVector, this.center, this.position);
        return glMatrix.vec3.normalize(this.frontVector, this.frontVector);
    }
    get screenDim() {
        return vec2.fromValues(this.screenX, this.screenY);
    }
    get pos() {
        return this.position;
    }
    restoreCenter() {
        this.center = Object.assign({}, this.defaultCenter);
    }
    viewTop() {
        let dist = glMatrix.vec3.dist(this.center, this.position);
        this.position = Object.assign({}, this.center);
        this.position[2] += dist;
        this.up = new Float32Array([0, 1, 0]);
    }
    viewFront() {
        let dist = glMatrix.vec3.dist(this.center, this.position);
        this.position = Object.assign({}, this.center);
        this.position[1] -= dist;
        this.up = new Float32Array([0, 0, 1]);
    }
    viewSide() {
        let dist = glMatrix.vec3.dist(this.center, this.position);
        this.position = Object.assign({}, this.center);
        this.position[0] -= dist;
        this.up = new Float32Array([0, 0, 1]);
    }
    resize(x, y) {
        this.screenX = x;
        this.screenY = y;
        this.aspect = x / y;
        this.sceneChanged = true;
    }
    rotate(x, y) {
        let a_x = glMatrix.glMatrix.toRadian(-x) * ROT_STEP;
        let a_y = glMatrix.glMatrix.toRadian(y) * ROT_STEP;
        let front = glMatrix.vec3.sub(glMatrix.vec3.create(), this.center, this.position);
        let axes_x = glMatrix.vec3.cross(this.tmp, this.up, front);
        let axes_y = this.up;
        glMatrix.mat4.fromRotation(this.rotateMatrix, a_x, axes_y);
        glMatrix.mat4.rotate(this.rotateMatrix, this.rotateMatrix, a_y, axes_x);
        glMatrix.vec3.transformMat4(front, front, this.rotateMatrix);
        glMatrix.vec3.add(this.position, this.center, glMatrix.vec3.negate(front, front));
        glMatrix.vec3.transformMat4(this.up, this.up, this.rotateMatrix);
    }
    zoom(direction = 1, scale = 1) {
        glMatrix.vec3.sub(this.tmp, this.position, this.center);
        glMatrix.vec3.scale(this.tmp, this.tmp, 1 + direction * (ZOOM_STEP * scale));
        let len = glMatrix.vec3.len(this.tmp);
        let min_len = 0.01;
        if (len < min_len) {
            glMatrix.vec3.normalize(this.tmp, this.tmp);
            glMatrix.vec3.scale(this.tmp, this.tmp, min_len);
        }
        glMatrix.vec3.add(this.tmp, this.center, this.tmp);
        glMatrix.vec3.copy(this.position, this.tmp);
    }
    move(x, y) {
        let front = glMatrix.vec3.sub(glMatrix.vec3.create(), this.center, this.position);
        let axes_x = glMatrix.vec3.normalize(this.tmp, glMatrix.vec3.cross(this.tmp, this.up, front));
        let axes_y = glMatrix.vec3.normalize(this.tmp2, glMatrix.vec3.copy(this.tmp2, this.up));
        glMatrix.vec3.scale(axes_x, axes_x, x * GLOBAL_SCALE);
        glMatrix.vec3.scale(axes_y, axes_y, y * GLOBAL_SCALE);
        glMatrix.vec3.add(this.position, this.position, axes_x);
        glMatrix.vec3.add(this.position, this.position, axes_y);
        glMatrix.vec3.add(this.center, this.center, axes_x);
        glMatrix.vec3.add(this.center, this.center, axes_y);
    }
    frame() {
        const limit = 0.01 * GLOBAL_SCALE;
        glMatrix.vec3.sub(this.tmp, this.position, this.actualPosition);
        this.positionMomentum = glMatrix.vec3.length(this.tmp);
        if (this.positionMomentum > limit) {
            glMatrix.vec3.scaleAndAdd(this.actualPosition, this.actualPosition, this.tmp, this.speed * 4);
        }
        else {
            glMatrix.vec3.copy(this.actualPosition, this.position);
            this.positionMomentum = 0;
        }
        this.rotMomentum = Math.min(glMatrix.vec3.angle(this.actualUp, this.up), this.speed * 3.14);
        if (this.rotMomentum > limit) {
            let axis = glMatrix.vec3.cross(this.tmp, this.actualUp, this.up);
            glMatrix.mat4.fromRotation(this.rotateMatrix, this.rotMomentum, axis);
            glMatrix.vec3.transformMat4(this.actualUp, this.actualUp, this.rotateMatrix);
        }
        else {
            glMatrix.vec3.copy(this.actualUp, this.up);
            this.rotMomentum = 0;
        }
        glMatrix.vec3.sub(this.tmp, this.center, this.actualCenter);
        this.centerMomentum = glMatrix.vec3.length(this.tmp);
        if (this.centerMomentum > limit) {
            glMatrix.vec3.scaleAndAdd(this.actualCenter, this.actualCenter, this.tmp, this.speed * 4);
        }
        else {
            glMatrix.vec3.copy(this.actualCenter, this.center);
            this.centerMomentum = 0;
        }
    }
    updateScale(stats) {
        let farplane = 0;
        for (let i = 0; i < 3; ++i) {
            this.geometryCenter[i] = (stats.min[i] + stats.max[i]) / 2;
            farplane = Math.max(farplane, (stats.max[i] - stats.min[i]) * GLOBAL_SCALE);
        }
        this.center = glMatrix.vec3.fromValues(0, 0, 0);
        this.farplane = farplane * 2;
        this.defaultCenter = Object.assign({}, this.center);
        this.position = Object.assign({}, this.center);
        this.position[2] += farplane / 2;
        glMatrix.mat4.identity(this.worldMatrix);
        glMatrix.mat4.scale(this.worldMatrix, this.worldMatrix, glMatrix.vec3.fromValues(GLOBAL_SCALE, GLOBAL_SCALE, GLOBAL_SCALE));
        glMatrix.vec3.copy(this.shift, glMatrix.vec3.negate(this.tmp, this.geometryCenter));
        glMatrix.mat4.translate(this.worldMatrix, this.worldMatrix, this.shift);
    }
    get needsRedraw() {
        return this.centerMomentum || this.rotMomentum || this.positionMomentum;
    }
}
var Parser;
(function (Parser) {
    function toFloat32(data) {
        let blob = window.atob(data);
        let len = blob.length / Float32Array.BYTES_PER_ELEMENT;
        let view = new DataView(new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT));
        let array = new Float32Array(len);
        for (let p = 0; p < len * 4; p = p + 4) {
            view.setUint8(0, blob.charCodeAt(p));
            view.setUint8(1, blob.charCodeAt(p + 1));
            view.setUint8(2, blob.charCodeAt(p + 2));
            view.setUint8(3, blob.charCodeAt(p + 3));
            array[p / 4] = view.getFloat32(0, true);
        }
        view = null;
        blob = null;
        return array;
    }
    Parser.toFloat32 = toFloat32;
    function toUint32(data) {
        let blob = window.atob(data);
        let len = blob.length / Uint32Array.BYTES_PER_ELEMENT;
        let view = new DataView(new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT));
        let array = new Uint32Array(len);
        for (let p = 0; p < len * 4; p = p + 4) {
            view.setUint8(0, blob.charCodeAt(p));
            view.setUint8(1, blob.charCodeAt(p + 1));
            view.setUint8(2, blob.charCodeAt(p + 2));
            view.setUint8(3, blob.charCodeAt(p + 3));
            array[p / 4] = view.getUint32(0, true);
        }
        view = null;
        blob = null;
        return array;
    }
    Parser.toUint32 = toUint32;
})(Parser || (Parser = {}));
class Scene {
    constructor() {
        this.camera = new Camera();
    }
}
class Graphics {
    constructor(canvas) {
        this.interface = new IO();
        this.canvas = canvas;
        this.sizeReference = canvas.parentElement;
        console.log('Getting webgl 2 context');
        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) {
            console.error('WebGL 2 not supported, please use a different browser.');
            throw 'WebGL 2 not supported, please use a different browser.';
        }
        let ext = this.gl.getExtension('OES_texture_float_linear');
        if (!ext)
            throw 'Linear filter unavailable';
        ext = this.gl.getExtension('EXT_color_buffer_float');
        if (!ext)
            throw 'Color float texture unavailable';
        this.programs = {
            triangles: new TriangleProgram(this.gl),
            objects: new ObjectProgram(this.gl),
        };
        this.scene = new Scene();
        this.error = false;
        canvas.onmousedown = (event) => {
            this.interface.onMouseDown(event.clientX, event.clientY, event.button);
            event.stopPropagation();
        };
        canvas.onmouseup = (event) => {
            this.interface.onMouseUp(event.clientX, event.clientY);
            event.stopPropagation();
        };
        canvas.onmousemove = (event) => {
            this.interface.onMouseMove(event.clientX, event.clientY);
            event.stopPropagation();
        };
        canvas.onwheel = (event) => {
            this.interface.wheel(event.deltaY);
            event.preventDefault();
            event.stopPropagation();
        };
    }
    renderFrame() {
        this.gl.depthMask(true);
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.BLEND);
        this.programs.objects.render(this.scene);
        this.scene.camera.frame();
    }
    resize() {
        let dims = this.sizeReference.getBoundingClientRect();
        this.canvas.width = dims.width;
        this.canvas.height = dims.height;
        console.log(dims.width, dims.height);
        this.gl.viewport(0, 0, dims.width, dims.height);
        this.scene.camera.resize(dims.width, dims.height);
    }
    checkError() {
        let error = this.gl.getError();
        if (error != 0)
            console.log(error);
    }
}
class GLObject {
    constructor() {
        this.vbo = {};
        this.usedPrograms = {};
        this.gl = Viewer.instance.graphics.gl;
    }
    get programs() {
        return Viewer.instance.graphics.programs;
    }
    initVao() {
        let vao = this.gl.createVertexArray();
        this.vao = vao;
    }
    bindVao() {
        this.gl.bindVertexArray(this.vao);
    }
    unbindVao() {
        this.gl.bindVertexArray(null);
    }
    initBuffer(name) {
        let buffer = this.gl.createBuffer();
        this.vbo[name] = buffer;
    }
    fillBuffer(name, data) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo[name]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    }
    usesProgram(params) {
        this.usedPrograms[params.programName] = params;
    }
    markForRender() {
        for (let program in this.usedPrograms) {
            this.usedPrograms[program].program.addGLObject(this);
        }
    }
    updateBBox(bbox) {
        Viewer.instance.graphics.scene.camera.updateScale(bbox);
    }
    programParams(programTitle) {
        return this.usedPrograms[programTitle];
    }
}
var ShaderType;
(function (ShaderType) {
    ShaderType[ShaderType["vertex"] = 0] = "vertex";
    ShaderType[ShaderType["fragment"] = 1] = "fragment";
})(ShaderType || (ShaderType = {}));
;
const AttribLocation = 0;
const UniformLocation = 0;
class Shader {
    constructor(gl, code, type) {
        this.gl = gl;
        this.type = type;
        this.code = code;
        this.createShader();
    }
    createShader() {
        let type;
        if (this.type == ShaderType.vertex)
            type = this.gl.VERTEX_SHADER;
        else
            type = this.gl.FRAGMENT_SHADER;
        this.shader = this.gl.createShader(type);
        this.gl.shaderSource(this.shader, this.code);
        this.gl.compileShader(this.shader);
        if (!this.gl.getShaderParameter(this.shader, this.gl.COMPILE_STATUS)) {
            console.error('ERROR compiling shader!', this.gl.getShaderInfoLog(this.shader));
            console.error(this.code);
            throw 'ERROR compiling shader!';
        }
    }
}
;
class Program {
    constructor(gl) {
        this.uniforms = {};
        this.attributes = {};
        this.primitives = [];
        this.gl = gl;
        this.state = {
            init: false,
            attrs: false,
            unifs: false,
        };
        this.GLType = {
            float: this.gl.uniform1f,
            int: this.gl.uniform1i,
            vec2: this.gl.uniform2fv,
            vec3: this.gl.uniform3fv,
            vec4: this.gl.uniform4fv,
            mat4: this.gl.uniformMatrix4fv,
        };
    }
    setup() {
        this.setupAttributes();
        this.setupUniforms();
    }
    init(vs, fs) {
        let vss = new Shader(this.gl, vs, ShaderType.vertex);
        let fss = new Shader(this.gl, fs, ShaderType.fragment);
        let program = this.gl.createProgram();
        this.gl.attachShader(program, vss.shader);
        this.gl.attachShader(program, fss.shader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('ERROR linking program!', this.gl.getProgramInfoLog(program));
        }
        this.gl.validateProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.VALIDATE_STATUS)) {
            console.error('ERROR validating program!', this.gl.getProgramInfoLog(program));
        }
        this.program = program;
    }
    setupAttributes() {
        for (let key in this.attributes) {
            this.attributes[key] = this.gl.getAttribLocation(this.program, key);
        }
    }
    setupUniforms() {
        for (let key in this.uniforms) {
            this.uniforms[key].location = this.gl.getUniformLocation(this.program, key);
        }
    }
    bindFloat32Attribute(set) {
        this.gl.enableVertexAttribArray(set.attribute);
        this.gl.vertexAttribPointer(set.attribute, set.size, this.gl.FLOAT, false, set.stride, set.offset);
        if ('divisor' in set) {
            this.gl.vertexAttribDivisor(set.attribute, set.divisor);
        }
    }
    bindInt32Attribute(set) {
        this.gl.enableVertexAttribArray(set.attribute);
        this.gl.vertexAttribPointer(set.attribute, set.size, this.gl.UNSIGNED_BYTE, true, set.stride, set.offset);
        if ('divisor' in set) {
            this.gl.vertexAttribDivisor(set.attribute, set.divisor);
        }
    }
    bindUniforms(options) {
        for (let key in this.uniforms) {
            if (this.uniforms[key].type === this.GLType.mat4) {
                this.uniforms[key].type.apply(this.gl, [this.uniforms[key].location, false, options[key]]);
            }
            else {
                this.uniforms[key].type.apply(this.gl, [this.uniforms[key].location, options[key]]);
            }
        }
    }
    bind() {
        this.gl.useProgram(this.program);
    }
    unbind() {
        this.gl.useProgram(null);
    }
    addGLObject(obj) {
        this.primitives.push(obj);
    }
    render(scene) {
        throw "Throwing form base class, custom render not implemented.";
    }
}
class ShadowProgram extends Program {
    constructor(gl) {
        super(gl);
    }
}
;
class ObjectProgram extends ShadowProgram {
    constructor(gl) {
        super(gl);
        this.attributes = {
            vertex: AttribLocation,
            normal: AttribLocation,
            object: AttribLocation
        };
        this.uniforms = {
            mM: {
                location: UniformLocation,
                type: this.GLType.mat4
            },
            mVP: {
                location: UniformLocation,
                type: this.GLType.mat4
            },
            selected: {
                location: UniformLocation,
                type: this.GLType.vec4,
            },
            useShadows: {
                location: UniformLocation,
                type: this.GLType.float
            }
        };
        const vs = `#version 300 es
        precision highp float;
        precision highp int;
        
        in vec3 vertex;
        /*in vec4 object;*/
        in vec3 normal;
        
        //matrices
        uniform mat4 mM;
        uniform mat4 mVP;
        /*uniform mat4 mLVP;
        
        uniform vec4 selected;*/
        out vec3 fragcolor;
        /*out vec4 lpos;*/
        
        /**
         * Phong
         */
        vec3 phong(vec3 light, vec3 ver_position, vec3 ver_normal){
            vec3 ret = vec3(0.0);
            
            vec3 L = normalize(-light);
            float NdotL = clamp(dot(normalize(ver_normal), L), 0.0, 1.0);
           
               //ambient
            ret += vec3(0.1);
            
            //diffuse
            ret += vec3(1.0) * NdotL;
            
            return log(vec3(1.0) + ret);
        }
        
        /*vec3 vec3fMod(vec3 a, vec3 b) {
            vec3 higher = vec3(greaterThan(a, b));
            vec3 mult = floor(a / b);
            return a * (1.0f - higher) + (a - b * mult) * higher;
        }*/
        
        void main() {
            //vec3 objColor = object.x * vec3(0.5) + vec3(0.6);
            vec3 objColor = vec3(1.0);
        
        
            /*int marked = 1;
            for(int i = 0; i < 4; ++i)
                marked *= int(floor(selected[i] * 255.0 + 0.5) == floor(object[i] * 255.0 + 0.5));
        
            if (bool(marked))
                objColor = vec3(2.0, 1.5, 1.0);*/   
        
        
            fragcolor = phong(vec3(1, 0.5, 1), vertex, normal) * objColor;
            vec3 shifted = (mM * vec4(vertex, 1.0)).xyz;
            /*lpos = mLVP * vec4(shifted, 1.0);*/
            gl_Position =  mVP * vec4(shifted, 1.0);
        }
        `;
        const fs = `#version 300 es
        precision highp float;
        precision highp int;
        
        in vec3 fragcolor;
        /*in vec4 lpos;*/
        out vec4 color;
        
        
        //shadows
        /*uniform sampler2D shadowmap;
        uniform float texSize;
        uniform float tolerance;
        uniform float useShadows;*/
        
        
        /*float interpolate(vec2 texcoord, float depth) {
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
        }*/
        
        
        /*float shadow(void)
        {
          vec3 vertex_relative_to_light = lpos.xyz / lpos.w;
          vertex_relative_to_light = vertex_relative_to_light * 0.5 + 0.5;
          
          float shadowing = interpolate(vertex_relative_to_light.xy * texSize, vertex_relative_to_light.z);
          return shadowing * 0.3 + 0.7;
        }*/
        
        
        void main()
        {
          vec3 outcolor = fragcolor;
          
          /*if (bool(useShadows))
            outcolor *= shadow();*/
        
          color = vec4(outcolor + vec3(0.2), 1.0);
        }
        `;
        this.init(vs, fs);
        this.setup();
    }
    bindAttrVertex() {
        this.gl.useProgram(this.program);
        this.bindFloat32Attribute({
            attribute: this.attributes.vertex,
            size: 3,
            stride: 3 * Float32Array.BYTES_PER_ELEMENT,
            offset: 0,
        });
        this.gl.useProgram(null);
    }
    bindAttrNormal() {
        this.gl.useProgram(this.program);
        this.bindFloat32Attribute({
            attribute: this.attributes.normal,
            size: 3,
            stride: 3 * Float32Array.BYTES_PER_ELEMENT,
            offset: 0,
        });
        this.gl.useProgram(null);
    }
    bindAttrObject() {
        this.gl.useProgram(this.program);
        this.bindInt32Attribute({
            attribute: this.attributes.object,
            size: 4,
            stride: 1 * Uint32Array.BYTES_PER_ELEMENT,
            offset: 0,
        });
        this.gl.useProgram(null);
    }
    renderParams(firstTriangleIndex, countTriangles) {
        return {
            programName: "objects",
            program: this,
            first: firstTriangleIndex,
            count: countTriangles
        };
    }
    render(scene) {
        this.gl.useProgram(this.program);
        this.bindUniforms({
            mM: scene.camera.world,
            mVP: scene.camera.vp,
            selected: new Float32Array([0, 0, 0, 0]),
            useShadows: 0
        });
        for (let obj of this.primitives) {
            obj.bindVao();
            let params = obj.programParams("objects");
            this.gl.drawArrays(this.gl.TRIANGLES, params.first, params.count);
            obj.unbindVao();
        }
    }
}
class TriangleProgram extends Program {
    constructor(gl) {
        super(gl);
        this.attributes = {
            vertex: AttribLocation,
        };
        this.uniforms = {
            mM: {
                location: UniformLocation,
                type: this.GLType.mat4
            },
            mVP: {
                location: UniformLocation,
                type: this.GLType.mat4
            }
        };
        const vs = `#version 300 es
        precision highp float;
        precision highp int;

        in vec3 vertex;

        //matrices
        uniform mat4 mM;
        uniform mat4 mVP;

        void main() {
            vec3 shifted = (mM * vec4(vertex, 1.0)).xyz;
            gl_Position = mVP * vec4(shifted, 1.0);
        }
        `;
        const fs = `#version 300 es
        precision highp float;
        precision highp int;

        out vec4 color;

        void main()
        {
            color = vec4(1.0);
        }
        `;
        this.init(vs, fs);
        this.setup();
    }
    bindAttrVertex() {
        this.gl.useProgram(this.program);
        this.bindFloat32Attribute({
            attribute: this.attributes.vertex,
            size: 3,
            stride: 3 * Float32Array.BYTES_PER_ELEMENT,
            offset: 0,
        });
        this.gl.useProgram(null);
    }
}
class Layer {
    constructor(data) {
        this.idToIdx = data.idToIdx;
        this.idxToId = data.idxToId;
        this.lod = data.lod;
        this.meta = data.meta;
        this.gl = new GLObject();
    }
}
class ObjectLayer extends Layer {
    constructor(data) {
        super(data);
        console.log("loading layer");
        this.gl.initVao();
        this.gl.bindVao();
        this.gl.initBuffer("vertices");
        let triangles = Parser.toFloat32(data.triangles);
        this.gl.fillBuffer("vertices", triangles);
        this.gl.programs.objects.bindAttrVertex();
        this.gl.initBuffer("normals");
        let normals = Parser.toFloat32(data.normals);
        this.gl.fillBuffer("normals", normals);
        this.gl.programs.objects.bindAttrNormal();
        this.gl.unbindVao();
        this.gl.usesProgram(this.gl.programs.objects.renderParams(0, triangles.length / 3));
        this.gl.updateBBox(data.bbox);
        this.gl.markForRender();
        Viewer.instance.errorCheck();
    }
}
class Viewer {
    constructor() {
        this.layers = [];
    }
    static get instance() {
        if (!this.instanceObject) {
            this.instanceObject = new this();
        }
        return this.instanceObject;
    }
    init() {
        let canvas = document.getElementById("viewerCanvas");
        this.graphics = new Graphics(canvas);
    }
    clear() {
    }
    addLayer(layer) {
        console.log("adding", layer);
        switch (layer.type) {
            case "objects":
                this.layers.push(new ObjectLayer(layer));
                break;
            default:
                break;
        }
    }
    recieved(data) {
        if (!(data.recipient == "viewer" && "status" in data))
            return;
        switch (data.status) {
            case "clearViewer":
                this.clear();
                break;
            case "addLayer":
                this.addLayer(data.layer);
                break;
            default:
                break;
        }
    }
    startRender() {
        let last = 0;
        let loop = (time) => {
            this.graphics.renderFrame();
            last = time;
            if (!this.graphics.error)
                requestAnimationFrame(loop);
        };
        this.graphics.resize();
        requestAnimationFrame(loop);
    }
    willAppear() {
        this.graphics.resize();
    }
    errorCheck() {
        this.graphics.checkError();
    }
    resize() {
        this.graphics.resize();
    }
}
var ConnectorType;
(function (ConnectorType) {
    ConnectorType[ConnectorType["input"] = 0] = "input";
    ConnectorType[ConnectorType["output"] = 1] = "output";
})(ConnectorType || (ConnectorType = {}));
function usesTypes(func) {
    let inputs = func.in.map(val => val.type);
    let outputs = func.out.map(val => val.type);
    return inputs.concat(outputs.filter((item) => inputs.indexOf(item) < 0));
}
function objectEmpty(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}
class Connection {
    constructor(source) {
        if (source.inout == ConnectorType.input) {
            this.out = null;
            this.in = source;
        }
        else {
            this.out = source;
            this.in = null;
        }
        this.connectionContainer = NodeEditor.ui.addConnection(this);
    }
    static key(connA, connB) {
        if (connA.inout == ConnectorType.input)
            return connB.node.id + connB.parameter + "---" + connA.node.id + connA.parameter;
        else
            return connA.node.id + connA.parameter + "---" + connB.node.id + connB.parameter;
    }
    get key() {
        return Connection.key(this.out, this.in);
    }
    connect(conn) {
        let sourceConn = this.in ? this.in : this.out;
        let key = Connection.key(sourceConn, conn);
        if (conn.node.id == sourceConn.node.id)
            return false;
        if (conn.inout + sourceConn.inout != ConnectorType.input + ConnectorType.output)
            return false;
        if (sourceConn.type != conn.type)
            return false;
        if (NodeEditor.instance.connectionExists(key))
            return false;
        if (this.in)
            this.out = conn;
        else
            this.in = conn;
        for (let conn in this.in.connections)
            this.in.connections[conn].remove();
        this.in.connections[key] = this;
        this.out.connections[key] = this;
        NodeEditor.instance.addConnection(this);
        this.in.node.checkRequiredInputs();
        this.out.node.checkRequiredInputs();
        return true;
    }
    deregister() {
        if (this.in && this.out) {
            let key = this.key;
            delete this.in.connections[key];
            delete this.out.connections[key];
            NodeEditor.instance.removeConnection(key);
            this.in.node.checkRequiredInputs();
            this.out.node.checkRequiredInputs();
        }
    }
    remove() {
        this.connectionContainer.remove();
        this.deregister();
    }
    move(dx, dy) {
        this.connectionContainer.move();
    }
    get serialized() {
        return {
            out: {
                node: this.out.node.id,
                connector: this.out.parameter
            },
            in: {
                node: this.in.node.id,
                connector: this.in.parameter
            }
        };
    }
    static load(outConn, inConn) {
        if (!outConn || !inConn)
            return;
        let connection = new Connection(outConn);
        connection.connect(inConn);
        connection.move(0, 0);
    }
}
class Connector {
    constructor(structure, inout, node) {
        this.connections = {};
        this.parameter = structure.param;
        this.type = structure.type;
        this.inout = inout;
        this.node = node;
    }
    drawConnections() {
        for (let conn in this.connections) {
            this.connections[conn].move(0, 0);
        }
    }
    removeAllConnections() {
        for (let conn in this.connections)
            this.connections[conn].remove();
    }
    get serialized() {
        let connections = [];
        for (let conn in this.connections)
            connections.push(this.connections[conn].serialized);
        return {
            param: this.parameter,
            type: this.type,
            node: this.node.id,
            connections: connections
        };
    }
    get connectionCount() {
        return Object.keys(this.connections).length;
    }
}
class NodeValue {
    constructor(value, node) {
        this.param = value.param;
        this.type = value.type;
        this.value = value.value;
        this.optionals = value.optionals;
        this.node = node;
    }
    get serialized() {
        return {
            param: this.param,
            type: this.type,
            value: this.value,
            optionals: this.optionals
        };
    }
}
class EditorNode {
    constructor(structure, x, y, id) {
        if (id)
            this.id = id;
        else {
            this.id = "Node" + EditorNode.idCounter;
            EditorNode.idCounter++;
        }
        this.title = structure.title;
        this.disabled = structure.disabled;
        this.inParams = Array.from(structure.in, (con) => new Connector(con, ConnectorType.input, this));
        this.outParams = Array.from(structure.out, (con) => new Connector(con, ConnectorType.output, this));
        this.values = Array.from(structure.value, (val) => new NodeValue(val, this));
        this.nodeComponent = NodeEditor.ui.addNode(this, x, y);
        this.checkRequiredInputs();
    }
    move(dx, dy) {
        this.nodeComponent.move(dx, dy);
    }
    remove() {
        for (let param of this.inParams)
            param.removeAllConnections();
        for (let param of this.outParams)
            param.removeAllConnections();
        NodeEditor.instance.removeNode(this.id);
    }
    addConnection(param) {
        if (NodeEditor.instance.isConnectionStaged()) {
            let conn = NodeEditor.stagedConnection;
            if (conn.connect(param)) {
                NodeEditor.instance.clearStagedConnection();
                conn.move(0, 0);
            }
            return;
        }
        let connection = new Connection(param);
        NodeEditor.instance.stageConnection(connection);
    }
    get serialized() {
        return {
            title: this.title,
            id: this.id,
            pos: {
                x: this.nodeComponent.pos.x,
                y: this.nodeComponent.pos.y
            },
            value: this.values.map(v => v.serialized),
            in: this.inParams.map(p => p.serialized),
            out: this.outParams.map(p => p.serialized),
            disabled: this.disabled
        };
    }
    checkRequiredInputs() {
        for (let connector of this.inParams)
            if (connector.connectionCount == 0) {
                this.nodeComponent.setNotActive();
                return;
            }
        this.nodeComponent.setActive();
    }
    static load(data) {
        let node = new EditorNode(data, data.pos.x, data.pos.y, data.id);
        let id = data.id;
        let num = Number(id.slice(4));
        EditorNode.idCounter = Math.max(EditorNode.idCounter, num + 1);
        return node;
    }
    getConnector(inout, param) {
        let connectors = inout == ConnectorType.input ? this.inParams : this.outParams;
        for (let conn of connectors)
            if (conn.parameter == param)
                return conn;
    }
}
EditorNode.idCounter = 0;
class NodeEditor {
    constructor() {
        this.nodes = {};
        this.connections = {};
        this.selectedNodes = {};
        this.stagedConnection = null;
    }
    static get instance() {
        if (!this.instanceObject) {
            this.instanceObject = new this();
        }
        return this.instanceObject;
    }
    init() {
    }
    moveNodes(dx, dy) {
        for (let node in this.selectedNodes)
            this.selectedNodes[node].move(dx, dy);
        if (this.stagedConnection)
            this.stagedConnection.move(dx, dy);
    }
    initFunctions(data) {
        let types = [];
        this.functions = data;
        for (let func in data) {
            let structure = data[func];
            NodeEditor.ui.loadFunction(structure, (x, y) => {
                let node = new EditorNode(structure, x, y);
                this.nodes[node.id] = node;
                this.selectNode(node.id);
            });
            types = types.concat(usesTypes(structure).filter((item) => types.indexOf(item) < 0));
        }
        Application.ui.setupStyles(types);
        if (!objectEmpty(this.nodes))
            this.revalidate();
    }
    revalidate() {
        let graph = this.serialized;
        this.load(graph);
    }
    selectNode(nodeID) {
        this.selectedNodes[nodeID] = this.nodes[nodeID];
    }
    deselectNode(nodeID) {
        delete this.selectedNodes[nodeID];
    }
    deselectAllNodes() {
        for (let nodeID in this.selectedNodes) {
            this.deselectNode(nodeID);
        }
    }
    connectionExists(key) {
        return key in this.connections;
    }
    addConnection(connection) {
        this.connections[connection.key] = connection;
    }
    removeConnection(connectionID) {
        delete this.connections[connectionID];
    }
    removeNode(nodeID) {
        delete this.nodes[nodeID];
    }
    stageConnection(conn) {
        this.stagedConnection = conn;
    }
    cancelStagedConnection() {
        this.stagedConnection.remove();
        this.clearStagedConnection();
    }
    clearStagedConnection() {
        this.stagedConnection = null;
    }
    isConnectionStaged() {
        return this.stagedConnection != null;
    }
    debugMessage(title, message) {
        Application.ui.messages.addMessage(title, message, 0);
    }
    validateParameter(p, structParams) {
        for (let sp of structParams) {
            if (sp.param == p.param && sp.type == p.type)
                return true;
        }
        return false;
    }
    validateStructure(struct) {
        if (!(struct.title in this.functions)) {
            this.debugMessage("Node structure not valid", `Node ${struct.title} is unknown.`);
            return false;
        }
        let f = this.functions[struct.title];
        if (f.in.length != struct.in.length || f.out.length != struct.out.length) {
            this.debugMessage("Node structure not valid", `Node ${struct.title} has ${struct.in.length} inputs (${f.in.length} expected) and ${struct.out.length} outputs (${f.out.length} expected).`);
            return false;
        }
        for (let p of f.in)
            if (!this.validateParameter(p, struct.in)) {
                this.debugMessage("Node structure not valid", `Node ${struct.title} missing input parameter ${p.param} [type ${p.type}].`);
                return false;
            }
        for (let p of f.out)
            if (!this.validateParameter(p, struct.out)) {
                this.debugMessage("Node structure not valid", `Node ${struct.title} missing output parameter ${p.param} [type ${p.type}].`);
                return false;
            }
        return true;
    }
    sortParameters(structParams, templateParams) {
        let params = [];
        for (let p of templateParams)
            for (let sp of structParams)
                if (p.param == sp.param)
                    params.push(sp);
        return params;
    }
    sortConnectors(struct) {
        struct.in = this.sortParameters(struct.in, this.functions[struct.title].in);
        struct.out = this.sortParameters(struct.out, this.functions[struct.title].out);
    }
    updateStructure(struct) {
        struct.description = this.functions[struct.title].description;
        struct.disabled = this.functions[struct.title].disabled;
        this.sortConnectors(struct);
    }
    validateConnection(inputNode, outNode) {
        if (!(inputNode in this.nodes && outNode in this.nodes))
            return false;
        return true;
    }
    load(contents) {
        try {
            let data = JSON.parse(contents);
            this.clear();
            Application.ui.messages.closeAllMessages();
            for (let node of data) {
                if (this.validateStructure(node)) {
                    this.updateStructure(node);
                }
                else {
                    node["disabled"] = true;
                }
                let n = EditorNode.load(node);
                this.nodes[n.id] = n;
            }
            for (let node of data)
                for (let param of node.in)
                    for (let conn of param.connections) {
                        if (!this.validateConnection(conn.out.node, conn.in.node))
                            continue;
                        let outConn = this.nodes[conn.out.node].getConnector(ConnectorType.output, conn.out.connector);
                        let inConn = this.nodes[conn.in.node].getConnector(ConnectorType.input, conn.in.connector);
                        Connection.load(outConn, inConn);
                    }
        }
        catch (error) {
            console.error(error);
            this.debugMessage("Loading file failed", "The file format is corrupted.");
        }
    }
    get serialized() {
        let nodes = [];
        for (let node in this.nodes)
            nodes.push(this.nodes[node].serialized);
        return JSON.stringify(nodes);
    }
    recieved(data) {
        if (!("status" in data)) {
            console.error("unmarked data for node editor", data);
            return;
        }
        switch (data.status) {
            case 'functionsLoaded':
                this.initFunctions(data.functions);
                break;
            case 'pipelineDone':
                break;
            case 'error':
                this.debugMessage("Pipeline Error", data.error);
                break;
            case 'nodeStarted':
                this.debugMessage("Pipeline progress", `Node ${data.title} started.`);
                break;
            case 'nodeDone':
                this.debugMessage("Pipeline progress", `Node ${data.title} finished.`);
                break;
            case 'progress':
                Application.ui.messages.updateProgressbar(data.progressID, data.progress, data.message);
                break;
            case 'pipelineDone':
                break;
            default:
                break;
        }
    }
    runProject() {
        let content = this.serialized;
        Application.ui.messages.closeAllMessages();
        DataManager.instance.send({
            command: 'run',
            graph: content
        });
    }
    clear() {
        for (let node in this.nodes)
            this.nodes[node].remove();
        Application.ui.clear();
    }
    static get ui() {
        return Application.instance.ui.components.nodeEditor;
    }
    static get stagedConnection() {
        return NodeEditor.instance.stagedConnection;
    }
}
class Application {
    constructor() { }
    static get instance() {
        if (!this.instanceObject) {
            this.instanceObject = new this();
        }
        return this.instanceObject;
    }
    init(main) {
        this.ui = new ApplicationComponent();
        this.ui.compile(main);
        NodeEditor.instance.init();
        Viewer.instance.init();
        Viewer.instance.startRender();
        DataManager.instance.setupInstance((data) => {
            this.recieved(data);
        });
        DataManager.instance.send({
            'command': 'loadFunctions'
        });
    }
    recieved(data) {
        console.log(data);
        if (data.recipient == "editor")
            NodeEditor.instance.recieved(data);
        else if (data.recipient == "viewer")
            Viewer.instance.recieved(data);
        else
            console.error("message misses recipient", data);
    }
    static get ui() {
        return Application.instance.ui;
    }
}
function saveProject() {
    let content = NodeEditor.instance.serialized;
    let options = {
        defaultPath: 'project.json',
        filters: [{
                extensions: ['json']
            }]
    };
    dialog.showSaveDialog(options).then((result) => {
        let filename = result.filePath;
        if (filename === undefined) {
            return;
        }
        fs.writeFile(filename, content, (err) => {
            if (err) {
                return;
            }
        });
    }).catch((err) => {
        alert(err);
    });
}
;
function openProject() {
    let options = {
        filters: [{
                extensions: ['json']
            }]
    };
    dialog.showOpenDialog(options).then((result) => {
        let filename = result.filePaths[0];
        if (filename === undefined) {
            return;
        }
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                throw err;
            }
            const content = data;
            NodeEditor.instance.load(content);
        });
    }).catch((err) => {
        alert(err);
    });
}
function runProject() {
    NodeEditor.instance.runProject();
}
;
const { ipcRenderer, remote } = require('electron');
const dialog = remote.dialog;
const fs = require('fs');
window.onload = function () {
    const main = document.getElementById("main");
    Application.instance.init(main);
};
window.onresize = (ev) => {
    NodeEditor.ui.resize();
    Viewer.instance.resize();
};
//# sourceMappingURL=script.js.map