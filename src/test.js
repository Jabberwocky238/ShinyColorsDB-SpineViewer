import * as PIXI from 'pixi.js';

const app = new PIXI.Application({ background: '#1099bb', resizeTo: window, eventMode: 'dynamic' });

document.body.appendChild(app.view);

// create a new Sprite from an image path
const bunny = PIXI.Sprite.from('https://pixijs.com/assets/bunny.png');
let relativeX = 0
let relativeY = 0
// app.on('pointerdown', (event) => { alert('clicked!'); });
bunny.on('globalmousemove', (event) => { 
    // console.log(event);
    // console.log(event.page.x, window.innerHeight, event.page.y, event.client.y);
    relativeX = event.page.x - window.innerWidth / 2;
    relativeY = event.page.y - window.innerHeight / 2;
    console.log(relativeX, relativeY);
});
// center the sprite's anchor point
bunny.anchor.set(0.5);

// move the sprite to the center of the screen
bunny.x = app.screen.width / 2;
bunny.y = app.screen.height / 2;

app.stage.addChild(bunny);

// Listen for animate update
app.ticker.add((delta) => {
    // just for fun, let's rotate mr rabbit a little
    // delta is 1 if running at 100% performance
    // creates frame-independent transformation
    bunny.rotation += 0.1 * delta;

    const readyX = bunny.x + relativeX * 0.001;
    if(readyX < window.innerWidth && readyX > 0){
        bunny.x += relativeX * 0.001;
    }
    
    const readyY = bunny.x + relativeX * 0.001;
    if(readyY < window.innerHeight && readyY > 0){
        bunny.y += relativeY * 0.001;
    }
});
