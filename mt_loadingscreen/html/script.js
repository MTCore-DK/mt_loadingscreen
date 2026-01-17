// Standard Globals
const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Scene og Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,500);
camera.position.set(0,2,5);

// Audio analyser setup
const audioElem = document.getElementById('music');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
const audioSource = audioCtx.createMediaElementSource(audioElem);
audioSource.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 256;
const dataArray = new Uint8Array(analyser.frequencyBinCount);

// Lys (Ambient + Spot)
const ambient = new THREE.AmbientLight(0x444444);
scene.add(ambient);

const spot = new THREE.SpotLight(0xff7f00,2,20,Math.PI/4,0.5);
spot.position.set(5,10,5);
scene.add(spot);

// Partikler
const particleCount = 2000;
const particles = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

for(let i=0;i<particleCount;i++){
    positions[i*3+0] = (Math.random()-0.5)*10;
    positions[i*3+1] = (Math.random()-0.5)*10;
    positions[i*3+2] = (Math.random()-0.5)*10;

    colors[i*3+0] = Math.random();
    colors[i*3+1] = Math.random();
    colors[i*3+2] = Math.random();
}

particles.setAttribute('position',new THREE.BufferAttribute(positions,3));
particles.setAttribute('color',new THREE.BufferAttribute(colors,3));

const mat = new THREE.PointsMaterial({
    size:0.12,
    vertexColors:true,
    map:new THREE.TextureLoader().load('particles.png'),
    blending:THREE.AdditiveBlending,
    transparent:true,
});

const particleSystem = new THREE.Points(particles, mat);
scene.add(particleSystem);

// UI Progress + Player
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const currentPlayers = document.getElementById('current-players');
const maxPlayers = document.getElementById('max-players');
maxPlayers.textContent = Config.maxPlayers;

// Progress simulering
let progress = 0;
function updateProgress(){
    if(progress < 100) progress += Math.random()*0.8;
    if(progress > 100) progress = 100;
    progressBar.style.width = progress + '%';
    progressText.textContent = Math.floor(progress)+'% Loaded';
    requestAnimationFrame(updateProgress);
}

// Player count simulering
let players = 0;
function updatePlayers(){
    if(players < Config.maxPlayers) players = Math.floor(Math.random() * Config.maxPlayers);
    currentPlayers.textContent = players;
    requestAnimationFrame(updatePlayers);
}

// Animation Loop
function animate(){
    requestAnimationFrame(animate);

    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a,b)=>a+b)/dataArray.length;

    // Kamera gynger let med musikken
    camera.position.x = Math.sin(Date.now()/1500)*0.5;
    camera.position.y = 1 + Math.sin(Date.now()/1000)*0.2;
    camera.lookAt(0,0,0);

    // Partikler reagerer
    particleSystem.rotation.y += 0.0005 + avg/200000;
    const positions = particles.attributes.position.array;
    for(let i=0;i<positions.length;i+=3){
        positions[i+1] += Math.sin(avg/50 + i) * 0.0005;
    }
    particles.attributes.position.needsUpdate = true;

    // Lys farver
    spot.color.setHSL((avg/256),1,0.5);

    renderer.render(scene,camera);
}

window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
});

// Start
animate();
updateProgress();
updatePlayers();
