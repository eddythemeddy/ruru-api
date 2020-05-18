var ace = ace || {};
ace.analytics = ace.analytics || {};
/**
 * Module for segment metrics tracking events.
 * @module Metrics
 */
ace.analytics.Metrics = function() {
    "use strict";
    var PROD_LOG_KEY = "EfO4XtTnlB1E00O5rxNqsLPBk7mOXLbb";
    var TEST_LOG_KEY = "hcILfbkw2gwUqAgYxDspxFGVgJL2jLba";
    var METRICS_EVENT_NAME = 'atlGlobalMetrics';

    var METRICS_KEYS = {
        TIME_TO_LOAD: 'timeToLoad',
        TIME_TO_SEGMENT_LOAD: 'timeToSegmentLoad',
        TIME_TO_AVAILABLE: 'timeToAvailable',
        TIME_TO_READY: 'timeToReady',
        TIME_TO_USERDATA: 'timeToUserDataSetCall',
        TIME_TO_USER_COMPLETE: 'timeToUserDataComplete'
    };

    var metricsData = {};

    /**
     * Store the value of a single performance metric
     * @function logMetrics
     * @param {METRICS_KEYS} metricKey - the metric to log
     * @param {number} mockDate - a mock timestamp
     */
    function logMetric(metricKey, mockDate) {
        metricsData[metricKey] = mockDate || new Date();
    }

    /**
     * Logs an performance metrics track call to segment via the HTTP API
     * @function sendMetrics
     * @param {object} mockReq used in testing so we don't actually send anything to Segment
     */
    function sendMetrics(mockReq) {
        if (!ace.analytics.Metrics.loadTimestamp) {
            return;
        }
        // calculate all of the times
        for (var key in metricsData) {
            if (metricsData.hasOwnProperty(key)) {
                if (metricsData[key] > 0) {
                    metricsData[key] = metricsData[key] - ace.analytics.Metrics.loadTimestamp;
                }
            }
        }

        var writeKey = (ace.mkt.Helpers.getEnvironment() === ace.mkt.Helpers.ENVIRONMENT.PROD) ? PROD_LOG_KEY : TEST_LOG_KEY;
        var cohort = ace.analytics.Cohort.readAtlCohort();
        var properties = {
            metrics: metricsData,
            atlJSVersion: ace.analytics.version,
            cohort: cohort ? cohort.bucketAll.index : null,
            host: mockReq ? mockReq.hostFake : window.location.host,
            path: mockReq ? mockReq.pathFake : window.location.pathname,
            pageViewId: ace.analytics.Tracking.getPageViewId(), // used to tie to other Segment events
        };

        var ajsCookie = ace.mkt.Cookie.readCookie('ajs_anonymous_id');
        var userId = ajsCookie ? decodeURIComponent(ajsCookie).replace(/['"]+/g, '') : "undefined";

        ace.mkt.Helpers.logEvent(writeKey, userId, METRICS_EVENT_NAME, properties, mockReq);

        metricsData = {};
    }

    // testing only
    function resetMetrics() {
        metricsData = {};
    }

    return {
        logMetric: logMetric,
        sendMetrics: sendMetrics,
        resetMetrics: resetMetrics,
        METRICS_KEYS: METRICS_KEYS,
        PROD_LOG_KEY: PROD_LOG_KEY,
        TEST_LOG_KEY: TEST_LOG_KEY,
    };
}();

var ace = ace || {};
ace.mkt = ace.mkt || {};

ace.mkt.Cookie = function() {
    "use strict";

    function getCookieUrl(cookieName, defaultUrl) {
        var cookieUrl = ace.mkt.Cookie.readCookie(cookieName);
        if (cookieUrl !== null) {
            return cookieUrl;
        }

        return defaultUrl;
    }

    function readCookie(name) {
        try {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1, c.length);
                }
                if (c.indexOf(nameEQ) === 0) {
                    return c.substring(nameEQ.length, c.length);
                }
            }
        } catch (e) {}
        return null;
    }

    function writeCookie(name, value, days, topLevelDomain) {
        var seconds = days ? days * 24 * 60 * 60 : null;

        ace.mkt.Cookie.writeCookieInSeconds(name, value, seconds, topLevelDomain);
    }

    function writeCookieInSeconds(name, value, seconds, topLevelDomain) {
        try {
            var expires = "";

            if (seconds) {
                var date = new Date();
                date.setTime(date.getTime() + (seconds * 1000));
                expires = "; expires=" + date.toGMTString();
            }

            var cookie = name + "=" + value + expires + "; path=/;";

            var domain = window.location.hostname;
            if (domain !== 'localhost' && topLevelDomain === true) {
                var domainTokens = domain.split(".");
                if (domainTokens.length > 1) {
                    var lastToken = domainTokens[(domainTokens.length - 1)];
                    var secondLastToken = domainTokens[(domainTokens.length - 2)];
                    if (isNaN(lastToken) || isNaN(secondLastToken)) {
                        domain = "." + secondLastToken + "." + lastToken;
                    }
                }

                cookie += " domain=" + domain + ";";
            }
            document.cookie = cookie;
        } catch (e) {}
    }

    return {
        getCookieUrl: getCookieUrl,
        readCookie: readCookie,
        writeCookie: writeCookie,
        writeCookieInSeconds: writeCookieInSeconds
    };
}();
var ace = ace || {};
ace.mkt = ace.mkt || {};

/**
 * This module enables sending messages between windows (iframes) in a cross-origin safe way.  It is tested in IE9+ and
 * the most recent versions of Chrome/Safari/Firefox.  Messages are serialized as JSON for IE9 compatibility. Messages
 * which were not created by this module will be ignored.
 */
ace.mkt.CrossOriginMessenger = function() {
    "use strict";
    var MODULE_IDENTIFIER = "ace.mkt.CrossOriginMessenger";
    var listeners = [];

    /**
     * Creates a message
     * @param type - A string representing a message type.  Listeners are registered by type.
     * @param payload - The message body.  This can be any JavaScript object which can be serialized to JSON
     * @returns A serialized message object
     */
    function createMessage(type, payload) {
        return JSON.stringify({
            type: type,
            payload: payload,
            source: MODULE_IDENTIFIER
        });
    }

    /**
     * Sends a message to the specified window
     * @param targetWindow - The target window or iFrame
     * @param domain - The domain of the target window including protocol and port (i.e. "http://atlassian.net:8080")
     * @param message - A message generated by the create message object
     */
    function sendMessage(targetWindow, domain, message) {
        targetWindow.postMessage(message, domain);
    }

    /**
     * Add a listener to the current window which listens for messages from another window
     * @param type - The message type you want to listen for
     * @param domain - The domain of the window you want to listen to including protocol and port
     *                 (i.e. "http://atlassian.net:8080")
     * @param callback - A callback method that will be executed and passed the message
     */
    function addListener(type, domain, callback) {
        listeners.push({
            type: type,
            domain: processDomain(domain),
            callback: callback
        });
    }

    /**
     * Remove all listeners that have been set
     */
    function clearAllListeners() {
        listeners = [];
    }

    /************************************* Everything below this line is private *************************************/

    // Strips off default port numbers for http and https
    function processDomain(domain) {
        return domain
            .replace(/(^https:\/\/.*):443$/, "$1")
            .replace(/(^http:\/\/.*):80$/, "$1");
    }

    function processMessage(event) {
        var message = parseJSON(event.data);
        if (isMessageMine(message)) {
            callbackListeners(message, event.origin);
        }
    }

    function parseJSON(s) {
        try {
            return JSON.parse(s);
        } catch (err) {
            return undefined;
        }
    }

    function isMessageMine(message) {
        return message && message.source === MODULE_IDENTIFIER;
    }

    function callbackListeners(message, origin) {
        for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];
            if (listener.type === message.type && isCompatibleDomain(listener, origin)) {
                listener.callback(message);
            }
        }
    }

    function isCompatibleDomain(listener, origin) {
        return origin.indexOf(listener.domain) === 0;
    }

    window.addEventListener("message", processMessage, false);

    return {
        createMessage: createMessage,
        sendMessage: sendMessage,
        addListener: addListener,
        clearAllListeners: clearAllListeners
    };
}();
var ace = ace || {};
ace.mkt = ace.mkt || {};

