window.onload = () => {
    let style = document.createElement('STYLE');
    style.innerText = `
        body {
            background-color: #353535;
            color: white;
        }

        a {
            color: inherit;
            margin-bottom: 1em;
        }

        #logo {
            width: 30px;
        }
        
        canvas {
          image-rendering: optimizeSpeed;             /* Older versions of FF          */
          image-rendering: -moz-crisp-edges;          /* FF 6.0+                       */
          image-rendering: -webkit-optimize-contrast; /* Safari                        */
          image-rendering: -o-crisp-edges;            /* OS X & Windows Opera (12.02+) */
          image-rendering: pixelated;                 /* Awesome future-browsers       */
          -ms-interpolation-mode: nearest-neighbor;   /* IE                            */

          border: dashed 1px lightgrey;
          background-color: white;
        }

        main {
            display: flex;
            flex-direction: column;
            width: 20em;
        }

        input {
            width: 100%;
            display: block;
        }
    `;

    let tpl = document.createElement('TEMPLATE');

    document.body.appendChild(tpl);
    document.body.appendChild(style);

    document.querySelector('#a').value = '(Tl X: 1068, Tl Y: 704, Px X: 830, Px Y: 633) ';
    document.querySelector('#b').value = '(Tl X: 1068, Tl Y: 704, Px X: 983, Px Y: 898)';

    let submit = document.querySelector('#submit');
    submit.onclick = async () => {
        let tpl = document.getElementsByTagName('template')[0];

        let a = document.querySelector('#a').value;
        let b = document.querySelector('#b').value;

        run(tpl, a, b);
    };

    submit.click();
};

async function run(tpl, a, b) {

    let dimensions = get_dimensions(a, b);
    let canvas = init(dimensions);
    let tiles = get_tiles(dimensions);
    let imgs = await get_imgs(tpl, tiles);

    draw(canvas, imgs, dimensions);
}

function get_dimensions(a, b) {
    let ca = parse_px(a);
    let cb = parse_px(b);
    let [atx, aty, apx, apy] = ca;
    let [btx, bty, bpx, bpy] = cb;

    let c = [
        [atx * 1000 + Math.sign(atx) * apx, aty * 1000 + Math.sign(aty) * apy],
        [btx * 1000 + Math.sign(btx) * bpx, bty * 1000 + Math.sign(bty) * bpy]
    ];

    let w = c[1][0] - c[0][0];
    let h = c[1][1] - c[0][1];

    if (w < 0 || h < 0) {
        ono('Expected top left corner, then bottom right corner');
    }

    if (w > 1000 || h > 1000) {
        ono('Sides of the area cannot be larger than 1000px');
    }

    let p = [];
    p.push(c[0]);
    p.push([p[0][0] + w, p[0][1]]);
    p.push(c[1]);
    p.push([p[0][0], p[0][1] + h]);

    return {
        ca: ca,
        cb: cb,
        atx: atx,
        aty: aty,
        apx: apx,
        apy: apy,
        btx: btx,
        bty: bty,
        bpx: bpx,
        bpy: bpy,
        w: w,
        h: h,
        p: p,
    }
}

function init(d) {
    let canvas = document.getElementsByTagName('canvas')[0];
    canvas.width = d.w + 1;
    canvas.height = d.h + 1;

    return canvas;
}

function get_tiles(d) {
    let t = [];
    t.push([d.atx, d.aty]);
    t.push([t[0][0] + 1, t[0][1]]);
    t.push([t[0][0] + 1, t[0][1] + 1]);
    t.push([t[0][0], t[0][1] + 1]);

    let o = [];

    for (let tn of t) {
        if (overlaps(tn, d)) {
            o.push(tn);
        }
    }

    return o;
}

function parse_px(str) {
    let components = [... str.matchAll(/\d+/g)];  

    if (components.length != 4) {
        ono('Invalid coordinates, expected 4 numbers');
    }

    return components.map((x) => {
        return parseInt(x, 10);
    });
}

function overlaps(tn, d) {
    let rx = [tn[0] * 1000, tn[0] * 1000 + 1000 * Math.sign(tn[0])].sort();
    let ry = [tn[1] * 1000, tn[1] * 1000 + 1000 * Math.sign(tn[1])].sort();

    for (let pn of d.p) {
        if (pn[0] >= rx[0] && pn[0] <= rx[1] && pn[1] >= ry[0] && pn[1] <= ry[1]) {
            return true;
        }
    }

    return false;
}

async function get_imgs(tpl, tiles) {
    let imgs = [];

    for (let tile of tiles) {
        let img = document.createElement('IMG');
        tpl.appendChild(img);
        img.src = tile_url(tile);
        imgs.push(img);
    }

    load: while (true) {
        await new Promise(r => setTimeout(r, 50));

        for (let img of imgs) {
            if (!img.complete) {
                continue load;
            }
        }

        break;
    }

    return imgs;
}

function tile_url(tile) {
    return `https://backend.wplace.live/files/s0/tiles/${tile[0]}/${tile[1]}.png`;
}

function draw(canvas, imgs, d) {
    let ctx = canvas.getContext('2d');
    let i = 0;

    for (let img of imgs) {
        let dx = (i == 1 || i == 2) ? 1000 : 0;
        let dy = (i == 2 || i == 3) ? 1000 : 0;

        dx -= d.apx;
        dy -= d.apy;

        //drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        ctx.drawImage(img, 0, 0, 1000, 1000, dx, dy, 1000, 1000);

        i++;
    }
}
