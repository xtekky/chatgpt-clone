window.dc674d      = window.fetch
const n            = window.navigator
const browser_data = {
    a: n.userAgent,
    b: n.platform,
    c: n.language,
    d: n.cookieEnabled,
    e: n.onLine,
    f: n.doNotTrack,
    g: n.javaEnabled(),
    i: n.appName,
    j: n.mediaDevices,
    k: n.appCodeName,
    l: n.product,
    m: n.productSub,
    n: n.hardwareConcurrency,
    o: n.maxTouchPoints,
    p: n.vendor,
    q: n.vendorSub,
    r: n.oscpu,
    s: n.buildID,
    t: n.mimeTypes,
    u: n.plugins
}

function shift(s) {
    return s.replace(
        /[A-Z0-9+/=]/gi,
        (c) =>
            "nea97XU2LmOy1tD40jo-JvRhpbuFfgT3CKW6NIwArPqQlxskZ5c8zd.YVMiEBSHG="[
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(
                c
            )
        ]
    );
}

function shuffle(t) {
    const e = Object.keys(t);
    for (let t = e.length - 1; t > 0; t--) {
        const n = Math.floor(Math.random() * (t + 1));
        [e[t], e[n]] = [e[n], e[t]];
    }

    const n = {};
    for (let o = 0; o < e.length; o++) n[e[o]] = t[e[o]];
    return n;
}

const b64 = (u8) => {
    return btoa(String.fromCharCode.apply(null, u8))
};

async function get_shape() {
    let key   = `chatgpt.rip.6675636b206f6666202122a72425262f28293d3f`
    plain_sec = JSON.stringify({
        ...shuffle(browser_data),
        timestamp: Date.now()
    })

    return shift(await b64(encrypt(plain_sec, key)))
}

window.fetch = async function (url, config) {
    shape_info = await get_shape()

    return window.dc674d(url, {
        ...config,
        headers: {
            ...{ "x-shape-info": shape_info },
            ...((config && config.headers) || {})
        }
    })
}

function key_scheduling(key) {
    let sched = [...Array(256).keys()]

    let i = 0
    for (let j = 0; j < 256; j++) {
        i = (i + sched[j] + key[j % key.length]) % 256

        let tmp  = sched[j]
        sched[j] = sched[i]
        sched[i] = tmp
    }

    return sched
}

function* stream_generation(sched) {
    let i = 0
    let j = 0

    while (true) {
        i = (1 + i) % 256
        j = (sched[i] + j) % 256

        let tmp  = sched[j]
        sched[j] = sched[i]
        sched[i] = tmp

        yield sched[(sched[i] + sched[j]) % 256]
    }
}

function encrypt(text, key) {
    let textArr   = [...text].map((char) => char.charCodeAt())
    let keyArr    = [...key].map((char) => char.charCodeAt())
    let sched     = key_scheduling(keyArr)
    let keyStream = stream_generation(sched)

    return textArr.map((char) => char ^ keyStream.next().value)
}

function decrypt(ciphertext, key) {
    let keyArr      = [...key].map((char) => char.charCodeAt())
    let sched       = key_scheduling(keyArr)
    let keyStream   = stream_generation(sched)

    return ciphertext
        .map((char) => String.fromCharCode(char ^ keyStream.next().value))
        .join("")
}