ace.mkt.Guid = function() {
    "use strict";

    function guid() {
        return Math.guid();
    }

    function guidNoDashes() {
        return Math.guid().replace(/-/g, '');
    }

    /**
     * Convert a GUID deterministically based on the passed in number
     * @param number - a number to modify the guid by
     * @returns the modified guid or the original in case of failure
     */
    function addNumberToGUID(guid, number) {
        // take the last 4 digits and convert to a hex string representation
        var hex = guid.slice(-4);
        var value = parseInt(hex, 16);
        if (isNaN(value)) {
            return guid;
        }
        var valLength = value.toString(16).length;
        value += number;
        // clamp to 2 bytes
        if (value > 65535) {
            value -= 65536;
        } else if (value < 0) {
            value += 65536;
        }
        // convert back to hex and make sure its as long as many digits as the initial value
        // This is needed for subtraction
        hex = value.toString(16);
        if (hex.length < valLength) {
            hex = ("00000" + hex).slice(-valLength);
        }
        // replace the last 4 digits of the guid with the last 4 digits of the converted value
        return guid.slice(0, guid.length - hex.length) + hex;
    }

    // guidHashCode takes in a String and returns a Number
    // e.g. "51c96b99-f1b0-4727-9802-a40c096929ae" => 411024693
    function guidHashCode(guid) {
        var hash = 0;
        for (var i = 0; i < guid.length; i++) {
            hash += Math.pow(guid.charCodeAt(i) * 31, guid.length - i);
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    return {
        guid: guid,
        guidNoDashes: guidNoDashes,
        addNumberToGUID: addNumberToGUID,
        guidHashCode: guidHashCode,
    };
}();
var ace = ace || {};
ace.mkt = ace.mkt || {};

ace.mkt.Helpers = function() {
    "use strict";

    // This regex is the simplified RFC 5322 expression from http://www.regular-expressions.info/email.html
    var EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
    var pathOverride = "/path-contained-email-address";

    var ENVIRONMENT = {
        LOCAL: 'local',
        DEV: 'dev',
        STAGE: 'stage',
        PROD: 'prod',
    };

    if (!window.location.origin) {
        window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
    }

    function getWrapperScript() {
        var script = getScript('atl-global');
        if (script === null || script.source === null) {
            script = getScript('atl-analytics');
        }
        return script;
    }
    // Searches the DOM for a script with the name 'scriptName' and returns its path
    function getScript(scriptName) {
        try {
            // get the source of where this script was loaded
            var scriptExtension = '.min.js';

            var script = document.querySelector('script[src*="' + scriptName + scriptExtension + '"]');
            if (!script) {
                scriptExtension = '.js';
                script = document.querySelector('script[src*="' + scriptName + scriptExtension + '"]');
            }
            if (!script) {
                return null;
            }
            var index = script.src.indexOf(scriptName + scriptExtension);
            // get the domain where loaded from and load the version specified
            return {
                source: script.src.substring(0, index),
                extension: scriptExtension
            };
        } catch (e) {
            return null;
        }
    }

    // returns the runtime environment based on the URL
    function getEnvironment() {
        var script = ace.mkt.Helpers.getWrapperScript();
        if (script && script.source) {
            var host = script.source;
            if (host.match('localhost:') || host.match('127.0.0.1:')) {
                return ENVIRONMENT.LOCAL;
            }
            if (host.match('/stp/qa/') || host.match('atl-global.stg')) {
                return ENVIRONMENT.STAGE;
            }
            if (host.match('/stp/current/') || host.match('atl-global.atlassian')) {
                return ENVIRONMENT.PROD;
            }
        }
        return ENVIRONMENT.DEV;
    }

    function addLoadEvent(func) {
        if (document.readyState === "complete") {
            func();
        } else if (window.addEventListener) {
            window.addEventListener("load", func, false);
        } else if (window.attachEvent) {
            window.attachEvent("onload", func);
        } else { // fallback
            var old = window.onload;
            window.onload = function() {
                if (old) {
                    old();
                }
                func();
            };
        }
    }

    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(window.location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function getBaseUrl() {
        if (window.location.origin) {
            return window.location.origin;
        }

        return window.location.protocol + '//' +
            window.location.hostname +
            (window.location.port ? (':' + window.location.port) : '');
    }

    function getUtms(utms) {
        if (window.location.search.indexOf("utm_")) {
            for (var utmKey in utms) {
                if (utms.hasOwnProperty(utmKey)) {
                    utms[utmKey] = ace.mkt.Helpers.getParameterByName(utmKey);
                }
            }
        }
        return utms;
    }

    // taken from https://github.com/segmentio/canonical/blob/master/lib/index.js
    /* jshint ignore:start*/
    function canonical() {
        var tags = document.getElementsByTagName('link');
        for (var i = 0, tag; tag = tags[i]; i++) {
            if (tag.getAttribute('rel') === 'canonical') {
                return tag.getAttribute('href');
            }
        }
    }

    // taken from https://github.com/segmentio/analytics.js-core/blob/master/lib/pageDefaults.js
    function getCanonicalUrl() {
        var canon = canonical();
        if (canon) return canon;
        var url = window.location.href;
        var i = url.indexOf('#');
        return i === -1 ? url : url.slice(0, i);
    }
    /* jshint ignore:end */

    function urlContainsEmail(url) {
        return decodeURIComponent(url).match(EMAIL_REGEX);
    }

    function emailAddressIsDetected() {
        return urlContainsEmail(window.location.href) || urlContainsEmail(document.referrer);
    }

    function addActualUrl(obj) {
        if (window.location.href !== getCanonicalUrl()) {
            // respect cleaned url
            if (obj.url) {
                obj.actualUrl = obj.url;
            } else {
                obj.actualUrl = window.location.href;
            }
        }
    }

    function addCleanedUrlAndPaths(obj) {
        obj.url = window.location.origin + pathOverride;
        obj.path = pathOverride;
        obj.search = "";
        return obj;
    }

    function addCleanedReferrer(obj) {
        obj.referrer = urlWithoutPath(document.referrer) + pathOverride;
        return obj;
    }

    function urlWithoutPath(url) {
        var faketag = document.createElement('a');
        faketag.href = url;
        return faketag.protocol + "//" + faketag.host;
    }

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    function hostnameFromUrl(url) {
        return url.replace(/http(s|):\/\//g, '').split(/(\/|:)/g)[0];
    }

    function isObject(o) {
        return o !== null && typeof o === 'object' && Array.isArray(o) === false;
    }

    /* Copyright (c) 2014, Hugh Kennedy
     * https://github.com/hughsk/flat
     * All rights reserved.    
     */
    function flattenObject(target, opts) {
        /*
         * Determine if an object is a Buffer
         *
         * @author   Feross Aboukhadijeh <https://feross.org>
         * @license  MIT
         */
        function isBuffer(obj) {
            return obj !== null && obj.constructor !== null &&
                typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
        }

        opts = opts || {};

        var delimiter = opts.delimiter || '.';
        var maxDepth = opts.maxDepth;
        var output = {};

        function step(object, prev, currentDepth) {
            currentDepth = currentDepth || 1;
            Object.keys(object).forEach(function(key) {
                var value = object[key];
                var isarray = opts.safe && Array.isArray(value);
                var type = Object.prototype.toString.call(value);
                var isbuffer = isBuffer(value);
                var isobject = (type === '[object Object]' || type === '[object Array]');

                var newKey = prev ? prev + delimiter + key : key;

                if (!isarray && !isbuffer && isobject && Object.keys(value).length &&
                    (!opts.maxDepth || currentDepth < maxDepth)) {
                    return step(value, newKey, currentDepth + 1);
                }

                output[newKey] = value;
            });
        }

        step(target);

        return output;
    }

    function flattenDataToObject(obj, key, data) {
        var tempObject = {};
        tempObject[key] = ace.mkt.Helpers.flattenObject(data);
        tempObject = ace.mkt.Helpers.flattenObject(tempObject);
        // copy the flattened data to the previous data object that was passed in
        Object.keys(tempObject).forEach(function(key) {
            obj[key] = tempObject[key];
        });
        return obj;
    }

    /**
     * Attempts to send an event track call to segment via the HTTP API. 
     * @function logEvent
     * @param {string} writeKey the write key used to initialize the segment wrapper
     * @param {string} userId the user's anonymousId
     * @param {string} event the event type
     * @param {object} properties a dictionary of data to send with the event
     * @param {object} mockReq used in testing so we don't actually send anything to Segment
     */
    function logEvent(writeKey, userId, event, properties, mockReq) {
        var eventObj = {
            userId: userId,
            event: event,
            properties: properties,
            writeKey: writeKey,
        };
        var headers = [{
            header: "Content-type",
            value: "text/plain"
        }];
        ace.mkt.Helpers.makeRestRequest('POST', 'https://api.segment.io/v1/t', headers, JSON.stringify(eventObj), false, null, mockReq);
    }

    /**
     * returns number and boolean types for string values
     * @function parseValue
     * @param {*} value 
     * @ignore
     */
    function parseValue(value) {
        if (!Number.isNaN(Number(value)) && (typeof value === 'string' && value.trim() !== '')) {
            value = Number(value);
        } else if (value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
            value = value.toLowerCase() === 'true';
        }

        return value;
    }

    /**
     * Converts query parameters to JSON object. Solution based on https://github.com/sindresorhus/query-string
     * @function queryString
     * @param {string} input 
     * @returns {object} string formatted in JSON
     * @ignore
     */
    function queryString(input) {

        var ret = {};

        if (typeof input !== 'string') {
            return ret;
        }

        input = input.trim().replace(/^[?#&]/, '');

        if (!input) {
            return ret;
        }

        var params = input.split('&');
        for (var i = 0; i < params.length; i++) {
            // turn '+' into space
            params[i] = params[i].replace(/\+/g, ' ');
            var index = params[i].indexOf('=');
            var key = params[i];
            var value = undefined;
            if (index >= 0) {
                key = params[i].slice(0, index);
                value = params[i].slice(index + 1);
            }

            // Missing `=` should be `null`:
            // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
            try {
                value = value === undefined ? null : decodeURIComponent(value);
                key = decodeURIComponent(key);
            } catch (e) {
                // just leave it
            }
            if (ret[key] === undefined) {
                ret[key] = value;
            } else {
                ret[key] = [].concat(ret[key], value);
            }
        }

        Object.keys(ret).forEach(function(key) {
            var value = ret[key];
            if (typeof value === 'object' && value !== null) {
                Object.keys(value).forEach(function(key) {
                    value[key] = parseValue(value[key]);
                });
            } else {
                ret[key] = parseValue(value);
            }
        });

        return ret;
    }

    /**
     * Attempts to send an HTTP request.
     * @function makeRestRequest
     * @param {string} method the request method
     * @param {string} url the request URL
     * @param {Object[]} headers an array of headers to set in the request
     * @param {string} body the body of the request
     * @param {boolean} credentials whether to send request with credentials; defaults to false
     * @param {callback} callback optional callback function
     * @param {object} mockReq used in testing so we don't actually send a request
     */
    function makeRestRequest(method, url, headers, body, credentials, callback, mockReq) {
        var xhr = mockReq || new XMLHttpRequest();
        xhr.open(method, url);
        xhr.withCredentials = credentials ? credentials : false;

        if (!!headers) {
            // set headers
            for (var h = 0; h < headers.length; h++) {
                xhr.setRequestHeader(headers[h].header, headers[h].value);
            }
        }

        if (!body) {
            body = null;
        }

        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (callback) {
                        callback(xhr.responseText);
                    }
                } else {
                    if (callback) {
                        callback('error');
                    }
                }
            }
        };
        xhr.send(body);
    }

    function sendWrapperLoadError() {
        var loadErrorFlag = ace.analytics.LaunchDarkly.getFeatureFlagForUser('load-error-logging');

        if (loadErrorFlag) {
            var url = ace.mkt.Helpers.getEnvironment() === ace.mkt.Helpers.ENVIRONMENT.PROD ? 'https://www.atlassian.com/endpoint/atlglobalload' : 'https://wac.stg.internal.atlassian.com/endpoint/atlglobalload';
            var headers = [{
                header: "Content-type",
                value: "text/plain"
            }];
            ace.mkt.Helpers.makeRestRequest('GET', url, headers, null, false);
        }
    }

    return {
        addActualUrl: addActualUrl,
        addLoadEvent: addLoadEvent,
        ENVIRONMENT: ENVIRONMENT,
        getScript: getScript,
        getWrapperScript: getWrapperScript,
        getParameterByName: getParameterByName,
        getBaseUrl: getBaseUrl,
        getEnvironment: getEnvironment,
        getUtms: getUtms,
        getCanonicalUrl: getCanonicalUrl,
        urlWithoutPath: urlWithoutPath,
        urlContainsEmail: urlContainsEmail,
        addCleanedUrlAndPaths: addCleanedUrlAndPaths,
        addCleanedReferrer: addCleanedReferrer,
        emailAddressIsDetected: emailAddressIsDetected,
        endsWith: endsWith,
        hostnameFromUrl: hostnameFromUrl,
        isObject: isObject,
        flattenObject: flattenObject,
        flattenDataToObject: flattenDataToObject,
        logEvent: logEvent,
        makeRestRequest: makeRestRequest,
        queryString: queryString,
        sendWrapperLoadError: sendWrapperLoadError,
    };
}();



/**
 * See:
 *  - http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/24891600#24891600
 * for more context around the issue of psuedo-randomness used by browsers and the solution used below.
 *
 * and:
 *  - http://web.archive.org/web/20120503063359/http://baagoe.com/en/RandomMusings/javascript/
 * for info regarding the Alea code used below.
 */
Math.trueRandom = (function() {

    function Mash() {
        var n = 0xefc8249d;

        var mash = function(data) {
            data = data.toString();
            for (var i = 0; i < data.length; i++) {
                n += data.charCodeAt(i);
                var h = 0.02519603282416938 * n;
                n = h >>> 0;
                h -= n;
                h *= n;
                n = h >>> 0;
                h -= n;
                n += h * 0x100000000; // 2^32
            }
            return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
        };

        mash.version = 'Mash 0.9';
        return mash;
    }

    function Alea() {
        return (function(args) {
            // Johannes BaagÃ¸e <baagoe@baagoe.com>, 2010
            var s0 = 0;
            var s1 = 0;
            var s2 = 0;
            var c = 1;

            if (args.length == 0) {
                args = [+new Date()];
            }
            var mash = Mash();
            s0 = mash(' ');
            s1 = mash(' ');
            s2 = mash(' ');

            for (var i = 0; i < args.length; i++) {
                s0 -= mash(args[i]);
                if (s0 < 0) {
                    s0 += 1;
                }
                s1 -= mash(args[i]);
                if (s1 < 0) {
                    s1 += 1;
                }
                s2 -= mash(args[i]);
                if (s2 < 0) {
                    s2 += 1;
                }
            }
            mash = null;

            var random = function() {
                var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
                s0 = s1;
                s1 = s2;
                return s2 = t - (c = t | 0);
            };
            random.uint32 = function() {
                return random() * 0x100000000; // 2^32
            };
            random.fract53 = function() {
                return random() +
                    (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
            };
            random.version = 'Alea 0.9';
            random.args = args;
            return random;

        }(Array.prototype.slice.call(arguments)));
    };
    return Alea();
}());

Math.guid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.trueRandom() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
var ace = ace || {};
ace.mkt = ace.mkt || {};

ace.mkt.StorageManager = (function() {
    "use strict";
    var DELIMITER = "#";
    var PREFIX_MATCH = /\d+#/;

    var instance = function(prefix, id) {
        this.prefix = prefix;
        this.id = id;
        this.namespace = this.prefix + "." + this.id;

        try {
            this.localStorageSupported = 'localStorage' in window && window.localStorage !== null;
        } catch (e) {}
    };

    instance.prototype = {

        getPrefix: function(seconds) {
            var milliseconds = (seconds || 0) * 1000;
            if (!milliseconds) {
                return '';
            }
            return +new Date() + milliseconds + DELIMITER;
        },

        /**
         * Gets the item stored in local storage for the given key. null is returned if it doesn't exist.
         * Note that this method will always return a string representation of what is stored.
         *
         * @param key
         */
        getItem: function(key) {
            if (!this.localStorageSupported) {
                return null;
            }
            var item = localStorage.getItem(this.namespace + "." + key);
            var match = PREFIX_MATCH.exec(item);
            if (match === true) {
                item = item.replace(match[0], '');
                if (+new Date() > match[0].replace("#", '')) {
                    localStorage.removeItem(this.namespace + "." + key);
                    return null;
                }
            }
            return item;
        },

        /**
         * Returns a boolean to let you know if we contain a key that matches, and has not expired.
         * @param key
         */
        contains: function(key) {
            return !!this.getItem(key);
        },

        setItem: function(key, value, expire) {
            if (!this.localStorageSupported) {
                return;
            }
            value = this.getPrefix(expire) + value;
            localStorage.setItem(this.namespace + "." + key, value);
        },

        removeItem: function(key) {
            if (!this.localStorageSupported) {
                return;
            }
            localStorage.removeItem(this.namespace + "." + key);
        }
    };

    return {
        instance: instance
    };

})();

var ace = ace || {};
ace.mkt = ace.mkt || {};

ace.mkt.MessageTypes = {
    atlPathEstablished: "atlPathEstablished"
};

var globalRequire = (function() {
    "use strict";

    //Define a require object here that has any
    //default configuration you want for RequireJS. If
    //you do not have any config options you want to set,
    //just use an simple object literal, {}. You may need
    //to at least set baseUrl.
    var require = {};

    /** vim: et:ts=4:sw=4:sts=4
     * @license RequireJS 2.3.6 Copyright jQuery Foundation and other contributors.
     * Released under MIT license, https://github.com/requirejs/requirejs/blob/master/LICENSE
     */
    //Not using strict: uneven strict support in browsers, #392, and causes
    //problems with requirejs.exec()/transpiler plugins that may not be strict.
    /*jslint regexp: true, nomen: true, sloppy: true */
    /*global window, navigator, document, importScripts, setTimeout, opera */

    var requirejs, define;
    (function(global, setTimeout) {
        var req, s, head, baseElement, dataMain, src,
            interactiveScript, currentlyAddingScript, mainScript, subPath,
            version = '2.3.6',
            commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg,
            cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
            jsSuffixRegExp = /\.js$/,
            currDirRegExp = /^\.\//,
            op = Object.prototype,
            ostring = op.toString,
            hasOwn = op.hasOwnProperty,
            isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
            isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
            //PS3 indicates loaded and complete, but need to wait for complete
            //specifically. Sequence is 'loading', 'loaded', execution,
            // then 'complete'. The UA check is unfortunate, but not sure how
            //to feature test w/o causing perf issues.
            readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
            /^complete$/ : /^(complete|loaded)$/,
            defContextName = '_',
            //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
            isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
            contexts = {},
            cfg = {},
            globalDefQueue = [],
            useInteractive = false;

        //Could match something like ')//comment', do not lose the prefix to comment.
        function commentReplace(match, singlePrefix) {
            return singlePrefix || '';
        }

        function isFunction(it) {
            return ostring.call(it) === '[object Function]';
        }

        function isArray(it) {
            return ostring.call(it) === '[object Array]';
        }

        /**
         * Helper function for iterating over an array. If the func returns
         * a true value, it will break out of the loop.
         */
        function each(ary, func) {
            if (ary) {
                var i;
                for (i = 0; i < ary.length; i += 1) {
                    if (ary[i] && func(ary[i], i, ary)) {
                        break;
                    }
                }
            }
        }

        /**
         * Helper function for iterating over an array backwards. If the func
         * returns a true value, it will break out of the loop.
         */
        function eachReverse(ary, func) {
            if (ary) {
                var i;
                for (i = ary.length - 1; i > -1; i -= 1) {
                    if (ary[i] && func(ary[i], i, ary)) {
                        break;
                    }
                }
            }
        }

        function hasProp(obj, prop) {
            return hasOwn.call(obj, prop);
        }

        function getOwn(obj, prop) {
            return hasProp(obj, prop) && obj[prop];
        }

        /**
         * Cycles over properties in an object and calls a function for each
         * property value. If the function returns a truthy value, then the
         * iteration is stopped.
         */
        function eachProp(obj, func) {
            var prop;
            for (prop in obj) {
                if (hasProp(obj, prop)) {
                    if (func(obj[prop], prop)) {
                        break;
                    }
                }
            }
        }

        /**
         * Simple function to mix in properties from source into target,
         * but only if target does not already have a property of the same name.
         */
        function mixin(target, source, force, deepStringMixin) {
            if (source) {
                eachProp(source, function(value, prop) {
                    if (force || !hasProp(target, prop)) {
                        if (deepStringMixin && typeof value === 'object' && value &&
                            !isArray(value) && !isFunction(value) &&
                            !(value instanceof RegExp)) {

                            if (!target[prop]) {
                                target[prop] = {};
                            }
                            mixin(target[prop], value, force, deepStringMixin);
                        } else {
                            target[prop] = value;
                        }
                    }
                });
            }
            return target;
        }

        //Similar to Function.prototype.bind, but the 'this' object is specified
        //first, since it is easier to read/figure out what 'this' will be.
        function bind(obj, fn) {
            return function() {
                return fn.apply(obj, arguments);
            };
        }

        function scripts() {
            return document.getElementsByTagName('script');
        }

        function defaultOnError(err) {
            throw err;
        }

        //Allow getting a global that is expressed in
        //dot notation, like 'a.b.c'.
        function getGlobal(value) {
            if (!value) {
                return value;
            }
            var g = global;
            each(value.split('.'), function(part) {
                g = g[part];
            });
            return g;
        }

        /**
         * Constructs an error with a pointer to an URL with more information.
         * @param {String} id the error ID that maps to an ID on a web page.
         * @param {String} message human readable error.
         * @param {Error} [err] the original error, if there is one.
         *
         * @returns {Error}
         */
        function makeError(id, msg, err, requireModules) {
            var e = new Error(msg + '\nhttps://requirejs.org/docs/errors.html#' + id);
            e.requireType = id;
            e.requireModules = requireModules;
            if (err) {
                e.originalError = err;
            }
            return e;
        }

        if (typeof define !== 'undefined') {
            //If a define is already in play via another AMD loader,
            //do not overwrite.
            return;
        }

        if (typeof requirejs !== 'undefined') {
            if (isFunction(requirejs)) {
                //Do not overwrite an existing requirejs instance.
                return;
            }
            cfg = requirejs;
            requirejs = undefined;
        }

        //Allow for a require config object
        if (typeof require !== 'undefined' && !isFunction(require)) {
            //assume it is a config object.
            cfg = require;
            require = undefined;
        }

        function newContext(contextName) {
            var inCheckLoaded, Module, context, handlers,
                checkLoadedTimeoutId,
                config = {
                    //Defaults. Do not set a default for map
                    //config to speed up normalize(), which
                    //will run faster if there is no default.
                    waitSeconds: 7,
                    baseUrl: './',
                    paths: {},
                    bundles: {},
                    pkgs: {},
                    shim: {},
                    config: {}
                },
                registry = {},
                //registry of just enabled modules, to speed
                //cycle breaking code when lots of modules
                //are registered, but not activated.
                enabledRegistry = {},
                undefEvents = {},
                defQueue = [],
                defined = {},
                urlFetched = {},
                bundlesMap = {},
                requireCounter = 1,
                unnormalizedCounter = 1;

            /**
             * Trims the . and .. from an array of path segments.
             * It will keep a leading path segment if a .. will become
             * the first path segment, to help with module name lookups,
             * which act like paths, but can be remapped. But the end result,
             * all paths that use this function should look normalized.
             * NOTE: this method MODIFIES the input array.
             * @param {Array} ary the array of path segments.
             */
            function trimDots(ary) {
                var i, part;
                for (i = 0; i < ary.length; i++) {
                    part = ary[i];
                    if (part === '.') {
                        ary.splice(i, 1);
                        i -= 1;
                    } else if (part === '..') {
                        // If at the start, or previous value is still ..,
                        // keep them so that when converted to a path it may
                        // still work when converted to a path, even though
                        // as an ID it is less than ideal. In larger point
                        // releases, may be better to just kick out an error.
                        if (i === 0 || (i === 1 && ary[2] === '..') || ary[i - 1] === '..') {
                            continue;
                        } else if (i > 0) {
                            ary.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
            }

            /**
             * Given a relative module name, like ./something, normalize it to
             * a real name that can be mapped to a path.
             * @param {String} name the relative name
             * @param {String} baseName a real name that the name arg is relative
             * to.
             * @param {Boolean} applyMap apply the map config to the value. Should
             * only be done if this normalization is for a dependency ID.
             * @returns {String} normalized name
             */
            function normalize(name, baseName, applyMap) {
                var pkgMain, mapValue, nameParts, i, j, nameSegment, lastIndex,
                    foundMap, foundI, foundStarMap, starI, normalizedBaseParts,
                    baseParts = (baseName && baseName.split('/')),
                    map = config.map,
                    starMap = map && map['*'];

                //Adjust any relative paths.
                if (name) {
                    name = name.split('/');
                    lastIndex = name.length - 1;

                    // If wanting node ID compatibility, strip .js from end
                    // of IDs. Have to do this here, and not in nameToUrl
                    // because node allows either .js or non .js to map
                    // to same file.
                    if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                        name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                    }

                    // Starts with a '.' so need the baseName
                    if (name[0].charAt(0) === '.' && baseParts) {
                        //Convert baseName to array, and lop off the last part,
                        //so that . matches that 'directory' and not name of the baseName's
                        //module. For instance, baseName of 'one/two/three', maps to
                        //'one/two/three.js', but we want the directory, 'one/two' for
                        //this normalization.
                        normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                        name = normalizedBaseParts.concat(name);
                    }

                    trimDots(name);
                    name = name.join('/');
                }

                //Apply map config if available.
                if (applyMap && map && (baseParts || starMap)) {
                    nameParts = name.split('/');

                    outerLoop: for (i = nameParts.length; i > 0; i -= 1) {
                        nameSegment = nameParts.slice(0, i).join('/');

                        if (baseParts) {
                            //Find the longest baseName segment match in the config.
                            //So, do joins on the biggest to smallest lengths of baseParts.
                            for (j = baseParts.length; j > 0; j -= 1) {
                                mapValue = getOwn(map, baseParts.slice(0, j).join('/'));

                                //baseName segment has config, find if it has one for
                                //this name.
                                if (mapValue) {
                                    mapValue = getOwn(mapValue, nameSegment);
                                    if (mapValue) {
                                        //Match, update name to the new value.
                                        foundMap = mapValue;
                                        foundI = i;
                                        break outerLoop;
                                    }
                                }
                            }
                        }

                        //Check for a star map match, but just hold on to it,
                        //if there is a shorter segment match later in a matching
                        //config, then favor over this star map.
                        if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
                            foundStarMap = getOwn(starMap, nameSegment);
                            starI = i;
                        }
                    }

                    if (!foundMap && foundStarMap) {
                        foundMap = foundStarMap;
                        foundI = starI;
                    }

                    if (foundMap) {
                        nameParts.splice(0, foundI, foundMap);
                        name = nameParts.join('/');
                    }
                }

                // If the name points to a package's name, use
                // the package main instead.
                pkgMain = getOwn(config.pkgs, name);

                return pkgMain ? pkgMain : name;
            }

            function removeScript(name) {
                if (isBrowser) {
                    each(scripts(), function(scriptNode) {
                        if (scriptNode.getAttribute('data-requiremodule') === name &&
                            scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                            scriptNode.parentNode.removeChild(scriptNode);
                            return true;
                        }
                    });
                }
            }

            function hasPathFallback(id) {
                var pathConfig = getOwn(config.paths, id);
                if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                    //Pop off the first array value, since it failed, and
                    //retry
                    pathConfig.shift();
                    context.require.undef(id);

                    //Custom require that does not do map translation, since
                    //ID is "absolute", already mapped/resolved.
                    context.makeRequire(null, {
                        skipMap: true
                    })([id]);

                    return true;
                }
            }

            //Turns a plugin!resource to [plugin, resource]
            //with the plugin being undefined if the name
            //did not have a plugin prefix.
            function splitPrefix(name) {
                var prefix,
                    index = name ? name.indexOf('!') : -1;
                if (index > -1) {
                    prefix = name.substring(0, index);
                    name = name.substring(index + 1, name.length);
                }
                return [prefix, name];
            }

            /**
             * Creates a module mapping that includes plugin prefix, module
             * name, and path. If parentModuleMap is provided it will
             * also normalize the name via require.normalize()
             *
             * @param {String} name the module name
             * @param {String} [parentModuleMap] parent module map
             * for the module name, used to resolve relative names.
             * @param {Boolean} isNormalized: is the ID already normalized.
             * This is true if this call is done for a define() module ID.
             * @param {Boolean} applyMap: apply the map config to the ID.
             * Should only be true if this map is for a dependency.
             *
             * @returns {Object}
             */
            function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
                var url, pluginModule, suffix, nameParts,
                    prefix = null,
                    parentName = parentModuleMap ? parentModuleMap.name : null,
                    originalName = name,
                    isDefine = true,
                    normalizedName = '';

                //If no name, then it means it is a require call, generate an
                //internal name.
                if (!name) {
                    isDefine = false;
                    name = '_@r' + (requireCounter += 1);
                }

                nameParts = splitPrefix(name);
                prefix = nameParts[0];
                name = nameParts[1];

                if (prefix) {
                    prefix = normalize(prefix, parentName, applyMap);
                    pluginModule = getOwn(defined, prefix);
                }

                //Account for relative paths if there is a base name.
                if (name) {
                    if (prefix) {
                        if (isNormalized) {
                            normalizedName = name;
                        } else if (pluginModule && pluginModule.normalize) {
                            //Plugin is loaded, use its normalize method.
                            normalizedName = pluginModule.normalize(name, function(name) {
                                return normalize(name, parentName, applyMap);
                            });
                        } else {
                            // If nested plugin references, then do not try to
                            // normalize, as it will not normalize correctly. This
                            // places a restriction on resourceIds, and the longer
                            // term solution is not to normalize until plugins are
                            // loaded and all normalizations to allow for async
                            // loading of a loader plugin. But for now, fixes the
                            // common uses. Details in #1131
                            normalizedName = name.indexOf('!') === -1 ?
                                normalize(name, parentName, applyMap) :
                                name;
                        }
                    } else {
                        //A regular module.
                        normalizedName = normalize(name, parentName, applyMap);

                        //Normalized name may be a plugin ID due to map config
                        //application in normalize. The map config values must
                        //already be normalized, so do not need to redo that part.
                        nameParts = splitPrefix(normalizedName);
                        prefix = nameParts[0];
                        normalizedName = nameParts[1];
                        isNormalized = true;

                        url = context.nameToUrl(normalizedName);
                    }
                }

                //If the id is a plugin id that cannot be determined if it needs
                //normalization, stamp it with a unique ID so two matching relative
                //ids that may conflict can be separate.
                suffix = prefix && !pluginModule && !isNormalized ?
                    '_unnormalized' + (unnormalizedCounter += 1) :
                    '';

                return {
                    prefix: prefix,
                    name: normalizedName,
                    parentMap: parentModuleMap,
                    unnormalized: !!suffix,
                    url: url,
                    originalName: originalName,
                    isDefine: isDefine,
                    id: (prefix ?
                        prefix + '!' + normalizedName :
                        normalizedName) + suffix
                };
            }

            function getModule(depMap) {
                var id = depMap.id,
                    mod = getOwn(registry, id);

                if (!mod) {
                    mod = registry[id] = new context.Module(depMap);
                }

                return mod;
            }

            function on(depMap, name, fn) {
                var id = depMap.id,
                    mod = getOwn(registry, id);

                if (hasProp(defined, id) &&
                    (!mod || mod.defineEmitComplete)) {
                    if (name === 'defined') {
                        fn(defined[id]);
                    }
                } else {
                    mod = getModule(depMap);
                    if (mod.error && name === 'error') {
                        fn(mod.error);
                    } else {
                        mod.on(name, fn);
                    }
                }
            }

            function onError(err, errback) {
                var ids = err.requireModules,
                    notified = false;

                if (errback) {
                    errback(err);
                } else {
                    each(ids, function(id) {
                        var mod = getOwn(registry, id);
                        if (mod) {
                            //Set error on module, so it skips timeout checks.
                            mod.error = err;
                            if (mod.events.error) {
                                notified = true;
                                mod.emit('error', err);
                            }
                        }
                    });

                    if (!notified) {
                        req.onError(err);
                    }
                }
            }

            /**
             * Internal method to transfer globalQueue items to this context's
             * defQueue.
             */
            function takeGlobalQueue() {
                //Push all the globalDefQueue items into the context's defQueue
                if (globalDefQueue.length) {
                    each(globalDefQueue, function(queueItem) {
                        var id = queueItem[0];
                        if (typeof id === 'string') {
                            context.defQueueMap[id] = true;
                        }
                        defQueue.push(queueItem);
                    });
                    globalDefQueue = [];
                }
            }

            handlers = {
                'require': function(mod) {
                    if (mod.require) {
                        return mod.require;
                    } else {
                        return (mod.require = context.makeRequire(mod.map));
                    }
                },
                'exports': function(mod) {
                    mod.usingExports = true;
                    if (mod.map.isDefine) {
                        if (mod.exports) {
                            return (defined[mod.map.id] = mod.exports);
                        } else {
                            return (mod.exports = defined[mod.map.id] = {});
                        }
                    }
                },
                'module': function(mod) {
                    if (mod.module) {
                        return mod.module;
                    } else {
                        return (mod.module = {
                            id: mod.map.id,
                            uri: mod.map.url,
                            config: function() {
                                return getOwn(config.config, mod.map.id) || {};
                            },
                            exports: mod.exports || (mod.exports = {})
                        });
                    }
                }
            };

            function cleanRegistry(id) {
                //Clean up machinery used for waiting modules.
                delete registry[id];
                delete enabledRegistry[id];
            }

            function breakCycle(mod, traced, processed) {
                var id = mod.map.id;

                if (mod.error) {
                    mod.emit('error', mod.error);
                } else {
                    traced[id] = true;
                    each(mod.depMaps, function(depMap, i) {
                        var depId = depMap.id,
                            dep = getOwn(registry, depId);

                        //Only force things that have not completed
                        //being defined, so still in the registry,
                        //and only if it has not been matched up
                        //in the module already.
                        if (dep && !mod.depMatched[i] && !processed[depId]) {
                            if (getOwn(traced, depId)) {
                                mod.defineDep(i, defined[depId]);
                                mod.check(); //pass false?
                            } else {
                                breakCycle(dep, traced, processed);
                            }
                        }
                    });
                    processed[id] = true;
                }
            }

            function checkLoaded() {
                var err, usingPathFallback,
                    waitInterval = config.waitSeconds * 1000,
                    //It is possible to disable the wait interval by using waitSeconds of 0.
                    expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                    noLoads = [],
                    reqCalls = [],
                    stillLoading = false,
                    needCycleCheck = true;

                //Do not bother if this call was a result of a cycle break.
                if (inCheckLoaded) {
                    return;
                }

                inCheckLoaded = true;

                //Figure out the state of all the modules.
                eachProp(enabledRegistry, function(mod) {
                    var map = mod.map,
                        modId = map.id;

                    //Skip things that are not enabled or in error state.
                    if (!mod.enabled) {
                        return;
                    }

                    if (!map.isDefine) {
                        reqCalls.push(mod);
                    }

                    if (!mod.error) {
                        //If the module should be executed, and it has not
                        //been inited and time is up, remember it.
                        if (!mod.inited && expired) {
                            if (hasPathFallback(modId)) {
                                usingPathFallback = true;
                                stillLoading = true;
                            } else {
                                noLoads.push(modId);
                                removeScript(modId);
                            }
                        } else if (!mod.inited && mod.fetched && map.isDefine) {
                            stillLoading = true;
                            if (!map.prefix) {
                                //No reason to keep looking for unfinished
                                //loading. If the only stillLoading is a
                                //plugin resource though, keep going,
                                //because it may be that a plugin resource
                                //is waiting on a non-plugin cycle.
                                return (needCycleCheck = false);
                            }
                        }
                    }
                });

                if (expired && noLoads.length) {
                    //If wait time expired, throw error of unloaded modules.
                    err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
                    err.contextName = context.contextName;
                    return onError(err);
                }

                //Not expired, check for a cycle.
                if (needCycleCheck) {
                    each(reqCalls, function(mod) {
                        breakCycle(mod, {}, {});
                    });
                }

                //If still waiting on loads, and the waiting load is something
                //other than a plugin resource, or there are still outstanding
                //scripts, then just try back later.
                if ((!expired || usingPathFallback) && stillLoading) {
                    //Something is still waiting to load. Wait for it, but only
                    //if a timeout is not already in effect.
                    if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                        checkLoadedTimeoutId = setTimeout(function() {
                            checkLoadedTimeoutId = 0;
                            checkLoaded();
                        }, 50);
                    }
                }

                inCheckLoaded = false;
            }

            Module = function(map) {
                this.events = getOwn(undefEvents, map.id) || {};
                this.map = map;
                this.shim = getOwn(config.shim, map.id);
                this.depExports = [];
                this.depMaps = [];
                this.depMatched = [];
                this.pluginMaps = {};
                this.depCount = 0;

                /* this.exports this.factory
                this.depMaps = [],
                this.enabled, this.fetched
                */
            };

            Module.prototype = {
                init: function(depMaps, factory, errback, options) {
                    options = options || {};

                    //Do not do more inits if already done. Can happen if there
                    //are multiple define calls for the same module. That is not
                    //a normal, common case, but it is also not unexpected.
                    if (this.inited) {
                        return;
                    }

                    this.factory = factory;

                    if (errback) {
                        //Register for errors on this module.
                        this.on('error', errback);
                    } else if (this.events.error) {
                        //If no errback already, but there are error listeners
                        //on this module, set up an errback to pass to the deps.
                        errback = bind(this, function(err) {
                            this.emit('error', err);
                        });
                    }

                    //Do a copy of the dependency array, so that
                    //source inputs are not modified. For example
                    //"shim" deps are passed in here directly, and
                    //doing a direct modification of the depMaps array
                    //would affect that config.
                    this.depMaps = depMaps && depMaps.slice(0);

                    this.errback = errback;

                    //Indicate this module has be initialized
                    this.inited = true;

                    this.ignore = options.ignore;

                    //Could have option to init this module in enabled mode,
                    //or could have been previously marked as enabled. However,
                    //the dependencies are not known until init is called. So
                    //if enabled previously, now trigger dependencies as enabled.
                    if (options.enabled || this.enabled) {
                        //Enable this module and dependencies.
                        //Will call this.check()
                        this.enable();
                    } else {
                        this.check();
                    }
                },

                defineDep: function(i, depExports) {
                    //Because of cycles, defined callback for a given
                    //export can be called more than once.
                    if (!this.depMatched[i]) {
                        this.depMatched[i] = true;
                        this.depCount -= 1;
                        this.depExports[i] = depExports;
                    }
                },

                fetch: function() {
                    if (this.fetched) {
                        return;
                    }
                    this.fetched = true;

                    context.startTime = (new Date()).getTime();

                    var map = this.map;

                    //If the manager is for a plugin managed resource,
                    //ask the plugin to load it now.
                    if (this.shim) {
                        context.makeRequire(this.map, {
                            enableBuildCallback: true
                        })(this.shim.deps || [], bind(this, function() {
                            return map.prefix ? this.callPlugin() : this.load();
                        }));
                    } else {
                        //Regular dependency.
                        return map.prefix ? this.callPlugin() : this.load();
                    }
                },

                load: function() {
                    var url = this.map.url;

                    //Regular dependency.
                    if (!urlFetched[url]) {
                        urlFetched[url] = true;
                        context.load(this.map.id, url);
                    }
                },

                /**
                 * Checks if the module is ready to define itself, and if so,
                 * define it.
                 */
                check: function() {
                    if (!this.enabled || this.enabling) {
                        return;
                    }

                    var err, cjsModule,
                        id = this.map.id,
                        depExports = this.depExports,
                        exports = this.exports,
                        factory = this.factory;

                    if (!this.inited) {
                        // Only fetch if not already in the defQueue.
                        if (!hasProp(context.defQueueMap, id)) {
                            this.fetch();
                        }
                    } else if (this.error) {
                        this.emit('error', this.error);
                    } else if (!this.defining) {
                        //The factory could trigger another require call
                        //that would result in checking this module to
                        //define itself again. If already in the process
                        //of doing that, skip this work.
                        this.defining = true;

                        if (this.depCount < 1 && !this.defined) {
                            if (isFunction(factory)) {
                                //If there is an error listener, favor passing
                                //to that instead of throwing an error. However,
                                //only do it for define()'d  modules. require
                                //errbacks should not be called for failures in
                                //their callbacks (#699). However if a global
                                //onError is set, use that.
                                if ((this.events.error && this.map.isDefine) ||
                                    req.onError !== defaultOnError) {
                                    try {
                                        exports = context.execCb(id, factory, depExports, exports);
                                    } catch (e) {
                                        err = e;
                                    }
                                } else {
                                    exports = context.execCb(id, factory, depExports, exports);
                                }

                                // Favor return value over exports. If node/cjs in play,
                                // then will not have a return value anyway. Favor
                                // module.exports assignment over exports object.
                                if (this.map.isDefine && exports === undefined) {
                                    cjsModule = this.module;
                                    if (cjsModule) {
                                        exports = cjsModule.exports;
                                    } else if (this.usingExports) {
                                        //exports already set the defined value.
                                        exports = this.exports;
                                    }
                                }

                                if (err) {
                                    err.requireMap = this.map;
                                    err.requireModules = this.map.isDefine ? [this.map.id] : null;
                                    err.requireType = this.map.isDefine ? 'define' : 'require';
                                    return onError((this.error = err));
                                }

                            } else {
                                //Just a literal value
                                exports = factory;
                            }

                            this.exports = exports;

                            if (this.map.isDefine && !this.ignore) {
                                defined[id] = exports;

                                if (req.onResourceLoad) {
                                    var resLoadMaps = [];
                                    each(this.depMaps, function(depMap) {
                                        resLoadMaps.push(depMap.normalizedMap || depMap);
                                    });
                                    req.onResourceLoad(context, this.map, resLoadMaps);
                                }
                            }

                            //Clean up
                            cleanRegistry(id);

                            this.defined = true;
                        }

                        //Finished the define stage. Allow calling check again
                        //to allow define notifications below in the case of a
                        //cycle.
                        this.defining = false;

                        if (this.defined && !this.defineEmitted) {
                            this.defineEmitted = true;
                            this.emit('defined', this.exports);
                            this.defineEmitComplete = true;
                        }

                    }
                },

                callPlugin: function() {
                    var map = this.map,
                        id = map.id,
                        //Map already normalized the prefix.
                        pluginMap = makeModuleMap(map.prefix);

                    //Mark this as a dependency for this plugin, so it
                    //can be traced for cycles.
                    this.depMaps.push(pluginMap);

                    on(pluginMap, 'defined', bind(this, function(plugin) {
                        var load, normalizedMap, normalizedMod,
                            bundleId = getOwn(bundlesMap, this.map.id),
                            name = this.map.name,
                            parentName = this.map.parentMap ? this.map.parentMap.name : null,
                            localRequire = context.makeRequire(map.parentMap, {
                                enableBuildCallback: true
                            });

                        //If current map is not normalized, wait for that
                        //normalized name to load instead of continuing.
                        if (this.map.unnormalized) {
                            //Normalize the ID if the plugin allows it.
                            if (plugin.normalize) {
                                name = plugin.normalize(name, function(name) {
                                    return normalize(name, parentName, true);
                                }) || '';
                            }

                            //prefix and name should already be normalized, no need
                            //for applying map config again either.
                            normalizedMap = makeModuleMap(map.prefix + '!' + name,
                                this.map.parentMap,
                                true);
                            on(normalizedMap,
                                'defined', bind(this, function(value) {
                                    this.map.normalizedMap = normalizedMap;
                                    this.init([], function() {
                                        return value;
                                    }, null, {
                                        enabled: true,
                                        ignore: true
                                    });
                                }));

                            normalizedMod = getOwn(registry, normalizedMap.id);
                            if (normalizedMod) {
                                //Mark this as a dependency for this plugin, so it
                                //can be traced for cycles.
                                this.depMaps.push(normalizedMap);

                                if (this.events.error) {
                                    normalizedMod.on('error', bind(this, function(err) {
                                        this.emit('error', err);
                                    }));
                                }
                                normalizedMod.enable();
                            }

                            return;
                        }

                        //If a paths config, then just load that file instead to
                        //resolve the plugin, as it is built into that paths layer.
                        if (bundleId) {
                            this.map.url = context.nameToUrl(bundleId);
                            this.load();
                            return;
                        }

                        load = bind(this, function(value) {
                            this.init([], function() {
                                return value;
                            }, null, {
                                enabled: true
                            });
                        });

                        load.error = bind(this, function(err) {
                            this.inited = true;
                            this.error = err;
                            err.requireModules = [id];

                            //Remove temp unnormalized modules for this module,
                            //since they will never be resolved otherwise now.
                            eachProp(registry, function(mod) {
                                if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                                    cleanRegistry(mod.map.id);
                                }
                            });

                            onError(err);
                        });

                        //Allow plugins to load other code without having to know the
                        //context or how to 'complete' the load.
                        load.fromText = bind(this, function(text, textAlt) {
                            /*jslint evil: true */
                            var moduleName = map.name,
                                moduleMap = makeModuleMap(moduleName),
                                hasInteractive = useInteractive;

                            //As of 2.1.0, support just passing the text, to reinforce
                            //fromText only being called once per resource. Still
                            //support old style of passing moduleName but discard
                            //that moduleName in favor of the internal ref.
                            if (textAlt) {
                                text = textAlt;
                            }

                            //Turn off interactive script matching for IE for any define
                            //calls in the text, then turn it back on at the end.
                            if (hasInteractive) {
                                useInteractive = false;
                            }

                            //Prime the system by creating a module instance for
                            //it.
                            getModule(moduleMap);

                            //Transfer any config to this other module.
                            if (hasProp(config.config, id)) {
                                config.config[moduleName] = config.config[id];
                            }

                            try {
                                req.exec(text);
                            } catch (e) {
                                return onError(makeError('fromtexteval',
                                    'fromText eval for ' + id +
                                    ' failed: ' + e,
                                    e, [id]));
                            }

                            if (hasInteractive) {
                                useInteractive = true;
                            }

                            //Mark this as a dependency for the plugin
                            //resource
                            this.depMaps.push(moduleMap);

                            //Support anonymous modules.
                            context.completeLoad(moduleName);

                            //Bind the value of that module to the value for this
                            //resource ID.
                            localRequire([moduleName], load);
                        });

                        //Use parentName here since the plugin's name is not reliable,
                        //could be some weird string with no path that actually wants to
                        //reference the parentName's path.
                        plugin.load(map.name, localRequire, load, config);
                    }));

                    context.enable(pluginMap, this);
                    this.pluginMaps[pluginMap.id] = pluginMap;
                },

                enable: function() {
                    enabledRegistry[this.map.id] = this;
                    this.enabled = true;

                    //Set flag mentioning that the module is enabling,
                    //so that immediate calls to the defined callbacks
                    //for dependencies do not trigger inadvertent load
                    //with the depCount still being zero.
                    this.enabling = true;

                    //Enable each dependency
                    each(this.depMaps, bind(this, function(depMap, i) {
                        var id, mod, handler;

                        if (typeof depMap === 'string') {
                            //Dependency needs to be converted to a depMap
                            //and wired up to this module.
                            depMap = makeModuleMap(depMap,
                                (this.map.isDefine ? this.map : this.map.parentMap),
                                false, !this.skipMap);
                            this.depMaps[i] = depMap;

                            handler = getOwn(handlers, depMap.id);

                            if (handler) {
                                this.depExports[i] = handler(this);
                                return;
                            }

                            this.depCount += 1;

                            on(depMap, 'defined', bind(this, function(depExports) {
                                if (this.undefed) {
                                    return;
                                }
                                this.defineDep(i, depExports);
                                this.check();
                            }));

                            if (this.errback) {
                                on(depMap, 'error', bind(this, this.errback));
                            } else if (this.events.error) {
                                // No direct errback on this module, but something
                                // else is listening for errors, so be sure to
                                // propagate the error correctly.
                                on(depMap, 'error', bind(this, function(err) {
                                    this.emit('error', err);
                                }));
                            }
                        }

                        id = depMap.id;
                        mod = registry[id];

                        //Skip special modules like 'require', 'exports', 'module'
                        //Also, don't call enable if it is already enabled,
                        //important in circular dependency cases.
                        if (!hasProp(handlers, id) && mod && !mod.enabled) {
                            context.enable(depMap, this);
                        }
                    }));

                    //Enable each plugin that is used in
                    //a dependency
                    eachProp(this.pluginMaps, bind(this, function(pluginMap) {
                        var mod = getOwn(registry, pluginMap.id);
                        if (mod && !mod.enabled) {
                            context.enable(pluginMap, this);
                        }
                    }));

                    this.enabling = false;

                    this.check();
                },

                on: function(name, cb) {
                    var cbs = this.events[name];
                    if (!cbs) {
                        cbs = this.events[name] = [];
                    }
                    cbs.push(cb);
                },

                emit: function(name, evt) {
                    each(this.events[name], function(cb) {
                        cb(evt);
                    });
                    if (name === 'error') {
                        //Now that the error handler was triggered, remove
                        //the listeners, since this broken Module instance
                        //can stay around for a while in the registry.
                        delete this.events[name];
                    }
                }
            };

            function callGetModule(args) {
                //Skip modules already defined.
                if (!hasProp(defined, args[0])) {
                    getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
                }
            }

            function removeListener(node, func, name, ieName) {
                //Favor detachEvent because of IE9
                //issue, see attachEvent/addEventListener comment elsewhere
                //in this file.
                if (node.detachEvent && !isOpera) {
                    //Probably IE. If not it will throw an error, which will be
                    //useful to know.
                    if (ieName) {
                        node.detachEvent(ieName, func);
                    }
                } else {
                    node.removeEventListener(name, func, false);
                }
            }

            /**
             * Given an event from a script node, get the requirejs info from it,
             * and then removes the event listeners on the node.
             * @param {Event} evt
             * @returns {Object}
             */
            function getScriptData(evt) {
                //Using currentTarget instead of target for Firefox 2.0's sake. Not
                //all old browsers will be supported, but this one was easy enough
                //to support and still makes sense.
                var node = evt.currentTarget || evt.srcElement;

                //Remove the listeners once here.
                removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
                removeListener(node, context.onScriptError, 'error');

                return {
                    node: node,
                    id: node && node.getAttribute('data-requiremodule')
                };
            }

            function intakeDefines() {
                var args;

                //Any defined modules in the global queue, intake them now.
                takeGlobalQueue();

                //Make sure any remaining defQueue items get properly processed.
                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null) {
                        return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' +
                            args[args.length - 1]));
                    } else {
                        //args are id, deps, factory. Should be normalized by the
                        //define() function.
                        callGetModule(args);
                    }
                }
                context.defQueueMap = {};
            }

            context = {
                config: config,
                contextName: contextName,
                registry: registry,
                defined: defined,
                urlFetched: urlFetched,
                defQueue: defQueue,
                defQueueMap: {},
                Module: Module,
                makeModuleMap: makeModuleMap,
                nextTick: req.nextTick,
                onError: onError,

                /**
                 * Set a configuration for the context.
                 * @param {Object} cfg config object to integrate.
                 */
                configure: function(cfg) {
                    //Make sure the baseUrl ends in a slash.
                    if (cfg.baseUrl) {
                        if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
                            cfg.baseUrl += '/';
                        }
                    }

                    // Convert old style urlArgs string to a function.
                    if (typeof cfg.urlArgs === 'string') {
                        var urlArgs = cfg.urlArgs;
                        cfg.urlArgs = function(id, url) {
                            return (url.indexOf('?') === -1 ? '?' : '&') + urlArgs;
                        };
                    }

                    //Save off the paths since they require special processing,
                    //they are additive.
                    var shim = config.shim,
                        objs = {
                            paths: true,
                            bundles: true,
                            config: true,
                            map: true
                        };

                    eachProp(cfg, function(value, prop) {
                        if (objs[prop]) {
                            if (!config[prop]) {
                                config[prop] = {};
                            }
                            mixin(config[prop], value, true, true);
                        } else {
                            config[prop] = value;
                        }
                    });

                    //Reverse map the bundles
                    if (cfg.bundles) {
                        eachProp(cfg.bundles, function(value, prop) {
                            each(value, function(v) {
                                if (v !== prop) {
                                    bundlesMap[v] = prop;
                                }
                            });
                        });
                    }

                    //Merge shim
                    if (cfg.shim) {
                        eachProp(cfg.shim, function(value, id) {
                            //Normalize the structure
                            if (isArray(value)) {
                                value = {
                                    deps: value
                                };
                            }
                            if ((value.exports || value.init) && !value.exportsFn) {
                                value.exportsFn = context.makeShimExports(value);
                            }
                            shim[id] = value;
                        });
                        config.shim = shim;
                    }

                    //Adjust packages if necessary.
                    if (cfg.packages) {
                        each(cfg.packages, function(pkgObj) {
                            var location, name;

                            pkgObj = typeof pkgObj === 'string' ? {
                                name: pkgObj
                            } : pkgObj;

                            name = pkgObj.name;
                            location = pkgObj.location;
                            if (location) {
                                config.paths[name] = pkgObj.location;
                            }

                            //Save pointer to main module ID for pkg name.
                            //Remove leading dot in main, so main paths are normalized,
                            //and remove any trailing .js, since different package
                            //envs have different conventions: some use a module name,
                            //some use a file name.
                            config.pkgs[name] = pkgObj.name + '/' + (pkgObj.main || 'main')
                                .replace(currDirRegExp, '')
                                .replace(jsSuffixRegExp, '');
                        });
                    }

                    //If there are any "waiting to execute" modules in the registry,
                    //update the maps for them, since their info, like URLs to load,
                    //may have changed.
                    eachProp(registry, function(mod, id) {
                        //If module already has init called, since it is too
                        //late to modify them, and ignore unnormalized ones
                        //since they are transient.
                        if (!mod.inited && !mod.map.unnormalized) {
                            mod.map = makeModuleMap(id, null, true);
                        }
                    });

                    //If a deps array or a config callback is specified, then call
                    //require with those args. This is useful when require is defined as a
                    //config object before require.js is loaded.
                    if (cfg.deps || cfg.callback) {
                        context.require(cfg.deps || [], cfg.callback);
                    }
                },

                makeShimExports: function(value) {
                    function fn() {
                        var ret;
                        if (value.init) {
                            ret = value.init.apply(global, arguments);
                        }
                        return ret || (value.exports && getGlobal(value.exports));
                    }
                    return fn;
                },

                makeRequire: function(relMap, options) {
                    options = options || {};

                    function localRequire(deps, callback, errback) {
                        var id, map, requireMod;

                        if (options.enableBuildCallback && callback && isFunction(callback)) {
                            callback.__requireJsBuild = true;
                        }

                        if (typeof deps === 'string') {
                            if (isFunction(callback)) {
                                //Invalid call
                                return onError(makeError('requireargs', 'Invalid require call'), errback);
                            }

                            //If require|exports|module are requested, get the
                            //value for them from the special handlers. Caveat:
                            //this only works while module is being defined.
                            if (relMap && hasProp(handlers, deps)) {
                                return handlers[deps](registry[relMap.id]);
                            }

                            //Synchronous access to one module. If require.get is
                            //available (as in the Node adapter), prefer that.
                            if (req.get) {
                                return req.get(context, deps, relMap, localRequire);
                            }

                            //Normalize module name, if it contains . or ..
                            map = makeModuleMap(deps, relMap, false, true);
                            id = map.id;

                            if (!hasProp(defined, id)) {
                                return onError(makeError('notloaded', 'Module name "' +
                                    id +
                                    '" has not been loaded yet for context: ' +
                                    contextName +
                                    (relMap ? '' : '. Use require([])')));
                            }
                            return defined[id];
                        }

                        //Grab defines waiting in the global queue.
                        intakeDefines();

                        //Mark all the dependencies as needing to be loaded.
                        context.nextTick(function() {
                            //Some defines could have been added since the
                            //require call, collect them.
                            intakeDefines();

                            requireMod = getModule(makeModuleMap(null, relMap));

                            //Store if map config should be applied to this require
                            //call for dependencies.
                            requireMod.skipMap = options.skipMap;

                            requireMod.init(deps, callback, errback, {
                                enabled: true
                            });

                            checkLoaded();
                        });

                        return localRequire;
                    }

                    mixin(localRequire, {
                        isBrowser: isBrowser,

                        /**
                         * Converts a module name + .extension into an URL path.
                         * *Requires* the use of a module name. It does not support using
                         * plain URLs like nameToUrl.
                         */
                        toUrl: function(moduleNamePlusExt) {
                            var ext,
                                index = moduleNamePlusExt.lastIndexOf('.'),
                                segment = moduleNamePlusExt.split('/')[0],
                                isRelative = segment === '.' || segment === '..';

                            //Have a file extension alias, and it is not the
                            //dots from a relative path.
                            if (index !== -1 && (!isRelative || index > 1)) {
                                ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                                moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
                            }

                            return context.nameToUrl(normalize(moduleNamePlusExt,
                                relMap && relMap.id, true), ext, true);
                        },

                        defined: function(id) {
                            return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
                        },

                        specified: function(id) {
                            id = makeModuleMap(id, relMap, false, true).id;
                            return hasProp(defined, id) || hasProp(registry, id);
                        }
                    });

                    //Only allow undef on top level require calls
                    if (!relMap) {
                        localRequire.undef = function(id) {
                            //Bind any waiting define() calls to this context,
                            //fix for #408
                            takeGlobalQueue();

                            var map = makeModuleMap(id, relMap, true),
                                mod = getOwn(registry, id);

                            mod.undefed = true;
                            removeScript(id);

                            delete defined[id];
                            delete urlFetched[map.url];
                            delete undefEvents[id];

                            //Clean queued defines too. Go backwards
                            //in array so that the splices do not
                            //mess up the iteration.
                            eachReverse(defQueue, function(args, i) {
                                if (args[0] === id) {
                                    defQueue.splice(i, 1);
                                }
                            });
                            delete context.defQueueMap[id];

                            if (mod) {
                                //Hold on to listeners in case the
                                //module will be attempted to be reloaded
                                //using a different config.
                                if (mod.events.defined) {
                                    undefEvents[id] = mod.events;
                                }

                                cleanRegistry(id);
                            }
                        };
                    }

                    return localRequire;
                },

                /**
                 * Called to enable a module if it is still in the registry
                 * awaiting enablement. A second arg, parent, the parent module,
                 * is passed in for context, when this method is overridden by
                 * the optimizer. Not shown here to keep code compact.
                 */
                enable: function(depMap) {
                    var mod = getOwn(registry, depMap.id);
                    if (mod) {
                        getModule(depMap).enable();
                    }
                },

                /**
                 * Internal method used by environment adapters to complete a load event.
                 * A load event could be a script load or just a load pass from a synchronous
                 * load call.
                 * @param {String} moduleName the name of the module to potentially complete.
                 */
                completeLoad: function(moduleName) {
                    var found, args, mod,
                        shim = getOwn(config.shim, moduleName) || {},
                        shExports = shim.exports;

                    takeGlobalQueue();

                    while (defQueue.length) {
                        args = defQueue.shift();
                        if (args[0] === null) {
                            args[0] = moduleName;
                            //If already found an anonymous module and bound it
                            //to this name, then this is some other anon module
                            //waiting for its completeLoad to fire.
                            if (found) {
                                break;
                            }
                            found = true;
                        } else if (args[0] === moduleName) {
                            //Found matching define call for this script!
                            found = true;
                        }

                        callGetModule(args);
                    }
                    context.defQueueMap = {};

                    //Do this after the cycle of callGetModule in case the result
                    //of those calls/init calls changes the registry.
                    mod = getOwn(registry, moduleName);

                    if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
                        if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                            if (hasPathFallback(moduleName)) {
                                return;
                            } else {
                                return onError(makeError('nodefine',
                                    'No define call for ' + moduleName,
                                    null, [moduleName]));
                            }
                        } else {
                            //A script that does not call define(), so just simulate
                            //the call for it.
                            callGetModule([moduleName, (shim.deps || []), shim.exportsFn]);
                        }
                    }

                    checkLoaded();
                },

                /**
                 * Converts a module name to a file path. Supports cases where
                 * moduleName may actually be just an URL.
                 * Note that it **does not** call normalize on the moduleName,
                 * it is assumed to have already been normalized. This is an
                 * internal API, not a public one. Use toUrl for the public API.
                 */
                nameToUrl: function(moduleName, ext, skipExt) {
                    var paths, syms, i, parentModule, url,
                        parentPath, bundleId,
                        pkgMain = getOwn(config.pkgs, moduleName);

                    if (pkgMain) {
                        moduleName = pkgMain;
                    }

                    bundleId = getOwn(bundlesMap, moduleName);

                    if (bundleId) {
                        return context.nameToUrl(bundleId, ext, skipExt);
                    }

                    //If a colon is in the URL, it indicates a protocol is used and it is just
                    //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
                    //or ends with .js, then assume the user meant to use an url and not a module id.
                    //The slash is important for protocol-less URLs as well as full paths.
                    if (req.jsExtRegExp.test(moduleName)) {
                        //Just a plain path, not module name lookup, so just return it.
                        //Add extension if it is included. This is a bit wonky, only non-.js things pass
                        //an extension, this method probably needs to be reworked.
                        url = moduleName + (ext || '');
                    } else {
                        //A module that needs to be converted to a path.
                        paths = config.paths;

                        syms = moduleName.split('/');
                        //For each module name segment, see if there is a path
                        //registered for it. Start with most specific name
                        //and work up from it.
                        for (i = syms.length; i > 0; i -= 1) {
                            parentModule = syms.slice(0, i).join('/');

                            parentPath = getOwn(paths, parentModule);
                            if (parentPath) {
                                //If an array, it means there are a few choices,
                                //Choose the one that is desired
                                if (isArray(parentPath)) {
                                    parentPath = parentPath[0];
                                }
                                syms.splice(0, i, parentPath);
                                break;
                            }
                        }

                        //Join the path parts together, then figure out if baseUrl is needed.
                        url = syms.join('/');
                        url += (ext || (/^data\:|^blob\:|\?/.test(url) || skipExt ? '' : '.js'));
                        url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
                    }

                    return config.urlArgs && !/^blob\:/.test(url) ?
                        url + config.urlArgs(moduleName, url) : url;
                },

                //Delegates to req.load. Broken out as a separate function to
                //allow overriding in the optimizer.
                load: function(id, url) {
                    req.load(context, id, url);
                },

                /**
                 * Executes a module callback function. Broken out as a separate function
                 * solely to allow the build system to sequence the files in the built
                 * layer in the right sequence.
                 *
                 * @private
                 */
                execCb: function(name, callback, args, exports) {
                    return callback.apply(exports, args);
                },

                /**
                 * callback for script loads, used to check status of loading.
                 *
                 * @param {Event} evt the event from the browser for the script
                 * that was loaded.
                 */
                onScriptLoad: function(evt) {
                    //Using currentTarget instead of target for Firefox 2.0's sake. Not
                    //all old browsers will be supported, but this one was easy enough
                    //to support and still makes sense.
                    if (evt.type === 'load' ||
                        (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
                        //Reset interactive script so a script node is not held onto for
                        //to long.
                        interactiveScript = null;

                        //Pull out the name of the module and the context.
                        var data = getScriptData(evt);
                        context.completeLoad(data.id);
                    }
                },

                /**
                 * Callback for script errors.
                 */
                onScriptError: function(evt) {
                    var data = getScriptData(evt);
                    if (!hasPathFallback(data.id)) {
                        var parents = [];
                        eachProp(registry, function(value, key) {
                            if (key.indexOf('_@r') !== 0) {
                                each(value.depMaps, function(depMap) {
                                    if (depMap.id === data.id) {
                                        parents.push(key);
                                        return true;
                                    }
                                });
                            }
                        });
                        return onError(makeError('scripterror', 'Script error for "' + data.id +
                            (parents.length ?
                                '", needed by: ' + parents.join(', ') :
                                '"'), evt, [data.id]));
                    }
                }
            };

            context.require = context.makeRequire();
            return context;
        }

        /**
         * Main entry point.
         *
         * If the only argument to require is a string, then the module that
         * is represented by that string is fetched for the appropriate context.
         *
         * If the first argument is an array, then it will be treated as an array
         * of dependency string names to fetch. An optional function callback can
         * be specified to execute when all of those dependencies are available.
         *
         * Make a local req variable to help Caja compliance (it assumes things
         * on a require that are not standardized), and to give a short
         * name for minification/local scope use.
         */
        req = requirejs = function(deps, callback, errback, optional) {

            //Find the right context, use default
            var context, config,
                contextName = defContextName;

            // Determine if have config object in the call.
            if (!isArray(deps) && typeof deps !== 'string') {
                // deps is a config object
                config = deps;
                if (isArray(callback)) {
                    // Adjust args if there are dependencies
                    deps = callback;
                    callback = errback;
                    errback = optional;
                } else {
                    deps = [];
                }
            }

            if (config && config.context) {
                contextName = config.context;
            }

            context = getOwn(contexts, contextName);
            if (!context) {
                context = contexts[contextName] = req.s.newContext(contextName);
            }

            if (config) {
                context.configure(config);
            }

            return context.require(deps, callback, errback);
        };

        /**
         * Support require.config() to make it easier to cooperate with other
         * AMD loaders on globally agreed names.
         */
        req.config = function(config) {
            return req(config);
        };

        /**
         * Execute something after the current tick
         * of the event loop. Override for other envs
         * that have a better solution than setTimeout.
         * @param  {Function} fn function to execute later.
         */
        req.nextTick = typeof setTimeout !== 'undefined' ? function(fn) {
            setTimeout(fn, 4);
        } : function(fn) {
            fn();
        };

        /**
         * Export require as a global, but only if it does not already exist.
         */
        if (!require) {
            require = req;
        }

        req.version = version;

        //Used to filter out dependencies that are already paths.
        req.jsExtRegExp = /^\/|:|\?|\.js$/;
        req.isBrowser = isBrowser;
        s = req.s = {
            contexts: contexts,
            newContext: newContext
        };

        //Create default context.
        req({});

        //Exports some context-sensitive methods on global require.
        each([
            'toUrl',
            'undef',
            'defined',
            'specified'
        ], function(prop) {
            //Reference from contexts instead of early binding to default context,
            //so that during builds, the latest instance of the default context
            //with its config gets used.
            req[prop] = function() {
                var ctx = contexts[defContextName];
                return ctx.require[prop].apply(ctx, arguments);
            };
        });

        if (isBrowser) {
            head = s.head = document.getElementsByTagName('head')[0];
            //If BASE tag is in play, using appendChild is a problem for IE6.
            //When that browser dies, this can be removed. Details in this jQuery bug:
            //http://dev.jquery.com/ticket/2709
            baseElement = document.getElementsByTagName('base')[0];
            if (baseElement) {
                head = s.head = baseElement.parentNode;
            }
        }

        /**
         * Any errors that require explicitly generates will be passed to this
         * function. Intercept/override it if you want custom error handling.
         * @param {Error} err the error object.
         */
        req.onError = defaultOnError;

        /**
         * Creates the node for the load command. Only used in browser envs.
         */
        req.createNode = function(config, moduleName, url) {
            var node = config.xhtml ?
                document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
                document.createElement('script');
            node.type = config.scriptType || 'text/javascript';
            node.charset = 'utf-8';
            node.async = true;
            return node;
        };

        /**
         * Does the request to load a module for the browser case.
         * Make this a separate function to allow other environments
         * to override it.
         *
         * @param {Object} context the require context to find state.
         * @param {String} moduleName the name of the module.
         * @param {Object} url the URL to the module.
         */
        req.load = function(context, moduleName, url) {
            var config = (context && context.config) || {},
                node;
            if (isBrowser) {
                //In the browser so use a script tag
                node = req.createNode(config, moduleName, url);

                node.setAttribute('data-requirecontext', context.contextName);
                node.setAttribute('data-requiremodule', moduleName);

                //Set up load listener. Test attachEvent first because IE9 has
                //a subtle issue in its addEventListener and script onload firings
                //that do not match the behavior of all other browsers with
                //addEventListener support, which fire the onload event for a
                //script right after the script execution. See:
                //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
                //UNFORTUNATELY Opera implements attachEvent but does not follow the script
                //script execution mode.
                if (node.attachEvent &&
                    //Check if node.attachEvent is artificially added by custom script or
                    //natively supported by browser
                    //read https://github.com/requirejs/requirejs/issues/187
                    //if we can NOT find [native code] then it must NOT natively supported.
                    //in IE8, node.attachEvent does not have toString()
                    //Note the test for "[native code" with no closing brace, see:
                    //https://github.com/requirejs/requirejs/issues/273
                    !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                    !isOpera) {
                    //Probably IE. IE (at least 6-8) do not fire
                    //script onload right after executing the script, so
                    //we cannot tie the anonymous define call to a name.
                    //However, IE reports the script as being in 'interactive'
                    //readyState at the time of the define call.
                    useInteractive = true;

                    node.attachEvent('onreadystatechange', context.onScriptLoad);
                    //It would be great to add an error handler here to catch
                    //404s in IE9+. However, onreadystatechange will fire before
                    //the error handler, so that does not help. If addEventListener
                    //is used, then IE will fire error before load, but we cannot
                    //use that pathway given the connect.microsoft.com issue
                    //mentioned above about not doing the 'script execute,
                    //then fire the script load event listener before execute
                    //next script' that other browsers do.
                    //Best hope: IE10 fixes the issues,
                    //and then destroys all installs of IE 6-9.
                    //node.attachEvent('onerror', context.onScriptError);
                } else {
                    node.addEventListener('load', context.onScriptLoad, false);
                    node.addEventListener('error', context.onScriptError, false);
                }
                node.src = url;

                //Calling onNodeCreated after all properties on the node have been
                //set, but before it is placed in the DOM.
                if (config.onNodeCreated) {
                    config.onNodeCreated(node, config, moduleName, url);
                }

                //For some cache cases in IE 6-8, the script executes before the end
                //of the appendChild execution, so to tie an anonymous define
                //call to the module name (which is stored on the node), hold on
                //to a reference to this node, but clear after the DOM insertion.
                currentlyAddingScript = node;
                if (baseElement) {
                    head.insertBefore(node, baseElement);
                } else {
                    head.appendChild(node);
                }
                currentlyAddingScript = null;

                return node;
            } else if (isWebWorker) {
                try {
                    //In a web worker, use importScripts. This is not a very
                    //efficient use of importScripts, importScripts will block until
                    //its script is downloaded and evaluated. However, if web workers
                    //are in play, the expectation is that a build has been done so
                    //that only one script needs to be loaded anyway. This may need
                    //to be reevaluated if other use cases become common.

                    // Post a task to the event loop to work around a bug in WebKit
                    // where the worker gets garbage-collected after calling
                    // importScripts(): https://webkit.org/b/153317
                    setTimeout(function() {}, 0);
                    importScripts(url);

                    //Account for anonymous modules
                    context.completeLoad(moduleName);
                } catch (e) {
                    context.onError(makeError('importscripts',
                        'importScripts failed for ' +
                        moduleName + ' at ' + url,
                        e, [moduleName]));
                }
            }
        };

        function getInteractiveScript() {
            if (interactiveScript && interactiveScript.readyState === 'interactive') {
                return interactiveScript;
            }

            eachReverse(scripts(), function(script) {
                if (script.readyState === 'interactive') {
                    return (interactiveScript = script);
                }
            });
            return interactiveScript;
        }

        //Look for a data-main script attribute, which could also adjust the baseUrl.
        if (isBrowser && !cfg.skipDataMain) {
            //Figure out baseUrl. Get it from the script tag with require.js in it.
            eachReverse(scripts(), function(script) {
                //Set the 'head' where we can append children by
                //using the script's parent.
                if (!head) {
                    head = script.parentNode;
                }

                //Look for a data-main attribute to set main script for the page
                //to load. If it is there, the path to data main becomes the
                //baseUrl, if it is not already set.
                dataMain = script.getAttribute('data-main');
                if (dataMain) {
                    //Preserve dataMain in case it is a path (i.e. contains '?')
                    mainScript = dataMain;

                    //Set final baseUrl if there is not already an explicit one,
                    //but only do so if the data-main value is not a loader plugin
                    //module ID.
                    if (!cfg.baseUrl && mainScript.indexOf('!') === -1) {
                        //Pull off the directory of data-main for use as the
                        //baseUrl.
                        src = mainScript.split('/');
                        mainScript = src.pop();
                        subPath = src.length ? src.join('/') + '/' : './';

                        cfg.baseUrl = subPath;
                    }

                    //Strip off any trailing .js since mainScript is now
                    //like a module name.
                    mainScript = mainScript.replace(jsSuffixRegExp, '');

                    //If mainScript is still a path, fall back to dataMain
                    if (req.jsExtRegExp.test(mainScript)) {
                        mainScript = dataMain;
                    }

                    //Put the data-main script in the files to load.
                    cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];

                    return true;
                }
            });
        }

        /**
         * The function that handles definitions of modules. Differs from
         * require() in that a string for the module should be the first argument,
         * and the function to execute after dependencies are loaded should
         * return a value to define the module corresponding to the first argument's
         * name.
         */
        define = function(name, deps, callback) {
            var node, context;

            //Allow for anonymous modules
            if (typeof name !== 'string') {
                //Adjust args appropriately
                callback = deps;
                deps = name;
                name = null;
            }

            //This module may not have dependencies
            if (!isArray(deps)) {
                callback = deps;
                deps = null;
            }

            //If no name, and callback is a function, then figure out if it a
            //CommonJS thing with dependencies.
            if (!deps && isFunction(callback)) {
                deps = [];
                //Remove comments from the callback string,
                //look for require calls, and pull them into the dependencies,
                //but only if there are function args.
                if (callback.length) {
                    callback
                        .toString()
                        .replace(commentRegExp, commentReplace)
                        .replace(cjsRequireRegExp, function(match, dep) {
                            deps.push(dep);
                        });

                    //May be a CommonJS thing even without require calls, but still
                    //could use exports, and module. Avoid doing exports and module
                    //work though if it just needs require.
                    //REQUIRES the function to expect the CommonJS variables in the
                    //order listed below.
                    deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
                }
            }

            //If in IE 6-8 and hit an anonymous define() call, do the interactive
            //work.
            if (useInteractive) {
                node = currentlyAddingScript || getInteractiveScript();
                if (node) {
                    if (!name) {
                        name = node.getAttribute('data-requiremodule');
                    }
                    context = contexts[node.getAttribute('data-requirecontext')];
                }
            }

            //Always save off evaluating the def call until the script onload handler.
            //This allows multiple modules to be in a file without prematurely
            //tracing dependencies, and allows for anonymous module support,
            //where the module name is not known until the script onload event
            //occurs. If no context, use the global queue, and get it processed
            //in the onscript load callback.
            if (context) {
                context.defQueue.push([name, deps, callback]);
                context.defQueueMap[name] = true;
            } else {
                globalDefQueue.push([name, deps, callback]);
            }
        };

        define.amd = {
            jQuery: true
        };

        /**
         * Executes the text. Normally just uses eval, but can be modified
         * to use a better, environment-specific call. Only used for transpiling
         * loader plugins, not for plain JS modules.
         * @param {String} text the text to execute/evaluate.
         */
        req.exec = function(text) {
            /*jslint evil: true */
            return eval(text);
        };

        //Set up with config info.
        req(cfg);
    }(this, (typeof setTimeout === 'undefined' ? undefined : setTimeout)));

    return {
        require: require,
        define: define,
        config: require.config,
    };
}());

