import 'pixi-spine' // Do this once at the very start of your code. This registers the loader!
import './style.css'
import * as PIXI from 'pixi.js';
import { Spine } from 'pixi-spine';

const SML0 = "sml_cloth0", SML1 = "sml_cloth1", BIG0 = "big_cloth0", BIG1 = "big_cloth1";
const urlParams = new URLSearchParams(window.location.search);
const cont = new PIXI.Container();

// State
let isContinuousShootingEnabled = false
let app, urlFlag = false;

const idolMap = new Map();
const spineMap = new Map();

const migrateMap = {
    "sml_cloth0": "cb",
    "sml_cloth1": "cb_costume",
    "big_cloth0": "stand",
    "big_cloth1": "stand_costume",
}

async function init() {
    if (!PIXI.utils.isWebGLSupported()) {
        const hardwareAccel = new bootstrap.Modal(document.getElementById("divWebGL"));
        hardwareAccel.toggle();
        console.log('WebGL is not supported in this browser.');
    }

    const canvas = document.getElementById("canvas")

    app = new PIXI.Application({
        view: canvas,
        width: canvas.clientWidth - 1,
        height: canvas.clientHeight - 1,
    });
    app.stage.addChild(cont);

    const colorPicker = document.getElementById("colorPicker");
    colorPicker.onchange = (event) => {
        app.renderer.backgroundColor = String(event.target.value).replace(/#/, "0X");
    };

    console.log("111")
    fetch("https://api.shinycolors.moe/spine/idollist").then(async (response) => {
        const idolInfo = await response.json();
        const idolInfoMap = new Map();
        idolInfo.forEach((element) => {
            idolInfoMap.set(element.idolId, element);
        });
        await setupIdolList(idolInfoMap);
    });

}

async function setupIdolList(idolInfo) {
    const idolList = document.getElementById("idolList");
    let idolId = urlParams.has("idolId") ? Number(urlParams.get("idolId")) : 1,
        idolName = idolInfo.get(idolId).idolName;
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
    console.log("222")
    if (!idolMap.has(idolName)) {
        if (idolId == 0) {
            fetch(`https://cf-static.shinycolors.moe/others/hazuki.json`).then(async (response) => {
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
    console.log("333")
    const dressList = document.getElementById("dressList");
    dressList.innerHTML = "";

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
    console.log("444")
    const typeList = document.getElementById("typeList");
    let dressType;
    typeList.innerHTML = "";

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
    console.log("555")
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

async function setupAnimationList(spineData) {
    console.log("666")

    const defaultAnimation = "wait";

    // let currentSpine = new PIXI.spine.Spine(spineData);
    console.log(spineData)
    const spine = new Spine(spineData.spineData);
    console.log(spine)

    try {
        spine.skeleton.setSkinByName("normal");
    } catch (e) {
        spine.skeleton.setSkinByName("default");
    }
    
    console.log(spine.state.data)
    if(spine.state.hasAnimation(defaultAnimation)) {
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

function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

const clearState = (spine) => {
    spine.state.clearTracks();
    spine.skeleton.setToSetupPose();
    spine.lastTime = null;
};

async function renderToStage(currentSpine) {
    if (isContinuousShootingEnabled) { clearState(currentSpine) }
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

    if (isContinuousShootingEnabled) { await saveImage(); }
}


init()