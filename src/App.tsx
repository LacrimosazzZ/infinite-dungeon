import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "stats.js";

const App: React.FC = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const shipRef = useRef<THREE.Group | null>(null); // 引用战舰模型
  const snowRef = useRef<THREE.Group | null>(null);
  const modelsRef = useRef<THREE.Group[]>([]);

  // 按键状态控制战舰移动
  const keyState = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  useEffect(() => {
    // Stats.js 用于性能监控
    const stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: memory
    document.body.appendChild(stats.dom);

    // 创建场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 加载星空纹理背景
    const loader = new THREE.TextureLoader();
    loader.load(
      "https://threejsfundamentals.org/threejs/resources/images/starfield.jpg",
      (texture) => {
        scene.background = texture;
      }
    );

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 20);
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 启用阴影
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 创建光源
    const ambientLight = new THREE.AmbientLight(0x404040); // 环境光
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 创建雪花效果
    const createSnow = () => {
      const texture = new THREE.TextureLoader().load(
        "https://cdn.jsdelivr.net/gh/devReemoNg/EE5808-models/static/snow.png"
      );
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const snowGroup = new THREE.Group();

      for (let i = 0; i < 2000; i++) {
        const sprite = new THREE.Sprite(spriteMaterial);
        snowGroup.add(sprite);
        sprite.scale.set(1.5, 1.5, 1.5);

        const x = 1000 * (Math.random() - 0.5);
        const y = 600 * Math.random();
        const z = 1000 * (Math.random() - 0.5);
        sprite.position.set(x, y, z);
      }

      return snowGroup;
    };

    const snow = createSnow();
    scene.add(snow);
    snowRef.current = snow;

    // 加载战舰模型
    const loadModels = async () => {
      const gltfLoader = new GLTFLoader();
      const modelUrls = [
        "https://cdn.jsdelivr.net/gh/devReemoNg/EE5808-models/constitution_ii_class_railgun_destroyer_ddr-2000/scene.gltf",
      ];

      const models: THREE.Group[] = [];

      for (let url of modelUrls) {
        const gltf = await gltfLoader.loadAsync(url);
        const model = gltf.scene;

        model.traverse((object) => {
          if (object.castShadow !== undefined) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });

        model.scale.set(1, 1, 1);
        model.position.set(0, 0, 0);
        models.push(model);
        scene.add(model);

        // 设置对战舰的引用
        shipRef.current = model;
      }

      modelsRef.current = models;
      setModelsLoaded(true);
    };

    loadModels();

    // 创建 OrbitControls 以实现相机控制
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;

    // 动画更新
    const clock = new THREE.Clock();
    clockRef.current = clock;

    const animate = () => {
      stats.begin();

      const delta = clock.getDelta();
      if (modelsLoaded && shipRef.current) {
        const ship = shipRef.current;

        // 根据按键更新战舰位置
        const moveSpeed = 0.1;
        if (keyState.current.w) ship.position.z -= moveSpeed; // 向前
        if (keyState.current.s) ship.position.z += moveSpeed; // 向后
        if (keyState.current.a) ship.position.x -= moveSpeed; // 向左
        if (keyState.current.d) ship.position.x += moveSpeed; // 向右
      }

      // 雪花动画
      snow.children.forEach((sprite) => {
        sprite.position.y -= delta * 60;
        if (sprite.position.y < -100) {
          sprite.position.y = 600;
        }
      });

      controls.update();
      renderer.render(scene, camera);
      stats.end();
      requestAnimationFrame(animate);
    };

    animate();

    // 处理窗口尺寸变化
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 监听键盘按键事件
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "w") keyState.current.w = true;
      if (e.key === "a") keyState.current.a = true;
      if (e.key === "s") keyState.current.s = true;
      if (e.key === "d") keyState.current.d = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w") keyState.current.w = false;
      if (e.key === "a") keyState.current.a = false;
      if (e.key === "s") keyState.current.s = false;
      if (e.key === "d") keyState.current.d = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [modelsLoaded]);

  return <div />;
};

export default App;