var ace = ace || {};
ace.analytics = ace.analytics || {};

/**
 * @typedef {object} Cohort
 * @property {string} ATL_COHORT The cookie name
 * @property {object | null} readWriteAtlCohort The cohort object or null
 * @property {object | null} readAtlCohort The cohort object or null
 */

/**
 * Provides public access to cohort cookie name and methods for reading and writing that cookie
 * @module Cohort
 */
ace.analytics.Cohort = function() {
    "use strict";

    var ATL_COHORT = "atlCohort";
    var COHORT_VERSION = "2";
    var requiredBucketKeys = ["index", "bucketedAtUTC", "version", "bucketId"];
    var cohortBuckets = {
        bucketAll: {
            bucketId: 0
        }
    };

    /*
     Hypothetical way to add other buckets:

        if (isMobileDevice()) {
            cohortBuckets.bucket_mobile = {
                bucketId: 1
            };
        }

        if (isEnglishSpeaking()) {
            cohortBuckets.bucket_english = {};
        }

        function isMobileDevice() {
            // some logic here...
            return true;
        }
    
        function isEnglishSpeaking() {
            // some logic here...
            return false;
        }
    */

    /**
     * Tries to read the ATL_COHORT cookie and return it
     * @function readAtlCohort
     * @return {object | null} the cohort object or null
     */
    function readAtlCohort() {
        var atlCohort;
        var atlCohortCookie = ace.mkt.Cookie.readCookie(ATL_COHORT);

        try {
            atlCohort = JSON.parse(atlCohortCookie);
            return ace.mkt.Helpers.isObject(atlCohort) ? atlCohort : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Writes the stringified `atlCohort` object to the `ATL_COHORT` cookie and returns the `atlCohort` object
     * @function writeAtlCohort
     * @ignore
     * @param {object} atlCohort the cohort object
     * @return {object | null} the cohort object or null
     */
    function writeAtlCohort(atlCohort) {
        if (ace.mkt.Helpers.isObject(atlCohort)) {
            ace.mkt.Cookie.writeCookie(ATL_COHORT, JSON.stringify(atlCohort), 3650, true);
        }

        return readAtlCohort();
    }

    /**
     * Checks to see if a bucket is in the `atlCohort` object and returns `true` if it does and `false` if it does not
     * @function bucketExists
     * @ignore
     * @param  {string} key a bucket key
     * @param  {object} atlCohort the cohort object
     * @return {boolean} whether or not a bucket is in the cohort object
     */
    function bucketExists(key, atlCohort) {
        if (ace.mkt.Helpers.isObject(atlCohort)) {
            if (typeof atlCohort[key] !== "undefined" && ace.mkt.Helpers.isObject(atlCohort[key])) {
                return requiredBucketKeys.every(function(bucketKey) {
                    return typeof atlCohort[key][bucketKey] !== "undefined";
                });
            }
        }

        return false;
    }

    /**
     * Takes the `atlCohort` object and returns array of missing buckets if there are any or empty array if there are not
     * @function getMissingBuckets
     * @ignore
     * @param  {object} atlCohort the cohort object
     * @return {array} an array of missing buckets in the cohort object
     */
    function getMissingBuckets(atlCohort) {
        return Object.keys(cohortBuckets).filter(function(bucket) {
            return !bucketExists(bucket, atlCohort);
        });
    }

    /**
     * Takes a `bucketKey` and returns and object with `index` and `bucketedAtUTC` properties and optional attribute properties
     * @function createBucket
     * @ignore
     * @param  {string} bucketKey
     * @return {object} a bucket object
     */
    function createBucket(bucketKey) {
        var bucketAttributes = cohortBuckets[bucketKey];
        var anonymousId = ace.analytics.SegmentIO.getAnonymousId();
        var bucket = {
            bucketedAtUTC: new Date().toISOString(),
            version: COHORT_VERSION,
        };

        bucket.index = anonymousId ?
            ace.mkt.Guid.guidHashCode(ace.mkt.Guid.addNumberToGUID(anonymousId, bucketAttributes.bucketId)) % 100 :
            Math.ceil(Math.random() * 100);

        Object.keys(bucketAttributes).forEach(function(attributeKey) {
            bucket[attributeKey] = bucketAttributes[attributeKey];
        });

        return bucket;
    }

    /**
     * Reads `ATL_COHORT` cookie and if there are any missing buckets, it adds them and writes them to the cookie. Returns the `atlCohort` object
     * @function readWriteAtlCohort
     * @param {boolean} when present, trigger a cohort rewrite
     * @return {object | null} the cohort object or null
     */
    function readWriteAtlCohort(writeOverride) {
        // if overriding the cohort, do not read the existing cohort; set to empty to force a write
        var atlCohort = writeOverride ? {} : readAtlCohort() || {};

        var missingBuckets = getMissingBuckets(atlCohort);

        if (missingBuckets.length) {
            missingBuckets.forEach(function(bucket) {
                atlCohort[bucket] = createBucket(bucket);
            });
            atlCohort = writeAtlCohort(atlCohort);
        }

        return atlCohort;
    }

    return {
        ATL_COHORT: ATL_COHORT,
        COHORT_VERSION: COHORT_VERSION,
        readWriteAtlCohort: readWriteAtlCohort,
        readAtlCohort: readAtlCohort
    };
}();
var ace = ace || {};
ace.analytics = ace.analytics || {};

/**
 * Module for loading versioned wrapper.
 * @module Loader
 */
ace.analytics.Loader = function() {
    "use strict";

    var ATL_GLOBAL_ERROR_KEY = "OwkfO6MbQAZAEBuW9CxxAgyahOi8I51r";

    /** Checks for the existence of a remote file
     * @function checkForFile
     * @param {string} url - the url to check
     * @param {function} success - success callback
     * @param {function} failure - failure callback
     * @param {object} mockReq - mock request for testing
     */
    function checkForFile(url, success, failure, mockReq) {
        // open a new HEAD request to see if the file exists
        var xhr = mockReq || new XMLHttpRequest();
        xhr.open('HEAD', url);
        // override CORS check
        xhr.setRequestHeader('Content-type', 'text/plain');
        xhr.send();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    success();
                } else {
                    failure();
                }
            }
        };
    }

    /**
     * Loads the appropriate version of atl-global
     * @function loadVersion
     * @param {string} version - version to load
     * @param {function} callback - file loaded callback
     * @param {function} error - handle file loading error
     */
    function loadVersion(version, callback, error, mockReq) {
        var global = document.createElement("script");
        var script = ace.mkt.Helpers.getScript("atl-global");

        if (script === null || script.source === null) {
            script = ace.mkt.Helpers.getScript("atl-analytics");
        }

        if (script === null || script.source === null) {
            var location = window.location ? (window.location.href || null) : null;
            ace.mkt.Helpers.logEvent(ATL_GLOBAL_ERROR_KEY, 'error', 'getScript returns null', {
                version: version,
                location: location
            });
            return;
        }

        global.onload = function() {
            if (callback && typeof callback === 'function') {
                callback();
            }
        };

        global.onerror = function() {
            if (error && typeof error === 'function') {
                error(version);
            }
        };

        var src = script.source + "/atl-global" + script.extension;
        // make sure the versioned file exists
        ace.analytics.Loader.checkForFile(src, function() { // success
            global.src = src;
            document.head.appendChild(global);
            // overwrite the window version that was loaded from the version.js file
            ace.analytics.version = version;
        }, function() { // error
            // last ditch effort to load the default version
            global.src = script.source + "/atl-global" + script.extension;
            document.head.appendChild(global);
        }, mockReq);
    }

    return {
        loadVersion: loadVersion,
        checkForFile: checkForFile,
    };

}();

