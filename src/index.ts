import 'pixi-spine' // Do this once at the very start of your code. This registers the loader!
import './style.css'
import * as PIXI from 'pixi.js';
import { Spine, SpineDebugRenderer } from 'pixi-spine';

const SML0 = "sml_cloth0", SML1 = "sml_cloth1", BIG0 = "big_cloth0", BIG1 = "big_cloth1";
const urlParams = new URLSearchParams(window.location.search);
const cont = new PIXI.Container();

// State
let app: PIXI.Application;
let spine: Spine;
let urlFlag = false;

const idolMap = new Map();
const spineMap = new Map();

const migrateMap = {
    "sml_cloth0": "cb",
    "sml_cloth1": "cb_costume",
    "big_cloth0": "stand",
    "big_cloth1": "stand_costume",
}
let relativeX = 0
let relativeY = 0

async function init() {
    if (!PIXI.utils.isWebGLSupported()) {
        console.log('WebGL is not supported in this browser.');
        return
    }
    const canvasAnthor = document.querySelector("#canvasAnthor");
    const canvas = document.createElement("canvas");
    canvas.className = 'img-fluid'
    canvasAnthor!.appendChild(canvas);

    app = new PIXI.Application({
        view: canvas,
        width: canvas.clientWidth - 1,
        height: canvas.clientHeight - 1,
        eventMode: 'dynamic',
    });
    app.stage.addChild(cont);

    const divSidebar = document.querySelector("#divSidebar");
    const colorPickerLabel = document.createElement("span");
    colorPickerLabel.innerHTML = "Background Color:"
    divSidebar!.appendChild(colorPickerLabel);
    
    const colorPicker = document.createElement("input");
    divSidebar!.appendChild(colorPicker);
    colorPicker.type = "color";
    colorPicker.id = "colorPicker"
    colorPicker.className = "mb-3 form-control w-100"
    colorPicker.onchange = (event) => {
        if (event.target !== null){
            app.renderer.backgroundColor = String(event.target.value).replace(/#/, "0X");
        }
    };

    // fetch("https://api.shinycolors.moe/spine/idollist")
    fetch("/idollist.json")
        .then(async (response) => {
            const idolInfo = await response.json();
            const idolInfoMap = new Map();
            idolInfo.forEach((element) => {
                idolInfoMap.set(element.idolId, element);
            });
            await setupIdolList(idolInfoMap);
        });

}

async function setupIdolList(idolInfo) {
    // const idolList = document.getElementById("idolList");
    const divSidebar = document.querySelector("#divSidebar");
    const idolListLabel = document.createElement("span");
    idolListLabel.innerHTML = "Idol:"
    divSidebar!.appendChild(idolListLabel);
    const idolList = document.createElement("select");
    idolList.className = 'form-select'
    idolList.id = 'idolList'
    divSidebar!.appendChild(idolList);


    let idolId = urlParams.has("idolId") ? Number(urlParams.get("idolId")) : 1;
    let idolName = idolInfo.get(idolId).idolName;
    idolList.innerHTML = "";

    idolInfo.forEach((element, index) => {
        const option = document.createElement("option");
        option.textContent = element.idolName;
        option.value = element.idolId;
        if (element.idolId === idolId) {
            option.selected = true;
        };
        idolList.appendChild(option);
    });

    idolList.onchange = async () => {
        idolId = idolList.value;
        idolName = idolInfo.get(Number(idolId)).idolName;
        await testAndLoadDress(idolId, idolName);
    };

    await testAndLoadDress(idolId, idolName);
}

async function testAndLoadDress(idolId, idolName) {
    if (!idolMap.has(idolName)) {
        if (idolId == 0) {
            // fetch(`https://cf-static.shinycolors.moe/others/hazuki.json`).then(async (response) => {
            //     idolMap.set(idolName, await response.json());
            //     await setupDressList(idolMap.get(idolName));
            // });
            fetch(`dressList.json`).then(async (response) => {
                idolMap.set(idolName, await response.json());
                await setupDressList(idolMap.get(idolName));
            });
        }
        else {
            fetch(`https://api.shinycolors.moe/spine/dressList?idolId=${idolId}`).then(async (response) => {
                idolMap.set(idolName, await response.json());
                await setupDressList(idolMap.get(idolName));
            });
        }
    }
    else {
        await setupDressList(idolMap.get(idolName));
    }
}

async function setupDressList(idolDressList) {
    // const dressList = document.getElementById("dressList");
    const divSidebar = document.querySelector("#divSidebar");
    const dressListLabel = document.createElement("span");
    dressListLabel.innerHTML = "Dress:"
    divSidebar!.appendChild(dressListLabel);
    const dressList = document.createElement("select");
    dressList.className = 'form-select'
    dressList.id = 'dressList'
    dressList.innerHTML = "";
    divSidebar!.appendChild(dressList);

    let lastType = "P_SSR", optGroup = document.createElement("optgroup");
    optGroup.label = "P_SSR";
    let arrayOrder = 0;

    idolDressList.forEach((element, index) => {
        if (element.dressType != lastType) {
            if (optGroup.childElementCount > 0) {
                dressList.appendChild(optGroup);
            }
            lastType = element.dressType;
            optGroup = document.createElement("optgroup");
            optGroup.label = element.dressType;
        }
        let option = document.createElement("option");
        option.textContent = element.dressName;
        option.setAttribute("value", index);
        option.setAttribute("enzaId", element.enzaId);
        if (element.idolId == 0) {
            option.setAttribute("path", element.path);
        }
        if (!element.exist) {
            option.setAttribute("disabled", true);
        }
        optGroup.appendChild(option);

        if (!urlParams.has("enzaId") && index == 0) {
            option.selected = true;
        }

        if (urlParams.has("enzaId") && element.enzaId.match(urlParams.get("enzaId")) && !urlFlag) {
            option.selected = true;
            arrayOrder = index;
        }
    });
    dressList.appendChild(optGroup);

    dressList.onchange = async () => {
        arrayOrder = dressList.value;
        await setupTypeList(idolDressList[arrayOrder]);
    };

    await setupTypeList(idolDressList[arrayOrder]);
}

async function setupTypeList(dressObj) {
    // const typeList = document.getElementById("typeList");
    const divSidebar = document.querySelector("#divSidebar");
    const typeListLabel = document.createElement("span");
    typeListLabel.innerHTML = "Type:"
    divSidebar!.appendChild(typeListLabel);

    const typeList = document.createElement("select");
    typeList.className = 'form-select'
    typeList.id = 'typeList'
    typeList.innerHTML = "";
    divSidebar!.appendChild(typeList);

    let dressType;
    let big0, big1, sml0, sml1;
    let flag_sml0 = false, flag_big0 = false,
        flag_sml1 = false, flag_big1 = false;
    if (dressObj.sml_Cloth0) {
        flag_sml0 = true;
        sml0 = document.createElement("option");
        sml0.textContent = "Q版_通常服";
        sml0.value = SML0;
        typeList.appendChild(sml0);
    }
    if (dressObj.sml_Cloth1) {
        flag_sml0 = true;
        sml1 = document.createElement("option");
        sml1.textContent = "Q版_演出服";
        sml1.value = SML1;
        typeList.appendChild(sml1);
    }
    if (dressObj.big_Cloth0) {
        flag_big0 = true;
        big0 = document.createElement("option");
        big0.textContent = "一般_通常服";
        big0.value = BIG0;
        typeList.appendChild(big0);
    }
    if (dressObj.big_Cloth1) {
        flag_big1 = true;
        big1 = document.createElement("option");
        big1.textContent = "一般_演出服";
        big1.value = BIG1;
        typeList.appendChild(big1);
    }

    if (urlParams.has("dressType")
        && (urlParams.get("dressType") === SML0
            || urlParams.get("dressType") === SML1
            || urlParams.get("dressType") === BIG0
            || urlParams.get("dressType") === BIG1)
        && !urlFlag) {

        const typeFromUri = urlParams.get("dressType");
        switch (typeFromUri) {
            case SML0:
                dressType = SML0;
                sml0.selected = true;
                break;
            case SML1:
                dressType = SML1;
                sml1.selected = true;
                break;
            case BIG0:
                dressType = BIG0;
                big0.selected = true;
                break;
            case BIG1:
                dressType = BIG1;
                big1.selected = true;
                break;
        }

        urlFlag = true;
    }
    else {
        if (flag_big0) {
            dressType = BIG0;
            big0.selected = true;
        }
        else if (flag_big1) {
            dressType = BIG1;
            big1.selected = true;
        }
        else if (flag_sml0) {
            dressType = SML0;
            sml0.selected = true;
        }
        else if (flag_sml1) {
            dressType = SML1;
            sml1.selected = true;
        }
    }

    typeList.onchange = async () => {
        const dressList = document.getElementById("dressList");
        dressType = typeList.value;

        if (dressObj.idolId == 0) {
            await testAndLoadAnimation(dressList.options[dressList.selectedIndex].getAttribute("path"), dressType, true);
        }
        else {
            await testAndLoadAnimation(dressList.options[dressList.selectedIndex].getAttribute("enzaId"), dressType);
        }
    };

    if (dressObj.idolId == 0) {
        await testAndLoadAnimation(dressObj.path, dressType, true);
    }
    else {
        await testAndLoadAnimation(dressObj.enzaId, dressType);
    }

}

async function testAndLoadAnimation(enzaId, type, flag = false) {
    if (!spineMap.has(`${enzaId}/${type}`)) {
        if (flag) {
            PIXI.Assets.load(`https://cf-static.shinycolors.moe/spine/sub_characters/${migrateMap[type]}/${enzaId}`)
                .then(async (resource) => {
                    console.log("waifu", resource)
                    const waifu = resource.spineData;
                    spineMap.set(`${enzaId}/${type}`, waifu);
                    await setupAnimationList(waifu);
                });
        }
        else {
            // PIXI.Assets.load(`https://cf-static.shinycolors.moe/spine/idols/${migrateMap[type]}/${enzaId}/data.json`)
            // PIXI.Assets.load(`/data.json`)
            // .then(async (resource) => {
            //     console.log("waifu", resource)
            //     spineMap.set(`${enzaId}/${type}`, resource);
            //     await setupAnimationList(resource);
            // });
            const texture = await PIXI.Assets.load('/data.json');
            spineMap.set(`${enzaId}/${type}`, texture);
            console.log("texture", texture)
            await setupAnimationList(texture);
        }
    }
    else {
        await setupAnimationList(spineMap.get(`${enzaId}/${type}`));
    }
}

async function setupAnimationList(texture) {
    const divSidebar = document.querySelector("#divSidebar");
    const animationListLabel = document.createElement("span");
    animationListLabel.innerHTML = "Animation:"
    divSidebar!.appendChild(animationListLabel);
    
    const animationList = document.createElement("select");
    animationList.className = 'form-select'
    animationList.id = 'animationList'
    animationList.innerHTML = "";
    divSidebar!.appendChild(animationList);

    const defaultAnimation = "wait";
    // let currentSpine = new PIXI.spine.Spine(spineData);
    console.log(texture)
    spine = new Spine(texture.spineData);

    // spine.on('globalmousemove', (event) => { 
    //     console.log(event);
    //     relativeX = event.page.x - window.innerWidth / 2;
    //     relativeY = event.page.y - window.innerHeight / 2;
    //     console.log(relativeX, relativeY);
    // });
    app.ticker.add((delta) => {
        // spine.spineData.bones[19].rotation += 0.01
        // spine.spineData.bones[5].rotation += 0.01
        // console.log(spine.spineData.bones[19].rotation)
    })

    spine.spineData.animations.forEach((animate, index) => {
        let option = document.createElement("option");
        animationList.appendChild(option);
        option.textContent = animate.name;
        option.setAttribute("value", index);
        option.setAttribute("name", animate.name);
    });

    animationList.onchange = () => {
        // console.log(animationList)
        const selectedAnimationName = animationList.options[animationList.selectedIndex].getAttribute("name")
        spine.state.setAnimation(0, selectedAnimationName!, true);
    };

    console.log("spine.spineData.animations", spine.spineData.animations)
    console.log("spine.spineData.bones", spine.spineData.bones)

    try {
        spine.skeleton.setSkinByName("normal");
    } catch (e) {
        spine.skeleton.setSkinByName("default");
    }

    console.log("spine.state.data", spine.state.data)
    if (spine.state.hasAnimation(defaultAnimation)) {
        // run forever, little boy!
        spine.state.setAnimation(0, defaultAnimation, true);
        // dont run too fast
        // spine.state.timeScale = 0.1;
        // update yourself
        spine.autoUpdate = true;
    }
    // add the animation to the scene and render...
    app.stage.addChild(spine);

    await renderToStage(spine);
}


const clearState = (spine) => {
    spine.state.clearTracks();
    spine.skeleton.setToSetupPose();
    spine.lastTime = null;
};


async function renderToStage(currentSpine) {
    cont.removeChild(cont.children[0]);
    cont.addChild(currentSpine);

    const dressType = document.getElementById("typeList").value;
    const spineLocalBound = currentSpine.getLocalBounds();

    currentSpine.position.set(-spineLocalBound.x, -spineLocalBound.y);

    let scale = 0.9;
    switch (dressType) {
        case SML0:
            break;
        case SML1:
            scale = 2.5;
            break;
        case BIG0:
        case BIG1:
            scale = (app.view.height / currentSpine.spineData.height) * 0.9;
            break;
    }

    const contLocalBound = cont.getLocalBounds();
    cont.scale.set(scale);
    cont.pivot.set(contLocalBound.width / 2, contLocalBound.height / 2);
    cont.position.set(app.view.width / 2, app.view.height / 2);

}


init()