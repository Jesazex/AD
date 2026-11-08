import { Component, Suspense, useLayoutEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, useProgress } from '@react-three/drei'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as THREE from 'three'

const fitted = new WeakMap()

function fitScene(scene) {
  const cached = fitted.get(scene)
  if (cached) return cached

  const root = new THREE.Group()
  const clone = scene.clone(true)
  root.add(clone)
  root.updateWorldMatrix(true, true)

  const box = new THREE.Box3().setFromObject(clone)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  clone.position.sub(center)
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  root.scale.setScalar(1.48 / maxDim)
  root.rotation.y = -0.42

  fitted.set(scene, root)
  return root
}

function LocalEnv() {
  const { gl, scene } = useThree()
  useLayoutEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = texture
    return () => {
      texture.dispose()
      pmrem.dispose()
      if (scene.environment === texture) scene.environment = null
    }
  }, [gl, scene])
  return null
}

function Relief({ url }) {
  const { scene } = useGLTF(url)
  const object = useMemo(() => fitScene(scene), [scene])
  return (
    <>
      <LocalEnv />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3.2, 4.2, 5]} intensity={1.85} />
      <directionalLight position={[-3.4, 1.6, 2.4]} intensity={0.55} />
      <directionalLight position={[0.4, 1.2, -4]} intensity={0.4} />
      <primitive object={object} />
    </>
  )
}

function Progress() {
  const { active, progress } = useProgress()
  if (!active) return null
  return (
    <div className="model-progress">
      <strong>{Math.round(progress)}%</strong>
      <span>Загрузка модели</span>
    </div>
  )
}

class ModelBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="model-progress">
          <span>Не удалось открыть модель</span>
        </div>
      )
    }
    return this.props.children
  }
}

export default function ModelView({ url }) {
  return (
    <div className="model-view">
      <ModelBoundary key={url}>
      <Canvas
        camera={{ position: [0.42, 0.08, 3.2], fov: 32, near: 0.05, far: 20 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        <Suspense fallback={null}>
          <Relief url={url} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.65}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.05}
          maxDistance={5.4}
          minPolarAngle={0.45}
          maxPolarAngle={Math.PI - 0.45}
        />
      </Canvas>
      </ModelBoundary>
      <Progress />
      <p className="orbit-hint">Вращайте модель</p>
    </div>
  )
}