var ace = ace || {};
ace.analytics = ace.analytics || {};

/**
 * Provides access to various LaunchDarkly features
 * @module LaunchDarkly
 */
ace.analytics.LaunchDarkly = function() {
    "use strict";

    var ldSDKInstance;
    var ldClient;
    var clientKeys;

    /**
     * Creates the mapping of environment to client keys
     * @function initClientKeys
     */
    function initClientKeys() {
        clientKeys = new Map([
            [ace.mkt.Helpers.ENVIRONMENT.LOCAL, '5afa3d7607a72221591aeb72'],
            [ace.mkt.Helpers.ENVIRONMENT.DEV, '5afa3d7607a72221591aeb72'],
            [ace.mkt.Helpers.ENVIRONMENT.STAGE, '5afa4f0707a72221591aecfd'],
            [ace.mkt.Helpers.ENVIRONMENT.PROD, '5afa3d7607a72221591aeb73'],
        ]);
    }

    /**
     * Loads the LaunchDarkly SDK
     * @function loadLDSDK
     * @param {function} success - function to be called on loading complete
     * @param {function} error - function to be called on failure to load the SDK
     */
    function loadLDSDK(success, error) {
        // get the location where this script was loaded from
        var script = ace.mkt.Helpers.getScript('atl-global');
        if (!script || !script.source) {
            script = ace.mkt.Helpers.getScript('atl-analytics');
        }
        if (!script || !script.source) {
            if (error && typeof(error) === 'function') {
                error();
            }
            return;
        }
        // configure requirejs with the baseUrl of the current script
        globalRequire.config({
            baseUrl: script.source
        });
        // load the SDK
        globalRequire.require(['ldclient.min', 'ldclient-common.min'], function(sdk) {
            ldSDKInstance = sdk;
            if (success && typeof(success) === 'function') {
                success();
            }
        }, function(err) {
            if (error && typeof(error) === 'function') {
                error(err);
            }
        });
    }

    /**
     * Initializes the LaunchDarkly SDK
     * @function initLaunchDarkly
     * @param {function} success - function to be called on initialization complete
     * @param {function} error - function to be called on initialization error
     * @param {object} mockSDK - used for mocking for tests
     */
    function initLaunchDarkly(success, error, mockSDK) {
        if (!ldSDKInstance && !mockSDK) {
            if (error && typeof(error) === 'function') {
                error();
            }
            return;
        }
        var cohort = ace.analytics.Cohort.readAtlCohort();
        var user = {
            key: 'marketingEngineering',
            custom: {
                cohort: cohort ? cohort.bucketAll.index : null,
                location: window.location ? window.location.href : null
            }
        };
        initClientKeys();
        // Init the client based on the environment
        var sdk = mockSDK || ldSDKInstance;
        ldClient = sdk.initialize(clientKeys.get(ace.mkt.Helpers.getEnvironment()), user, {
            bootstrap: 'localStorage'
        });
        ldClient.on('ready', function() {
            if (success && typeof(success) === 'function') {
                success();
            }
        });
        ldClient.on('error', function() {
            if (error && typeof(error) === 'function') {
                error();
            }
        });
    }

    /**
     * Fetches a feature flag for a userin a specific project and environment
     * @function getFeatureFlagForUser
     * @param {string} flag  - The LaunchDarkly feature flag
     * @param {string} defaultValue - The default value for the feature flag
     * @param {object} mockClient - used for mocking for tests
     * @return {string} - the flag value || null
     */
    function getFeatureFlagForUser(flag, defaultValue, mockClient) {
        if (!ldClient && !mockClient) {
            return null;
        }
        var client = mockClient || ldClient;
        return client.variation(flag, defaultValue);
    }

    return {
        getFeatureFlagForUser: getFeatureFlagForUser,
        initLaunchDarkly: initLaunchDarkly,
        loadLDSDK: loadLDSDK,
    };
}();

var ace = ace || {};
ace.analytics = ace.analytics || {};

ace.analytics.MethodQueue = function() {
    "use strict";

    /** This function creates an object definition for wrapper methods and returns them
     * @function getWrapperMethods
     * @ignore
     */
    function getWrapperMethods() {
        // an array for all the methods in the wrapper. Most of these methods should NEVER be called by users of the wrapper
        // but putting them in place just in case
        // the purpose of this format is to make it easier to read and add to the list, and then create a more workable model from it
        // [moduleName, methodName, is this function used to initialize the wrapper]
        var methodList = [
            ["Identity", "autoIdentify", false],
            ["Identity", "callWithAtlPath", false],
            ["Identity", "callWithAtlPathFromIFrame", false],
            ["Identity", "findAtlPath", false],
            ["Identity", "identify", false],
            ["Identity", "transmitAtlPath", false],
            ["Initializer", "globalCallReady", true],
            ["Initializer", "initWithPageAnalytics", true],
            ["Initializer", "initAnalytics", true],
            ["Initializer", "init", true],
            ["Initializer", "autoTrack", true],
            ["Initializer", "gaIntegration", true],
            ["Initializer", "initGAS", true],
            ["Initializer", "initSnowplow", true],
            ["Initializer", "ready", true],
            ["Optimizely", "getCampaigns", false],
            ["Optimizely", "getDemandbase", false],
            ["Optimizely", "getExperimentAndVariationPairs", false],
            ["Optimizely", "getVisitorId", false],
            ["Optimizely", "isDemandbaseAvailable", false],
            ["Optimizely", "isInitialized", false],
            ["SegmentIO", "getAnonymousId", false],
            ["SegmentIO", "getXID", false],
            ["SegmentIO", "initSegment", true],
            ["SegmentIO", "isInitialized", false],
            ["SegmentIO", "isSegmentUserAvailable", false],
            ["SegmentIO", "segmentDoReady", true],
            ["SegmentIO", "pageStitching", false],
            ["SegmentIO", "ready", true],
            ["SegmentIO", "stubSegmentMethods", true],
            ["SegmentIO", "trackEvent", false],
            ["SegmentIO", "trackPage", false],
            ["SegmentIO", "wrapSegment", false],
            ["Snowplow", "loadSnowplow", true],
            ["Snowplow", "trackPageView", false],
            ["Snowplow", "trackSelfDescribingEvent", false],
            ["Tracking", "autoTrackButtons", false],
            ["Tracking", "autoTrackLinks", false],
            ["Tracking", "autoTrackVideos", false],
            ["Tracking", "enrichEventData", false],
            ["Tracking", "logError", false],
            ["Tracking", "pageView", false],
            ["Tracking", "trackEvent", false],
            ["Tracking", "readWriteSessionCookie", false],
            ["Properties", "", false],
        ];

        // create a Map of modules and methods
        // Map(key: moduleName, value: [{methodName, isInit}])
        var moduleMap = new Map();
        for (var i = 0; i < methodList.length; i++) {
            var mod = methodList[i][0];
            var methods = moduleMap.get(mod);
            if (!methods) {
                methods = [];
            }
            methods.push({
                name: methodList[i][1],
                initMethod: methodList[i][2],
            });
            moduleMap.set(mod, methods);
        }
        return moduleMap;
    }

    /** Take the module list and create stubs for individual functions so they can be called before the 
     * wrapper is fully loaded and replayed after
     * @function stubWrapperMethods
     * @param {function} mockFactory - stub for mocking the factory function
     * @param {object} windowBase - base object to use for adding factories to
     */
    function stubWrapperMethods(mockFactory, windowBase) {
        // Create a queue, but don't obliterate an existing one!
        var modules = window.ace.analytics.MethodQueue.getWrapperMethods();
        window.ace.analytics.methodQueue = [];

        // Define a factory to create stubs. These are placeholders
        // for methods in atl-global.js so that they can be called 
        // before the wrapper is fully loaded
        var factory = mockFactory || function(mod, method, init) {
            return function() {
                var args = Array.prototype.slice.call(arguments);
                window.ace.analytics.methodQueue.unshift({
                    module: mod,
                    method: method,
                    args: args,
                    initMethod: init,
                });
                return window.ace.analytics.methodQueue;
            };
        };

        // add all of the defined methods to the window as stubs
        modules.forEach(function(methods, mod) {
            for (var i = 0; i < methods.length; i++) {
                var method = methods[i].name;
                var init = methods[i].initMethod;
                // for testing
                var base = windowBase || window.ace.analytics;
                base[mod] = base[mod] || {};
                if (method) {
                    base[mod][method] = factory(mod, method, init);
                }
            }
        });
    }

    /**
     * Creates factory methods for each of the Segment methods
     * @function stubSegmentMethods
     */
    function stubSegmentMethods() {
        var analytics = window.analytics = window.analytics || [];

        analytics.methods = [
            'trackSubmit',
            'trackClick',
            'trackLink',
            'trackForm',
            'pageview',
            'identify',
            'reset',
            'group',
            'track',
            'ready',
            'alias',
            'debug',
            'page',
            'once',
            'off',
            'on'
        ];

        // Define a factory to create stubs. These are placeholders
        // for methods in Analytics.js so that you never have to wait
        // for it to load to actually record data. The `method` is
        // stored as the first argument, so we can replay the data.
        analytics.factory = function(method) {
            return function() {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(method);
                analytics.push(args);
                return analytics;
            };
        };

        // For each of our methods, generate a queueing stub.
        for (var i = 0; i < analytics.methods.length; i++) {
            var key = analytics.methods[i];
            analytics[key] = analytics.factory(key);
        }
    }

    /** Replay a single method that has been stubbed
     * @function _replayMethod
     * @param {object} methodObject
     * @ignore
     */
    function _replayMethod(methodObject) {
        var mod = methodObject.module;
        var method = methodObject.method;
        var args = methodObject.args;

        window.ace.analytics[mod][method].apply(window.ace.analytics[mod], args);
    }

    /** Replay previously called methods
     * @function replayMethods
     * @param {boolean} initOnly - only replay the initialization methods
     * @param {function} mockReplay - used for mocking the replay method
     */
    function replayMethodQueue(initOnly, mockReplay) {
        // iterate backwards over the array so methods can be removed once they're called and preserve original call order
        for (var i = window.ace.analytics.methodQueue.length - 1; i >= 0; i--) {
            // only replay init methods if flag set
            if (initOnly && !window.ace.analytics.methodQueue[i].initMethod) {
                continue;
            }
            var replay = mockReplay || _replayMethod;
            replay(window.ace.analytics.methodQueue[i]);
            // remove this method from the queue
            window.ace.analytics.methodQueue.splice(i, 1);
        }
    }

    return {
        getWrapperMethods: getWrapperMethods,
        replayMethodQueue: replayMethodQueue,
        stubWrapperMethods: stubWrapperMethods,
        stubSegmentMethods: stubSegmentMethods,
    };
}();

var ace = ace || {};
ace.analytics = ace.analytics || {};
ace.analytics.version = '2.67.0';


loadAtlGlobal();

function getAtlGlobalVersion(finished) {
    "use strict";

    var ROLLOUT_FLAG = "atl-global-phased-roll-out";

    // initialize the LaunchDarkly SDK
    ace.analytics.LaunchDarkly.loadLDSDK(function() {
        ace.analytics.LaunchDarkly.initLaunchDarkly(function() { // success
            finished(ace.analytics.LaunchDarkly.getFeatureFlagForUser(ROLLOUT_FLAG));
        }, function() { // error
            // use the current version
            finished(ace.analytics.version);
        });
    }, function() { // error
        // use the current version
        finished(ace.analytics.version);
    });
}

function loadAtlGlobal() {
    "use strict";

    var GASV3_FLAG = "atl-global-destination-trigger";

    // stub all of the wrapper methods before load
    ace.analytics.MethodQueue.stubWrapperMethods();
    ace.analytics.MethodQueue.stubSegmentMethods();
    ace.analytics.Metrics.logMetric(ace.analytics.Metrics.METRICS_KEYS.TIME_TO_AVAILABLE);

    getAtlGlobalVersion(function(version) {
        // when segment is initialized replay all functions
        window.segmentReady = function() {
            ace.analytics.Metrics.logMetric(ace.analytics.Metrics.METRICS_KEYS.TIME_TO_READY);
            ace.analytics.Metrics.sendMetrics();
        };

        // when the versioned wrapper is loaded, replay all init functions that have been called
        ace.analytics.Loader.loadVersion(version, function() {
            var destinationFlag = ace.analytics.LaunchDarkly.getFeatureFlagForUser(GASV3_FLAG) || "segment";

            if (destinationFlag === "none") {
                return;
            }

            // make sure we're in a version of the wrapper that has GASv3 code included
            if (ace.analytics.GASv3) {
                ace.analytics.GASv3.loadGASFlag = (destinationFlag === "gasv3") || (destinationFlag === "both") || (destinationFlag === "gasv3+snowplow");
            }

            // make sure we're in a version of the wrapper that has Snowplow code included
            if (ace.analytics.Snowplow) {
                ace.analytics.Snowplow.loadSnowplowFlag = (destinationFlag === "snowplow") || (destinationFlag === "gasv3+snowplow");
            }

            ace.analytics.SegmentIO.loadSegmentFlag = (destinationFlag === "segment") || (destinationFlag === "both");

            ace.analytics.Metrics.logMetric(ace.analytics.Metrics.METRICS_KEYS.TIME_TO_LOAD);
            ace.analytics.MethodQueue.replayMethodQueue(true);
            ace.analytics.MethodQueue.replayMethodQueue(false);
        }, loadError);
    });
}

function loadError(version) {
    "use strict";

    ace.mkt.Helpers.sendWrapperLoadError();
}